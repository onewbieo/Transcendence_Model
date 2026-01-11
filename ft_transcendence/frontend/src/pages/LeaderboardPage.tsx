import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { leaderboard, type LeaderboardRow } from "../api";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [status, setStatus] = useState("loading...");
  
  const navigate = useNavigate();

  useEffect(() => {
    leaderboard()
      .then((data) => {
        setRows(data ?? []);
        setStatus("ok ✅");
      })
      .catch((e: any) => setStatus(`failed ❌ ${e?.message ?? ""}`));
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "48px auto", padding: 24 }}>
      <h1>Leaderboard</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => navigate("/")}>Back to Home</button> {/* Use navigate() for routing */}
      </div>

      <p style={{ marginTop: 12 }}>Status: {status}</p>

      {rows.length === 0 ? (
        <p>No leaderboard yet.</p>
      ) : (
        <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">#</th>
              <th align="left">Name</th>
              <th align="left">Email</th>
              <th align="left">Wins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.user.id} style={{ borderTop: "1px solid #333" }}>
                <td>{idx + 1}</td>
                <td>{r.user.name ?? "(no name)"}</td>
                <td>{r.user.email}</td>
                <td>{r.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
