import type { FastifyInstance } from "fastify";
import WebSocket from "ws";
import crypto from "node:crypto";

type Role = "P1" | "P2";

// canvas values //

const WIDTH = 800;
const HEIGHT = 600;

// game constant.ts values //

const MAX_SCORE = 8;

const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const PADDLE_MARGIN = 40;
const PADDLE_SPEED = 6;

const BALL_RADIUS = 10;
const BALL_SPEED = 5;
const BALL_SPEEDUP = 1.06;
const BALL_MAX_SPEED = 14;

const SERVE_DELAY_MS = 1200;

// types //

type ClientMsg =
  | { type: "ping" }
  | { type: "queue:join" }
  | { type: "queue:leave" }
  | { type: "game:input"; dir: "up" | "down"; pressed: boolean }
  | { type: "game:pause"; paused: boolean }
  | { type: "match:reconnect" };

type ServerMsg =
  | { type: "connected" }
  | { type: "pong" }
  | { type: "queue:joined" }
  | { type: "queue:left" }
  | { type: "match:found"; matchId: string; youAre: Role }
  | { type: "match:reconnect_denied"; reason: string }
  | {
      type: "game:state";
      tick: number;
      paused: boolean;
      pauseMessage?: string;
      ball: { x: number; y: number; vx: number; vy: number; r: number };
      p1: { y: number };
      p2: { y: number };
      score: { p1: number; p2: number };
    }
  | { type: "game:over"; winner: Role; score: { p1: number; p2: number } };
  
type Room = {
  p1: WebSocket | null;
  p2: WebSocket | null;
  
  // bind slots to real users (stable across tab close)
  p1UserId: number;
  p2UserId: number;
  
  tick: number;
  
  // inputs (authoritative)
  p1Up: boolean;
  p1Down: boolean;
  p2Up: boolean;
  p2Down: boolean;
  
  // state
  p1Y: number;
  p2Y: number;
  
  ball: { x: number; y: number; vx: number; vy: number };
  
  scoreP1: number;
  scoreP2: number;
  
  paused: boolean;
  userPaused?: boolean;
  
  pauseMessage: string;
  serveTimeout?: NodeJS.Timeout;
  serveStartAtMs?: number;
  serveDelayMs?: number;
  serveDir?: 1 | -1;
  serveInProgress?: boolean;
  pendingServeRemainingMs?: number;
  
  // grace timers
  p1DisconnectTimer?: NodeJS.Timeout;
  p2DisconnectTimer?: NodeJS.Timeout;
  
  // grace countdown
  disconnectDeadlineMs?: number;
  disconnectCountdownInterval?: NodeJS.Timeout;
  
  readyTimeout?: NodeJS.Timeout;
  
  interval?: NodeJS.Timeout;
};

const rooms = new Map<string, Room>();
const socketToMatch = new Map<WebSocket, { matchId: string; role: Role }>();
const waiting = new Set<WebSocket>();
const socketToUserId = new Map<WebSocket, number>();
const wsAlive = new Map<WebSocket, boolean>();

setInterval(() => {
  for (const [ws, alive] of wsAlive) {
    if (!ws) {
      wsAlive.delete(ws as any);
      continue;
    }
    // if not open, forget it
    if (ws.readyState !== WebSocket.OPEN) {
      wsAlive.delete(ws);
      continue;
    }
    
    // if last cycle didnt get pong -> kill it (zombie)
    if (!alive) {
      try {
        ws.terminate();
      }
      catch {}
      forceCloseCleanup(ws, "heartbeat");
      continue;
    }
    
    // expect pong next round
    wsAlive.set(ws, false);
    try {
      ws.ping();
    }
    catch {}
  }
}, 5000);

// helpers //
function purgeDeadWaiting() {
  for (const ws of waiting) {
    if (ws.readyState !== WebSocket.OPEN) waiting.delete(ws);
  }
}

function safeJson(raw: any): any | null {
  try {
    return JSON.parse(raw.toString());
  }
  catch {
    return null;
  }
}

function forceCloseCleanup(ws: WebSocket, why: string) {
  // remove queue
  waiting.delete(ws);

  // remove identity maps
  socketToUserId.delete(ws);
  
  wsAlive.delete(ws);

  const info = socketToMatch.get(ws);
  if (!info) {
    for (const room of rooms.values()) {
      if (room.p1 === ws)
        room.p1 = null;
      if (room.p2 === ws)
        room.p2 = null;
    }
    return;
  }

  const room = rooms.get(info.matchId);
  socketToMatch.delete(ws);

  if (!room)
    return;

  if (info.role === "P1" && room.p1 === ws)
    room.p1 = null;
  if (info.role === "P2" && room.p2 === ws)
    room.p2 = null;

  // pause + grace countdown will be handled by your normal disconnect logic
  // but we need to trigger it here if the close event never arrives.
  // So: simulate the start of grace period.
  room.paused = true;
  room.pauseMessage = `WAITING 10s FOR RECONNECT (${why})`;
  broadcastState(room);

  // if you want: start grace timer here too (optional)
}

function send(ws: WebSocket | null, msg: ServerMsg) {
  if (!ws)
    return;
  if (ws.readyState !== WebSocket.OPEN)
    return;
  ws.send(JSON.stringify(msg));
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function paddleRect(role : Role, y: number) {
  const x = role === "P1" ? PADDLE_MARGIN : WIDTH - PADDLE_MARGIN - PADDLE_WIDTH;
  return { x, y, w: PADDLE_WIDTH, h: PADDLE_HEIGHT };
}

function hitPaddle(px: number, py: number, pw: number, ph: number, bx: number, by: number, br: number) {
  const paddleLeft = px;
  const paddleRight = px + pw;
  const paddleTop = py;
  const paddleBottom = py + ph;
  
  const ballLeft = bx - br;
  const ballRight = bx + br;
  const ballTop = by - br;
  const ballBottom = by + br;
  
  const overlapX = ballRight > paddleLeft && ballLeft < paddleRight;
  const overlapY = ballBottom > paddleTop && ballTop < paddleBottom;
  
  return overlapX && overlapY;
}

function resetBall(room: Room, direction: 1 | - 1) {
  room.ball.x = WIDTH / 2;
  room.ball.y = HEIGHT / 2;
  
  // simple serve angle (-30 degree to 30 degree)
  const maxAngle = Math.PI / 6;
  const angle = (Math.random() * 2 - 1) * maxAngle;
  
  room.ball.vx = Math.cos(angle) * BALL_SPEED * direction;
  room.ball.vy = Math.sin(angle) * BALL_SPEED;
}

function beginServe(room: Room, direction: 1 | -1, delayMs = SERVE_DELAY_MS) {
  if (room.serveTimeout)
    clearTimeout(room.serveTimeout);
  
  room.serveInProgress = true;
  room.serveDir = direction;
  room.serveStartAtMs = Date.now();
  room.serveDelayMs = delayMs;
  room.pendingServeRemainingMs = undefined;
  
  room.paused = true;
  room.pauseMessage = direction === 1 ? "RIGHT SERVES" : "LEFT SERVES";
  
  // freeze ball at center 
  room.ball.x = WIDTH / 2;
  room.ball.y = HEIGHT / 2;
  room.ball.vx = 0;
  room.ball.vy = 0;
  
  broadcastState(room);
  
  room.serveTimeout = setTimeout(() => {
    room.serveTimeout = undefined;
    
    // serve countdown finished
    room.serveInProgress = false;
    
    // only block serving if user manually paused 
    if (room.userPaused) {
      room.pendingServeRemainingMs = 0;
      broadcastState(room);
      return;
    }
    
    const maxAngle = Math.PI / 6;
    const angle = (Math.random() * 2 - 1) * maxAngle;
    room.ball.vx = Math.cos(angle) * BALL_SPEED * direction;
    room.ball.vy = Math.sin(angle) * BALL_SPEED;
    
    room.paused = false;
    room.pauseMessage = "";
    
    broadcastState(room);
  }, delayMs);
}

function findRoomByUser(userId: number): { matchId: string; room: Room } | null {
  for (const [matchId, room] of rooms.entries()) {
    if (room.p1UserId === userId || room.p2UserId === userId) {
      return { matchId, room };
    }
  }
  return null;
}

function removeFromQueue(ws: WebSocket) {
  waiting.delete(ws);
}

function cleanupMatch(matchId : string) {
  const room = rooms.get(matchId);
  if (!room)
    return;
  
  if (room.interval)
    clearInterval(room.interval);
  if (room.serveTimeout)
    clearTimeout(room.serveTimeout);
  if (room.p1DisconnectTimer)
    clearTimeout(room.p1DisconnectTimer);
  if (room.p2DisconnectTimer)
    clearTimeout(room.p2DisconnectTimer);
  if (room.disconnectCountdownInterval)
    clearInterval(room.disconnectCountdownInterval);
  
  rooms.delete(matchId);
  if (room.p1)
    socketToMatch.delete(room.p1);
  if (room.p2)
    socketToMatch.delete(room.p2);
}

function broadcastState(room :Room) {
  const payload: ServerMsg = {
    type: "game:state",
    tick: room.tick,
    paused: room.paused,
    pauseMessage: room.pauseMessage || undefined,
    ball: { x: room.ball.x, y: room.ball.y, vx: room.ball.vx, vy: room.ball.vy, r: BALL_RADIUS },
    p1: { y: room.p1Y },
    p2: { y: room.p2Y },
    score: { p1: room.scoreP1, p2: room.scoreP2 },
  };
  
  send(room.p1, payload);
  send(room.p2, payload);
}

function freezeServeIfRunning(room: Room) {
  if (!room.serveInProgress || !room.serveStartAtMs || !room.serveDelayMs)
    return;
  
  const elapsed = Date.now() - room.serveStartAtMs;
  const remaining = Math.max(0, room.serveDelayMs - elapsed);
  
  room.pendingServeRemainingMs = remaining;
  
  if (room.serveTimeout) {
    clearTimeout(room.serveTimeout);
    room.serveTimeout = undefined;
  }
  room.serveInProgress = false;
}

// main //

export async function gameWs(app: FastifyInstance) {
  app.get(
    "/ws/game", 
    {
      websocket: true,
      preHandler: (app as any).authenticate,
    },
    (connection, req: any) => {
      const socket: WebSocket | undefined = connection?.socket ?? connection;
      
      if (!socket || typeof (socket as any).on !== "function") {
        req.log.error({
          connectionKeys: Object.keys(connection ?? {}) }, "WS socket missing");
        return;
      }
      
      wsAlive.set(socket, true);
      
      socket.on("pong", () => {
        wsAlive.set(socket, true);
      });
      
      req.log.info( {
        url: req.url, user: req.user, headers: req.headers
        }, "WS upgrade OK");
      
      const userId = (req.user as any).sub as number;
      socket.on("error", (err) => req.log.error(err, "ws socket error"));
      
      socketToUserId.set(socket, userId);
      
      send(socket, { type: "connected" });

      socket.on("message", (raw) => {
      const msg = safeJson(raw) as ClientMsg | null;
      if (!msg)
        return;

      switch (msg.type) {
        case "ping":
          send(socket, { type: "pong" });
          return;

        case "queue:join": {
          purgeDeadWaiting();
          if (waiting.has(socket))
            return;

          waiting.add(socket);
          send(socket, { type: "queue:joined" });

          if (waiting.size < 2)
            return;

          const iter = waiting.values();
          const p1 = iter.next().value as WebSocket;
          const p2 = iter.next().value as WebSocket;
          
          if (p1.readyState !== WebSocket.OPEN || p2.readyState !== WebSocket.OPEN) {
  	    waiting.delete(p1);
            waiting.delete(p2);
  	    return;
	  }
		
          waiting.delete(p1);
          waiting.delete(p2);

          const matchId = crypto.randomUUID();
          
          const p1UserId = socketToUserId.get(p1);
          const p2UserId = socketToUserId.get(p2);
          
          if (!p1UserId || !p2UserId) {
            // cannot start match if we don't know identities
            send(p1, { type: "match:reconnect_denied", reason: "auth missing" });
            send(p2, { type: "match:reconnect_denied", reason: "auth missing" });
            return;
          }
          
          if (p1UserId === p2UserId) {
            // Put the first socket back to waiting, kick the second (or vice versa)
            waiting.add(p1);
            send(p2, {
              type: "match:reconnect_denied",
              reason: "cannot match against yourself (open another account / incognito)",
            });
            
            waiting.delete(p2);
            return;
          }
	
          send(p1, { type: "match:found", matchId, youAre: "P1" });
          send(p2, { type: "match:found", matchId, youAre: "P2" });

          const startY = (HEIGHT - PADDLE_HEIGHT) / 2;
          
          const room: Room = {
            p1,
            p2,
            
            p1UserId,
            p2UserId,
            
            tick: 0,
            
            p1Up: false,
            p1Down: false,
            p2Up: false,
            p2Down: false,
            
            p1Y: startY,
            p2Y: startY,
            
            ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: BALL_SPEED, vy: BALL_SPEED * 0.7 },
            
            paused: false,
            pauseMessage: "",
            
            scoreP1: 0,
            scoreP2: 0,
          };
          
          rooms.set(matchId, room);
          socketToMatch.set(p1, { matchId, role: "P1" });
          socketToMatch.set(p2, { matchId, role: "P2" });
          
          // serve: start moving toward P2 initially (like your client)
          resetBall(room, 1);
          
          // 60 fps-ish loop
          room.interval = setInterval(() => {
            room.tick += 1;
            
            if (!room.paused) {
            
              // apply paddle movement from input flags
              if (room.p1Up)
                room.p1Y -= PADDLE_SPEED;
              if (room.p1Down)
                room.p1Y += PADDLE_SPEED;
              if (room.p2Up)
                room.p2Y -= PADDLE_SPEED;
              if (room.p2Down)
                room.p2Y += PADDLE_SPEED;
          
              room.p1Y = clamp(room.p1Y, 0, HEIGHT - PADDLE_HEIGHT);
              room.p2Y = clamp(room.p2Y, 0, HEIGHT - PADDLE_HEIGHT);
          
              // move ball
              room.ball.x += room.ball.vx;
              room.ball.y += room.ball.vy;
          
              // bounce top / bottom
              if (room.ball.y - BALL_RADIUS < 0 || room.ball.y + BALL_RADIUS > HEIGHT) {
                room.ball.vy *= -1;
                room.ball.y = clamp(room.ball.y, BALL_RADIUS, HEIGHT - BALL_RADIUS);
              }
          
              // collide paddles
              const p1Rect = paddleRect("P1", room.p1Y);
              const p2Rect = paddleRect("P2", room.p2Y);
          
              // going left
              if (room.ball.vx < 0 && hitPaddle(p1Rect.x, p1Rect.y, p1Rect.w, p1Rect.h, room.ball.x, room.ball.y, BALL_RADIUS)) {
                const paddleCenter = room.p1Y + PADDLE_HEIGHT / 2;
                const dist = room.ball.y - paddleCenter;
                const normalized = clamp(dist / (PADDLE_HEIGHT / 2), -1, 1);
            
                const speed = Math.min(
                  Math.hypot(room.ball.vx, room.ball.vy) * BALL_SPEEDUP, BALL_MAX_SPEED
                );
            
                room.ball.vx = Math.abs(speed);
                room.ball.vy = normalized * speed;
            
                room.ball.x = p1Rect.x + p1Rect.w + BALL_RADIUS;
              }
          
              // going right
              if (room.ball.vx > 0 && hitPaddle(p2Rect.x, p2Rect.y, p2Rect.w, p2Rect.h, room.ball.x, room.ball.y, BALL_RADIUS)) {
                const paddleCenter = room.p2Y + PADDLE_HEIGHT / 2;
                const dist = room.ball.y - paddleCenter;
                const normalized = clamp(dist / (PADDLE_HEIGHT /2), -1, 1);
            
                const speed = Math.min(
                  Math.hypot(room.ball.vx, room.ball.vy) * BALL_SPEEDUP, BALL_MAX_SPEED
                );
            
                room.ball.vx = -Math.abs(speed);
                room.ball.vy = normalized * speed;
            
                room.ball.x = p2Rect.x - BALL_RADIUS;
              }
          
              // scoring (out of bounds)
              if (room.ball.x + BALL_RADIUS < 0) {
                // P2 Scores
                room.scoreP2 += 1;
                if (room.scoreP2 >= MAX_SCORE) {
                  send(room.p1, { type: "game:over", winner: "P2", score: { p1: room.scoreP1, p2: room.scoreP2 } });
                  send(room.p2, { type: "game:over", winner: "P2", score: { p1: room.scoreP1, p2: room.scoreP2 } });
                  cleanupMatch(matchId);
                  return;
                }
                beginServe(room, 1); // serve toward P2
              }
          
              if (room.ball.x - BALL_RADIUS > WIDTH) {
                // P1 scores
                room.scoreP1 += 1;
                if (room.scoreP1 >= MAX_SCORE) {
                  send(room.p1, { type: "game:over", winner: "P1", score: { p1:  room.scoreP1, p2: room.scoreP2 } });
                  send(room.p2, { type: "game:over", winner: "P1", score: { p1: room.scoreP1, p2: room.scoreP2 } });
                  cleanupMatch(matchId);
                  return;
                }
                beginServe(room, -1); // serve toward P1
              }
            }
            broadcastState(room);
          }, 16);

          return;
        }
        
        case "match:reconnect": {
          const userId = socketToUserId.get(socket);
          if (!userId)
            return;
          
          const found = findRoomByUser(userId);
          if (!found) {
            send(socket, { type: "match:reconnect_denied", reason: "no active match" });
            return;
          }
          
          const { matchId, room } = found;
          
          const youAre: Role = room.p1UserId === userId ? "P1" : "P2";
          
          // deny if slot occupied by a live socket (prevents double tabs)
          const current = youAre === "P1" ? room.p1 : room.p2;
          const alive = 
            !!current &&
            current.readyState === WebSocket.OPEN &&
            wsAlive.get(current) === true;
          
          req.log.info({ matchId, youAre, alive }, "reconnect attempt");
          
          // If slot is occupied by another socket, force takeover.
          // This fixes "reconnect denied forever" caused by zombie OPEN sockets.
          if (alive && current) {
            req.log.warn({ matchId, youAre }, "slot occupied - forcing takeover");
            try {
              current.terminate();
            }
            catch {}
            wsAlive.delete(current);
            socketToUserId.delete(current);
            socketToMatch.delete(current);
            
            if (youAre === "P1")
              room.p1 = null;
            else
              room.p2 = null;
          }
          
          // Attach socket to the slot
          if (youAre === "P1")
            room.p1 = socket;
          else
            room.p2 = socket;
                   
          socketToMatch.set(socket, { matchId, role: youAre });
          send(socket, { type: "match:found", matchId, youAre });
          room.userPaused = false;
          
          // cancel grace timer for this role
          if (youAre === "P1" && room.p1DisconnectTimer) {
            clearTimeout(room.p1DisconnectTimer);
            room.p1DisconnectTimer = undefined;
          }
          
          if (youAre === "P2" && room.p2DisconnectTimer) {
            clearTimeout(room.p2DisconnectTimer);
            room.p2DisconnectTimer = undefined;
          }
          
          // if both players are back, pause 
          if (room.p1 && room.p2) {
            if (room.disconnectCountdownInterval) {
              clearInterval(room.disconnectCountdownInterval);
              room.disconnectCountdownInterval = undefined;
    	    }
            room.disconnectDeadlineMs = undefined;
          }
          
          room.paused = true;
          room.pauseMessage = "READY";
          broadcastState(room);
          
          if (room.readyTimeout)
            clearTimeout(room.readyTimeout);
            
          room.readyTimeout = setTimeout(() => {
            room.readyTimeout = undefined;
            // user paused during READY; keep paused
            if (room.userPaused) {
              room.pauseMessage = "PAUSED";
              room.paused = true;
              broadcastState(room);
              return;
            }
            
            // only proceed if we're still in READY state
            if (!room.paused || room.pauseMessage !== "READY")
              return;
            
            const atCenter = 
              room.ball.x === WIDTH / 2 && 
              room.ball.y === HEIGHT / 2;
            
            if (atCenter) {
              const dir: 1 | -1 = (room.serveDir ?? 1);
              
              beginServe(room, dir, SERVE_DELAY_MS);
              return;
            }
            
            // Ball is not at center - resume match
            room.paused = false;
            room.pauseMessage = "";
            broadcastState(room);
          }, 1200);
          
          return;
        }

        case "queue:leave":
          removeFromQueue(socket);
          send(socket, { type: "queue:left" });
          return;

        case "game:input": {
          const info = socketToMatch.get(socket);
          if (!info)
            return;
          
          const room = rooms.get(info.matchId);
          if (!room)
            return;
          
          const isP1 = info.role === "P1";
          
          if (msg.dir === "up") {
            if (isP1)
              room.p1Up = msg.pressed;
            else
              room.p2Up = msg.pressed;
          }
          else {
            if (isP1)
              room.p1Down = msg.pressed;
            else
              room.p2Down = msg.pressed;
          }
          return;
        }
        
        case "game:pause": {
          const info = socketToMatch.get(socket);
          if (!info)
            return;
          
          const room = rooms.get(info.matchId);
          if (!room)
            return;
          
          room.userPaused = msg.paused;
          room.paused = msg.paused;
          
          if (room.paused) {
            room.pauseMessage = "PAUSED";
            freezeServeIfRunning(room);
          }
          else {
            // resuming: if we had a pending serve, restart countdown with remaining ms
            room.userPaused = false;
            room.pauseMessage = "";
            if (typeof room.pendingServeRemainingMs === "number") {
              const ms = room.pendingServeRemainingMs;
              room.pendingServeRemainingMs = undefined;
              const dir = room.serveDir ?? 1;
              beginServe(room, dir, ms);
              return;
            }
          }
          
          broadcastState(room);
          return;
        }

        default:
          return;
      }
    });

      socket.on("close", (code, reason) => {
        wsAlive.delete(socket);
        socketToUserId.delete(socket);
        removeFromQueue(socket);

        const info = socketToMatch.get(socket);
        if (!info) {
          req.log.info({ code, reason: reason?.toString() }, "ws disconnected");
          return;
        }
        
        const room = rooms.get(info.matchId);
        if (!room) {
          socketToMatch.delete(socket);
          req.log.info({ code, reason: reason?.toString() }, "ws disconnected");
          return;
        }
        
        let didRemove = false;
        
        if (info.role === "P1") {
          if (room.p1 === socket) {
            room.p1 = null;
            didRemove = true;
          }
        }
        else {
          if (room.p2 === socket) {
            room.p2 = null;
            didRemove = true;
          }
        }
        
        // IMPORTANT: always remove mapping for this socket now
	socketToMatch.delete(socket);
        
        req.log.info({ matchId: info.matchId, role: info.role, didRemove }, "close processed");
        
        if (!didRemove) {
  	  req.log.info({ code, reason: reason?.toString() }, "ws stale close ignored");
  	  return;
  	}
        
        freezeServeIfRunning(room);
        
        // clear old timeout for this role (if any)
        if (info.role === "P1" && room.p1DisconnectTimer) {
          clearTimeout(room.p1DisconnectTimer);
          room.p1DisconnectTimer = undefined;
        }
        if (info.role === "P2" && room.p2DisconnectTimer) {
          clearTimeout(room.p2DisconnectTimer);
          room.p2DisconnectTimer = undefined;
        }
        if (room.disconnectCountdownInterval) {
          clearInterval(room.disconnectCountdownInterval);
          room.disconnectCountdownInterval = undefined;
        }
        
        const winner: Role =
          room.p1 === null && room.p2 !== null ? "P2" :
          room.p2 === null && room.p1 !== null ? "P1" :
          // fallback
          (info.role === "P1" ? "P2" : "P1");
        
        // set deadline 10s from now
        room.disconnectDeadlineMs = Date.now() + 10_000;
        
        // pause + push first message
        room.paused = true;
        room.pauseMessage = "WAITING 10s FOR RECONNECT";
        broadcastState(room);
            
        // update message every 1s
        room.disconnectCountdownInterval = setInterval(() => {
          const msLeft = (room.disconnectDeadlineMs ?? 0) - Date.now();
          const secLeft = Math.max(0, Math.ceil(msLeft / 1000));
          
          room.pauseMessage = `WAITING ${secLeft}s FOR RECONNECT`;
          broadcastState(room);
            
          if (secLeft <= 0 && room.disconnectCountdownInterval) {
                  clearInterval(room.disconnectCountdownInterval);
                  room.disconnectCountdownInterval = undefined;
          }
        }, 1000);
            
        const timer = setTimeout(() => {
          // if player still missing after grace period -> end game
          const stillMissing =
            winner === "P1" ? room.p2 === null : room.p1 === null;
              
          if (room.disconnectCountdownInterval) {
            clearInterval(room.disconnectCountdownInterval);
            room.disconnectCountdownInterval = undefined;
          }
              
          if (stillMissing) {
            send(room.p1, { type: "game:over", winner, score: { p1: room.scoreP1, p2: room.scoreP2 } });
            send(room.p2, { type: "game:over", winner, score: { p1: room.scoreP1, p2: room.scoreP2 } });
            cleanupMatch(info.matchId);
          }
          else {
            room.pauseMessage = "";
            room.paused = false;
            broadcastState(room);
          }
        }, 10_000);
            
        if (info.role === "P1")
          room.p1DisconnectTimer = timer;
        else
          room.p2DisconnectTimer = timer;
          
        req.log.info({ code, reason: reason?.toString() }, "ws disconnected");
      });
  });
}

