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

export default function TournamentsPage() {
  const [name, setName] = useState("Test Cup");
  const [tid, setTid] = useState<number>(1);

  const [status, setStatus] = useState("");
  const [created, setCreated] = useState<any>(null);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  
  const navigate = useNavigate(); // hook for navigation
  
  useEffect(() => {
    if (!tid)
      return;

    console.log("Polling tournament status for tid:", tid);

    const interval = setInterval(async () => {
      try {
        const t = await getTournament(tid);
        console.log("Polled tournament status:", t.status);

        // ✅ THIS IS THE KEY CONDITION
        if (t.status === "ONGOING") {
          const params = new URLSearchParams({
            tournamentId: String(tid),
            bracket: "WINNERS",
            round: "1",
            slot: "1",
          });

          const gameUrl = `/game?${params.toString()}`;

          console.log("Tournament started → redirecting to:", gameUrl);

          // prevent infinite reload
          if (window.location.pathname !== "/game") {
            navigate(gameUrl);
          }
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
    setStatus("joining...");
    try {
      const res = await joinTournament(tid);
      setStatus(`Join result ✅ ${JSON.stringify(res)}`);
    }
    catch (e: any) {
      setStatus(`Join failed ❌ ${e?.message ?? ""}`);
    }
  }

  async function onLoadBracket() {
    setStatus("loading bracket...");
    try {
      const b = await tournamentBracket(tid);
      setBracket(b);
      setStatus("Bracket loaded ✅");
    }
    catch (e: any) {
      setStatus(`Bracket failed ❌ ${e?.message ?? ""}`);
    }
  }
  
  async function onStart() {
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
      
      console.log("StartTournament API done");
      
      const params = new URLSearchParams({
        tournamentId: String(tid),
        bracket: "WINNERS",
        round: "1",
        slot: "1",
      });
      
      const gameUrl = `/game?${params.toString()}`;
      console.log("Redirecting to:", gameUrl);
      
      const b = await tournamentBracket(tid);
      setBracket(b);
      
      navigate(gameUrl);
    }
    catch (e: any) {
      // api() throws Error(msg) where msg comes from backend {error} / {message}
      setStatus(`Start failed ❌ ${e?.message ?? "Unknown error"}`);
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
          value={tid}
          onChange={(e) => setTid(Number(e.target.value || 0))}
          type="number"
          style={{ padding: 10, width: 120 }}
        />
        <button onClick={onJoin}>Join</button>
        <button onClick={onLoadBracket}>Load bracket</button>
        <button onClick={onStart}>Start Tournament</button>
      </div>

      {bracket && (
        <>
          <h3 style={{ marginTop: 18 }}>Participants</h3>
          {bracket.participants?.length ? (
            <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">User ID</th>
                  <th align="left">Name</th>
                  <th align="left">Email</th>
                </tr>
              </thead>
              <tbody>
                {bracket.participants.map((p, idx) => (
                  <tr key={idx} style={{ borderTop: "1px solid #333" }}>
                    <td>{p.user.id}</td>
                    <td>{p.user.name ?? "-"}</td>
                    <td>{(p.user as any).email ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No participants yet.</p>
          )}

          <h3 style={{ marginTop: 18 }}>Matches</h3>
          {bracket.matches?.length ? (
            <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Status</th>
                  <th>Player 1</th>
                  <th>Player 2</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {bracket.matches.map((match, idx) => (
                  <tr key={idx} style={{ borderTop: "1px solid #333" }}>
                    <td>Match {match.id}</td>
                    <td>{match.status}</td>
                    <td>{match.player1.name}</td>
                    <td>{match.player2.name}</td>
                    <td>{match.player1Score} - {match.player2Score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No matches generated yet.</p>
          )}
        </>
      )}
    </div>
  );
}

