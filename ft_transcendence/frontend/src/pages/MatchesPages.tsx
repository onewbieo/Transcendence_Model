import { useEffect, useState } from "react";
import { matches, type MatchRow } from "../api";

export default function MatchesPage({
  goHome,
}: {
  goHome: () => void;
}) {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [status, setStatus] = useState("loading...");

  useEffect(() => {
    matches()
      .then((res) => {
        setRows(res.items ?? []);
        setStatus("ok ✅");
      })
      .catch((e: any) => {
        setStatus(`failed ❌ ${e?.message ?? ""}`);
      });
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "48px auto", padding: 24 }}>
      <h1>Match History</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={goHome}>Back to Home</button>
      </div>

      <p style={{ marginTop: 12 }}>Status: {status}</p>

      {rows.length === 0 ? (
        <p>No matches yet.</p>
      ) : (
        <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Id</th>
              <th align="left">Created</th>
              <th align="left">Status</th>
              <th align="left">Score</th>
              <th align="left">Winner</th>
              <th align="left">Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} style={{ borderTop: "1px solid #333" }}>
                <td>{m.id}</td>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
                <td>{m.status}</td>
                <td>
                  {m.player1Score} - {m.player2Score}
                </td>
                <td>{m.winnerId ?? "DRAW"}</td>
                <td>{m.durationMs ? `${Math.round(m.durationMs / 1000)}s` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
