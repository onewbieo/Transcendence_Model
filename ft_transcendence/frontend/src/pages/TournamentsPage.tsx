import { useState } from "react";
import {
  createTournament,
  joinTournament,
  tournamentBracket,
  type TournamentBracket,
} from "../api";
import { getToken } from "../lib/auth";

export default function TournamentsPage({ goHome }: { goHome: () => void }) {
  const [name, setName] = useState("Test Cup");
  const [tid, setTid] = useState<number>(1);

  const [status, setStatus] = useState("");
  const [created, setCreated] = useState<any>(null);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);

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
    setStatus("starting...");
    try {
      // Fetch the tournament data first to check its status
      const tournament = await fetch(`http://localhost:3000/tournaments/${tid}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
        },
      }).then(res => res.json());
      
      console.log("Tournament status: ", tournament.status);
      // Check if tournament is open before starting
      if (tournament.status !== "OPEN") {
        setStatus(`Tournament is not open ❌`);
        return;
      }

      // Proceed to start the tournament if status is open
      const res = await fetch(`http://localhost:3000/tournaments/${tid}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify({}) // Send empty body
      });
      
      console.log("Start response status: ", res.status);

      const result = await res.json();
      if (res.status === 400) {
        // Display error message if the backend returns a 400
        setStatus(`Start failed ❌ ${result.error || "Unknown error"}`);
      }
      else {
        // Otherwise, show success message
        setStatus(`Tournament started ✅ (Matches generated)`);
        console.log("Tournament result", result);
      }
    }
    catch (e: any) {
      setStatus(`Start failed ❌ ${e?.message ?? ""}`);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "48px auto", padding: 24 }}>
      <h1>Tournaments</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={goHome}>Back to Home</button>
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

