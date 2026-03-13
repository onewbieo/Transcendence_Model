import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { makeWsUrl } from "../lib/ws";

type Role = "P1" | "P2";

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

type ClientMsg =
  | { type: "ping" }
  | { type: "queue:join" }
  | { type: "queue:leave" }
  | { type: "game:input"; dir: "up" | "down"; pressed: boolean }
  | { type: "game:pause"; paused: boolean }
  | { type: "match:reconnect" };

const WIDTH = 800;
const HEIGHT = 600;

export default function GamePage() {
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navigate = useNavigate(); // use navigate for page redirection

  const [wsStatus, setWsStatus] = useState<"closed" | "open" | "error" | "connecting">("closed");
  const [matchId, setMatchId] = useState<string>("-");
  const [role, setRole] = useState<Role | "-">("-");
  const [log, setLog] = useState<string[]>([]);
  const [state, setState] = useState<Extract<ServerMsg, { type: "game:state" }> | null>(null);
  
  const stateRef = useRef<Extract<ServerMsg, { type: "game:state" }> | null>(null);
  
  const connIdRef = useRef(0);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const wsUrl = useMemo(() => makeWsUrl("/game"), []);

  function pushLog(line: string) {
    setLog((prev) => [line, ...prev].slice(0, 50));
  }

  function send(msg: ClientMsg) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN)
      return;
    ws.send(JSON.stringify(msg));
  }

  function connect() {
    connIdRef.current +=1;
    const myId = connIdRef.current;
    
    try {
      wsRef.current?.close();
    } catch {}

    setWsStatus("connecting");
    pushLog(`connecting → ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (connIdRef.current !== myId)
        return;
      setWsStatus("open");
      pushLog("WS open ✅");  
    };

    ws.onclose = () => {
      if (connIdRef.current !== myId)
        return;
      setWsStatus("closed");
      pushLog("WS closed ❌");
    };

    ws.onerror = () => {
      if (connIdRef.current !== myId)
        return;
      setWsStatus("error");
      pushLog("WS error ❌ (check backend logs)");
    };

    ws.onmessage = (ev) => {
      if (connIdRef.current !== myId)
        return;
      let msg: ServerMsg | null = null;
      try {
        msg = JSON.parse(ev.data);
      }
      catch {
        return;
      }

      pushLog(`<- ${msg.type}`);

      if (msg.type === "match:found") {
        setMatchId(msg.matchId);
        setRole(msg.youAre);
      }

      if (msg.type === "match:reconnect_denied") {
        pushLog(`reconnect denied: ${msg.reason}`);
      }

      if (msg.type === "game:state") {
        setState(msg);
      }

      if (msg.type === "game:over") {
        // Force final overlay onto canvas
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            paused: true,
            pauseMessage: `GAME OVER - ${msg.winner} WINS`,
            score: { p1: msg.score.p1, p2: msg.score.p2 },
          };
        });

        pushLog(`GAME OVER winner=${msg.winner} score=${msg.score.p1}-${msg.score.p2}`);
        
        // Delay redirect
        setTimeout(() => {
          // Redirect to Home Page after game over
          navigate("/");
        }, 5000);
      }
    };
  }

  // connect once on mount
  useEffect(() => {
    connect();
    return () => {
      try {
        wsRef.current?.close();
      }
      catch {}
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // keyboard controls
  useEffect(() => {
    function isScrollKey(e: KeyboardEvent) {
      return e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === " ";
    }
    
    function onKeyDown(e: KeyboardEvent) {
      // stop browser scrolling for arrow keys (and space if you want)
      if (isScrollKey(e))
        e.preventDefault();
        
      if (e.repeat)
        return;

      if (e.key === "w" || e.key === "ArrowUp")
        send({ type: "game:input", dir: "up", pressed: true });
      if (e.key === "s" || e.key === "ArrowDown")
        send({ type: "game:input", dir: "down", pressed: true });

      if (e.key === "p" || e.key === "P") {
        const cur = stateRef.current;
        const paused = !(cur?.paused ?? false);
        send({ type: "game:pause", paused });
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (isScrollKey(e))
        e.preventDefault();

      if (e.key === "w" || e.key === "ArrowUp")
        send({ type: "game:input", dir: "up", pressed: false });
      if (e.key === "s" || e.key === "ArrowDown")
        send({ type: "game:input", dir: "down", pressed: false });
    }
    
    // IMPORTANT: passive:false lets preventDefault actually work
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp, { passive: false});
    return () => {
      window.removeEventListener("keydown", onKeyDown as any);
      window.removeEventListener("keyup", onKeyUp as any);
    };
  }, []);

  // draw canvas
  useEffect(() => {
    const c = canvasRef.current;
    const s = state;
    if (!c || !s) return;

    const ctx = c.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // mid line
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();

    const PADDLE_W = 20;
    const PADDLE_H = 100;
    const MARGIN = 40;

    ctx.fillRect(MARGIN, s.p1.y, PADDLE_W, PADDLE_H);
    ctx.fillRect(WIDTH - MARGIN - PADDLE_W, s.p2.y, PADDLE_W, PADDLE_H);

    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "20px sans-serif";
    ctx.fillText(`${s.score.p1} : ${s.score.p2}`, WIDTH / 2 - 30, 30);

    if (s.paused) {
      ctx.font = "28px sans-serif";
      const msg = s.pauseMessage ?? "PAUSED";
      ctx.fillText(msg, WIDTH / 2 - ctx.measureText(msg).width / 2, HEIGHT / 2);
    }
  }, [state]);

  return (
    <div className="block w-full mx-auto my-6 p-6 max-h-[calc(95dvh-6rem)] overflow-y-auto">
      <h1 className="block w-fit mx-auto px-2 py-1 border-3 font-bold rounded-md hover:bg-zinc-400 text-center">Game Room</h1>

      <div className="mt-5 flex flex-wrap gap-2 items-center justify-center">
        <button
          onClick={() => navigate("/")}
          className="border-2 border-orange-500 text-orange-500 font-bold rounded-md px-2 py-1 hover:bg-orange-300"
        >
          Back to Home
        </button> {/* Use navigate() for routing */}
        <button
          onClick={connect}
          className="border-2 border-orange-500 text-orange-500 font-bold rounded-md px-2 py-1 hover:bg-orange-300"
        >
          Reconnect WS
        </button>
        <button
          onClick={() => send({ type: "queue:join" })}
          className="border-2 border-orange-500 text-orange-500 font-bold rounded-md px-2 py-1 hover:bg-orange-300"
        >
          Join Queue
        </button>
        <button
          onClick={() => send({ type: "queue:leave" })}
          className="border-2 border-orange-500 text-orange-500 font-bold rounded-md px-2 py-1 hover:bg-orange-300"
        >
          Leave Queue
        </button>
        <button
          onClick={() => send({ type: "match:reconnect" })}
          className="border-2 border-orange-500 text-orange-500 font-bold rounded-md px-2 py-1 hover:bg-orange-300"  
        >
          Reconnect Match
        </button>
        <button
          onClick={() => send({ type: "ping" })}
          className="border-2 border-orange-500 text-orange-500 font-bold rounded-md px-2 py-1 hover:bg-orange-300"
        >
          Ping
        </button>
        <button
          onClick={() => send({ type: "game:pause", paused: true })}
          className="border-2 border-orange-500 text-orange-500 font-bold rounded-md px-2 py-1 hover:bg-orange-300"  
        >
          Pause
        </button>
        <button
          onClick={() => send({ type: "game:pause", paused: false })}
          className="border-2 border-orange-500 text-orange-500 font-bold rounded-md px-2 py-1 hover:bg-orange-300"  
        >
          Resume
        </button>
      </div>

      <div className="mt-3">
        <div className="flex gap-2 items-center justify-center text-red-500">
          <span className="">
            WS:
          </span>
          <span className="font-bold">
            {wsStatus}
          </span>
          <span className="opacity-70">
            (readyState={wsRef.current?.readyState ?? "null"})
          </span>
        </div>
        <div className="mt-2 flex gap-2 items-center justify-center text-indigo-700">
          <span className="">
            Match:
          </span>
          <span className="">
            {matchId}
          </span>
          <span className="">
            | You are:
          </span>
          <span className="">
            {role}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 items-center justify-center text-emerald-600">
          <span className="">
            Controls:
          </span>
          <span className="font-bold">
            W / S
          </span>
          <span className="">
            Or
          </span>
          <span className="">
            ↑ /↓ ,
          </span>
          <span className="">
            Pause toggle:
          </span>
          <span className="">
            P
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-6 items-center">
        <div className="w-[clamp(290px,min(92vw,calc((100dvh-14rem)*4/3)),660px)] aspect-[4/3]">
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="border-3 block h-full w-full rounded-lg border-yellow-300"
          />
        </div>

        <div className="hidden w-full flex-1">
          <h3 className="">Log (latest first)</h3>
          <div className="min-h-[240px] rounded-lg bg-black p-3 text-white">
            {log.length === 0 ? <div>(empty)</div> : log.map((l, i) => <div key={i}>{l}</div>)}
          </div>

          <h3 className="mt-2">State snapshot</h3>
          <pre className="overflow-x-auto rounded-lg bg-black p-3 text-white">
            {JSON.stringify(state, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
