import { useState } from "react";
import {
  createTournament,
  joinTournament,
  tournamentBracket,
  type TournamentBracket,
} from "../api";

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
    } catch (e: any) {
      setStatus(`Create failed ❌ ${e?.message ?? ""}`);
    }
  }

  async function onJoin() {
    setStatus("joining...");
    try {
      const res = await joinTournament(tid);
      // backend might return {ok:true} OR {error:"already joined"}
      // our api() throws on non-2xx, so if we reach here it's 2xx
      setStatus(`Join result ✅ ${JSON.stringify(res)}`);
    } catch (e: any) {
      setStatus(`Join failed ❌ ${e?.message ?? ""}`);
    }
  }

  async function onLoadBracket() {
    setStatus("loading bracket...");
    try {
      const b = await tournamentBracket(tid);
      setBracket(b);
      setStatus("Bracket loaded ✅");
    } catch (e: any) {
      setStatus(`Bracket failed ❌ ${e?.message ?? ""}`);
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
            <pre style={{ marginTop: 8, padding: 12, background: "#111", color: "#eee" }}>
              {JSON.stringify(bracket.matches, null, 2)}
            </pre>
          ) : (
            <p>No matches generated yet.</p>
          )}
        </>
      )}
    </div>
  );
}
