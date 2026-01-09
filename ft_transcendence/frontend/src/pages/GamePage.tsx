import { useEffect, useMemo, useRef, useState } from "react";
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
  | { type: "tournament:join"; tournamentId: number; bracket: "WINNERS" | "LOSERS"; round:number; slot: number }
  | { type: "queue:leave" }
  | { type: "game:input"; dir: "up" | "down"; pressed: boolean }
  | { type: "game:pause"; paused: boolean }
  | { type: "match:reconnect" };

const WIDTH = 800;
const HEIGHT = 600;

export default function GamePage({ goHome }: { goHome: () => void }) {
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [wsStatus, setWsStatus] = useState<"closed" | "open" | "error" | "connecting">("closed");
  const [matchId, setMatchId] = useState<string>("-");
  const [role, setRole] = useState<Role | "-">("-");
  const [log, setLog] = useState<string[]>([]);
  const [state, setState] = useState<Extract<ServerMsg, { type: "game:state" }> | null>(null);
  
  const stateRef = useRef<Extract<ServerMsg, { type: "game:state" }> | null>(null);
  
  useEffect(() => {
    stateRef.current = state;
  }, []);

  const wsUrl = useMemo(() => makeWsUrl("/game"), []);

  function pushLog(line: string) {
    setLog((prev) => [line, ...prev].slice(0, 50));
  }

  function send(msg: ClientMsg) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(msg));
  }

  function connect() {
    try {
      wsRef.current?.close();
    } catch {}

    setWsStatus("connecting");
    pushLog(`connecting → ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Try read tournament params from query string
      const qs = new URLSearchParams(window.location.search);
      
      const tournamentId = Number(qs.get("tournamentId"));
      const bracket = (qs.get("bracket") ?? "WINNERS") as "WINNERS" | "LOSERS";
      const round = Number(qs.get("round"));
      const slot = Number(qs.get("slot"));
      
      const isTournament =
        Number.isFinite(tournamentId) && tournamentId > 0 &&
        Number.isFinite(round) && round > 0 &&
        Number.isFinite(slot) && slot > 0;
        
      if (isTournament) {
        pushLog(`tournament join → t=${tournamentId} ${bracket} r=${round} s=${slot}`);
        send({ type: "tournament:join", tournamentId, bracket, round, slot });
      }
      else {
        send({ type: "match:reconnect" }); // optional auto-reconnect
      }
      setWsStatus("open");
      pushLog("WS open ✅");
    };

    ws.onclose = () => {
      setWsStatus("closed");
      pushLog("WS closed ❌");
    };

    ws.onerror = () => {
      setWsStatus("error");
      pushLog("WS error ❌ (check backend logs)");
    };

    ws.onmessage = (ev) => {
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
      }
    };
  }

  // connect once on mount
  useEffect(() => {
    connect();
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // keyboard controls
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
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
      if (e.key === "w" || e.key === "ArrowUp")
        send({ type: "game:input", dir: "up", pressed: false });
      if (e.key === "s" || e.key === "ArrowDown")
        send({ type: "game:input", dir: "down", pressed: false });
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [state]);

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
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 24 }}>
      <h1>Game Lobby</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={goHome}>Back to Home</button>
        <button onClick={connect}>Reconnect WS</button>
        <button onClick={() => send({ type: "queue:join" })}>Join Queue</button>
        <button onClick={() => send({ type: "queue:leave" })}>Leave Queue</button>
        <button onClick={() => send({ type: "match:reconnect" })}>Reconnect Match</button>
        <button onClick={() => send({ type: "ping" })}>Ping</button>
        <button onClick={() => send({ type: "game:pause", paused: true })}>Pause</button>
        <button onClick={() => send({ type: "game:pause", paused: false })}>Resume</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <div>
          WS: <b>{wsStatus}</b>
        </div>
        <div>
          Match: <b>{matchId}</b> | You are: <b>{role}</b>
        </div>
        <div style={{ opacity: 0.8, marginTop: 6 }}>
          Controls: <b>W/S</b> or <b>↑/↓</b>, Pause toggle: <b>P</b>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, marginTop: 16, alignItems: "flex-start" }}>
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{ border: "1px solid #333", borderRadius: 8 }} />

        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Log (latest first)</h3>
          <div style={{ background: "#111", color: "#eee", padding: 12, borderRadius: 8, minHeight: 240 }}>
            {log.length === 0 ? <div>(empty)</div> : log.map((l, i) => <div key={i}>{l}</div>)}
          </div>

          <h3>State snapshot</h3>
          <pre style={{ background: "#111", color: "#eee", padding: 12, borderRadius: 8, overflowX: "auto" }}>
            {JSON.stringify(state, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

