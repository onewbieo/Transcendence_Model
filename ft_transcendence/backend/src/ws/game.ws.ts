import type { FastifyInstance } from "fastify";
import WebSocket from "ws";
import crypto from "node:crypto";

type Role = "P1" | "P2";

const rooms = new Map<
  string,
  {
    p1: WebSocket;
    p2: WebSocket;
    tick: number;
    ball: { x: number; y: number };
    interval?: NodeJS.Timeout;
  }
>();

const socketToMatch = new Map<WebSocket, { matchId: string; role: Role }>();

type ClientMsg =
  | { type: "ping" }
  | { type: "queue:join" }
  | { type: "queue:leave" }
  | { type: "game:input"; dir: "up" | "down"; pressed: boolean };

type ServerMsg =
  | { type: "connected" }
  | { type: "pong" }
  | { type: "queue:joined" }
  | { type: "queue:left" }
  | { type: "match:found"; matchId: string; youAre: "P1" | "P2" }
  | { type: "game:state"; tick: number; ball: { x: number; y: number } };

function safeJson(raw: any): any | null {
  try {
    return JSON.parse(raw.toString());
  }
  catch {
    return null;
  }
}

const waiting = new Set<WebSocket>();

function send(ws: WebSocket, msg: ServerMsg) {
  if (ws.readyState !== WebSocket.OPEN)
    return;
  ws.send(JSON.stringify(msg));
}

function removeFromQueue(ws: WebSocket) {
  waiting.delete(ws);
}

export async function gameWs(app: FastifyInstance) {
  app.get(
    "/ws/game",
    { websocket: true },
    (socket, req) => {
      socket.on("error", (err) => req.log.error(err, "ws socket error"));

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
          if (waiting.has(socket))
            return;

          waiting.add(socket);
          send(socket, { type: "queue:joined" });

          if (waiting.size < 2)
            return;

          const iter = waiting.values();
          const p1 = iter.next().value as WebSocket;
          const p2 = iter.next().value as WebSocket;

          waiting.delete(p1);
          waiting.delete(p2);

          const matchId = crypto.randomUUID();

          send(p1, { type: "match:found", matchId, youAre: "P1" });
          send(p2, { type: "match:found", matchId, youAre: "P2" });

          rooms.set(matchId, {
            p1,
            p2,
            tick: 0,
            ball: { x: 100, y: 100 },
          });

          socketToMatch.set(p1, { matchId, role: "P1" });
          socketToMatch.set(p2, { matchId, role: "P2" });

          const room = rooms.get(matchId)!;
          room.interval = setInterval(() => {
            room.tick += 1;

            room.ball.x += 5;
            if (room.ball.x > 600)
              room.ball.x = 0;

            const payload: ServerMsg = {
              type: "game:state",
              tick: room.tick,
              ball: room.ball,
            };

            send(room.p1, payload);
            send(room.p2, payload);
          }, 200);

          return;
        }

        case "queue:leave":
          removeFromQueue(socket);
          send(socket, { type: "queue:left" });
          return;

        case "game:input":
          return;

        default:
          return;
      }
    });

      socket.on("close", (code, reason) => {
        removeFromQueue(socket);

        const info = socketToMatch.get(socket);
        if (info) {
          const room = rooms.get(info.matchId);

          if (room?.interval)
            clearInterval(room.interval);
          rooms.delete(info.matchId);

          if (room) {
            socketToMatch.delete(room.p1);
            socketToMatch.delete(room.p2);
          }
          else {
            socketToMatch.delete(socket);
          }
      }

      req.log.info({ code, reason: reason?.toString() }, "ws disconnected");
    });
  });
}

