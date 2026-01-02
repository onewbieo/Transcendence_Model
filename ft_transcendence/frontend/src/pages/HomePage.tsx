import { useEffect, useState } from "react";
import { me } from "../api";
import { clearToken } from "../lib/auth";

export default function HomePage({ onLogout }: { onLogout: () => void }) {
  const [meJson, setMeJson] = useState<any>(null);
  const [status, setStatus] = useState("loading...");

  useEffect(() => {
    me()
      .then((data) => {
        setMeJson(data.me);
        setStatus("ok ✅");
      })
      .catch((e) => {
        setStatus(`failed ❌ ${e?.message ?? ""}`);
        clearToken();
        onLogout();
      });
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "48px auto", padding: 24 }}>
      <h1>ft_transcendence</h1>
      <p>Status: {status}</p>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={() => {
            clearToken();
            onLogout();
          }}
        >
          Logout
        </button>
      </div>

      <h2 style={{ marginTop: 24 }}>Me</h2>
      <pre style={{ padding: 12, background: "#111", color: "#eee", overflowX: "auto" }}>
        {JSON.stringify(meJson, null, 2)}
      </pre>

      <h2 style={{ marginTop: 24 }}>Next pages to build</h2>
      <ul>
        <li>Profile page (PATCH /users/me)</li>
        <li>Match history (GET /matches)</li>
        <li>Leaderboard (GET /leaderboard)</li>
        <li>Tournaments (POST /tournaments, join, bracket)</li>
        <li>Game lobby + WS</li>
      </ul>
    </div>
  );
}
