import { useState, useEffect } from "react";
import {
  createTournament,
  getTournament,
  joinTournament,
  tournamentBracket,
  startTournament,
  type TournamentBracket,
} from "../api";
import { useNavigate } from "react-router-dom"; // useNavigate for navigation
import Bracket from "./Bracket";
import { getToken } from "../lib/auth";

function b64urlDecode(input: string) {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

function getMyUserIdFromToken(): number | null {
  const token = getToken();
  if (!token)
    return null;
  
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(b64urlDecode(payload));
    const sub = Number(json.sub);
    return Number.isFinite(sub) ? sub : null;
  }
  catch {
    return null;
  }
}

// pick the match that contains me, prefer earliest round / slot and not finished
function findMyMatch(br: any, myId: number) {
  if (!br?.matches)
    return null;
  
  const mine = br.matches
    .filter((m: any) =>
      m.bracket === "WINNERS" &&
      (m.player1?.id === myId || m.player2?.id === myId) &&
      m.status !== "FINISHED"
    )
    .sort((a: any, b: any) => (a.round - b.round) || (a.slot - b.slot));

  return mine[0] ?? null;
}  

export default function TournamentsPage() {
  const [name, setName] = useState("");
  const [tid, setTid] = useState<number | null>(null);

  const [status, setStatus] = useState("");
  const [created, setCreated] = useState<any>(null);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  
  const navigate = useNavigate(); // hook for navigation
  
  useEffect(() => {
    if (tid === null)
      return;

    console.log("Polling tournament status for tid:", tid);

    const interval = setInterval(async () => {
      try {
        if (window.location.pathname === "/game")
          return;
        
        const t = await getTournament(tid);
        console.log("Polled tournament status:", t.status);
        
        if (t.status !== "ONGOING")
          return;
        
        const myId = getMyUserIdFromToken();
        if (!myId)
          return;
        
        const b: any = await tournamentBracket(tid);
        setBracket(b);
        
        const myMatch = findMyMatch(b, myId);
        if (!myMatch) {
          return;
        }
        
        const params = new URLSearchParams({
          tournamentId: String(tid),
          bracket: "WINNERS",
          round: String(myMatch.round),
          slot: String(myMatch.slot),
        });

        const gameUrl = `/game?${params.toString()}`;

        console.log("Tournament started → redirecting to:", gameUrl);

        // prevent infinite reload
        if (window.location.pathname !== "/game" || window.location.search !== nextSearch) {
          navigate(gameUrl);
        }
      }
      catch (e) {
        console.error("Tournament poll error:", e);
      }
    }, 2000); // every 2 seconds

    return () => clearInterval(interval);
  }, [tid, navigate]);
  
  async function onCreate() {
    setStatus("creating...");
    setBracket(null);
    try {
      const t = await createTournament(name);
      setCreated(t);
      setTid(t.id);
      setStatus(`Created ✅ (id=${t.id})`);
    }
    catch (e: any) {
      setStatus(`Create failed ❌ ${e?.message ?? ""}`);
    }
  }

  async function onJoin() {
    if (tid === null || tid <= 0) {
      setStatus("❌ Tournament ID is required");
      setBracket(null);
      return;
    }
    
    setStatus("joining...");
    setBracket(null);
    
    try {
      const res = await joinTournament(tid);
      setStatus(`Join result ✅ ${JSON.stringify(res)}`);
    }
    catch (e: any) {
      setStatus(`Join failed ❌ ${e?.message ?? ""}`);
      setBracket(null);
    }
  }

  async function onLoadBracket() {
    if (tid === null || tid <= 0) {
      setStatus("❌ Tournament ID is required");
      setBracket(null);
      return;
    }
    
    setStatus("loading bracket...");
    setBracket(null);
    
    try {
      const b = await tournamentBracket(tid);
      setBracket(b);
      setStatus("Bracket loaded ✅");
    }
    catch (e: any) {
      setStatus(`Bracket failed ❌ ${e?.message ?? ""}`);
      setBracket(null);
    }
  }
  
  async function onStart() {
    if (tid === null || tid <= 0) {
      setStatus("❌ Tournament ID is required");
      setBracket(null);
      return;
    }
    
    console.log("=== START TOURNAMENT CLICKED ===");
    console.log("Current URL:", window.location.href);
    console.log("Tournament ID:", tid);
    setStatus("starting...");

    try {
      const t = await getTournament(tid);
      
      console.log("Tournament status:", t.status);
      
      if (t.status !== "OPEN") {
        setStatus("Tournament is not open ❌");
        return;
      }
      
      const res = await startTournament(tid);
      setStatus(`Tournament started ✅ ${res.message}`);
      
      const b = await tournamentBracket(tid);
      setBracket(b);
    } 
    catch (e: any) {
      // api() throws Error(msg) where msg comes from backend {error} / {message}
      setStatus(`Start failed ❌ ${e?.message ?? "Unknown error"}`);
      setBracket(null);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "48px auto", padding: 24 }}>
      <h1>Tournaments</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>

      <hr />

      <h2>Create tournament</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10, width: 260 }}
        />
        <button onClick={onCreate}>Create</button>
      </div>

      {created && (
        <pre style={{ marginTop: 12, padding: 12, background: "#111", color: "#eee" }}>
          {JSON.stringify(created, null, 2)}
        </pre>
      )}

      <hr />

      <h2>Join + Bracket</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>Tournament ID:</span>
        <input
          value={tid !== null ? tid : ""}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value >= 1 || e.target.value === "") {
              setTid(value);
            }
          }}
          type="number"
          min="1"
          style={{ padding: 10, width: 120 }}
        />
        <button onClick={onJoin}>Join</button>
        <button onClick={onLoadBracket}>Load bracket</button>
        <button onClick={onStart}>Start Tournament</button>
      </div>

      {/* Render the bracket if it exists */}
      {bracket && <Bracket bracket={bracket} />} {/* Display the bracket */}
    </div>
  );
}
