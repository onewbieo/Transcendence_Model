import { useEffect, useMemo, useRef, useState } from "react";
import { getToken } from "../lib/auth";

type Role = "P1" | "P2";

type ServerMsg =
  | { type: "connected" }
  | { type: "pong" }
  | { type: "queue:joined" }
  | { type: "queue:left" }
  | { type: "match:found"; matchId: string; youAre: Role }
  | { type: "match:reconnect_denied"; reason: string }
  | { type: "game:state"; tick: number; paused: boolean; pauseMessage?: string }
  | { type: "game:over"; winner: Role; score: { p1: number; p2: number } };

export default function LobbyPage({ goHome }: { goHome: () => void }) {
  const [status, setStatus] = useState<string>("disconnected");
  const [log, setLog] = useState<string[]>([]);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [youAre, setYouAre] = useState<Role | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const token = useMemo(() => getToken(), []);

  function push(line: string) {
    setLog((prev) => [line, ...prev].slice(0, 50));
  }

  function send(obj: any) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      push("❌ cannot send: ws not open");
      return;
    }
    ws.send(JSON.stringify(obj));
  }

  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_BASE ?? "/ws";
    if (!token) {
      setStatus("❌ no token (login first)");
      return;
    }

    const url = `ws://${location.host}${wsBase}/game?token=${encodeURIComponent(token)}`;
    push(`connecting → ${url}`);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected ✅");
      push("WS open ✅");
    };

    ws.onclose = () => {
      setStatus("disconnected ❌");
      push("WS closed ❌");
    };

    ws.onerror = () => {
      push("WS error ❌ (check backend logs)");
    };

    ws.onmessage = (ev) => {
      let msg: ServerMsg | null = null;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        push(`<- non-json: ${String(ev.data)}`);
        return;
      }

      push(`<-${msg.type}`);

      if (msg.type === "match:found") {
        setMatchId(msg.matchId);
        setYouAre(msg.youAre);
        push(`✅ matched: ${msg.matchId} (${msg.youAre})`);
      }

      if (msg.type === "match:reconnect_denied") {
        push(`reconnect denied: ${msg.reason}`);
      }
    };

    return () => {
      try {
        ws.close();
      } catch {}
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "48px auto", padding: 24 }}>
      <h1>Game Lobby</h1>
      <p>Status: {status}</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={goHome}>Back to Home</button>

        <button onClick={() => send({ type: "queue:join" })}>Queue: Join</button>
        <button onClick={() => send({ type: "queue:leave" })}>Queue: Leave</button>
        <button onClick={() => send({ type: "match:reconnect" })}>Reconnect</button>
        <button onClick={() => send({ type: "ping" })}>Ping</button>
      </div>

      <div style={{ marginTop: 16 }}>
        <p>
          Match: <b>{matchId ?? "-"}</b> | You are: <b>{youAre ?? "-"}</b>
        </p>
      </div>

      <h2 style={{ marginTop: 24 }}>Log (latest first)</h2>
      <pre style={{ padding: 12, background: "#111", color: "#eee", overflowX: "auto" }}>
        {log.join("\n")}
      </pre>
    </div>
  );
}
