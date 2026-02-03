import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { matches, type MatchRow } from "../api";

const PAGE_SIZE = 20;

export default function MatchesPage() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [status, setStatus] = useState("loading...");
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function loadFirst() {
    setLoading(true);
    setStatus("loading...");
    try {
      const res = await matches({ take: PAGE_SIZE });
      console.log("FIRST RES:", res);

      setRows(res.items ?? []);
      setNextCursor(res.nextCursor ?? null);
      setStatus("ok ✅");
    }
    catch (e: any) {
      setStatus(`failed ❌ ${e?.message ?? ""}`);
    }
    finally {
      setLoading(false);
    }
  }

  async function loadNext() {
    if (nextCursor === null || loading)
      return;

    setLoading(true);
    try {
      const res = await matches({ take: PAGE_SIZE, cursor: nextCursor });
      console.log("NEXT RES:", res);

      setRows(res.items ?? []);
      setNextCursor(res.nextCursor ?? null);
    }
    catch (e: any) {
      setStatus(`failed ❌ ${e?.message ?? ""}`);
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFirst();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "48px auto", padding: 24 }}>
      <h1>Match History</h1>

      <button onClick={() => navigate("/")}>Back to Home</button>

      <p style={{ marginTop: 12, fontSize: "22px" }}>Status: {status}</p>

      {rows.length === 0 ? (
        <p style={{ fontSize: "22px" }}>No matches yet.</p>
      ) : (
        <>
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
                  <td>{m.player1Score} - {m.player2Score}</td>
                  <td>{m.winnerId ?? "DRAW"}</td>
                  <td>{m.durationMs ? `${Math.round(m.durationMs / 1000)}s` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
            {nextCursor !== null ? (
              <button
                onClick={loadNext}
                disabled={loading}
                style={{ padding: 10, fontSize: "16px", minWidth: 180 }}
              >
                {loading ? "Loading..." : "Next page"}
              </button>
            ) : (
              <div style={{ opacity: 0.7 }}>No more matches.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

