import { useState } from "react";
import { login, me } from "../api";
import { setToken } from "../lib/auth";
import { useNavigate } from "react-router-dom"; // Correct import for useNavigate

export default function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState(""); // your test user
  const [password, setPassword] = useState(""); // change to your real test pw
  const [status, setStatus] = useState<string>("");
  const [meJson, setMeJson] = useState<any>(null);
  const navigate = useNavigate(); // Correct hook use

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Logging in...");
    setMeJson(null);

    try {
      const res = await login(email, password);
      setToken(res.token);

      setStatus("Logged in. Fetching /users/me...");
      const who = await me();
      setMeJson(who);

      setStatus("✅ Login OK");
      onLoggedIn();
      navigate("/"); // Navigate to home page after successful login
    } catch (err: any) {
      setStatus(`❌ ${err?.message ?? "login failed"}`);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Login</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            style={{ padding: 10 }}
          />
        </label>

        <button type="submit" style={{ padding: 10 }}>
          Login
        </button>
      </form>

      <p style={{ marginTop: 12 }}>{status}</p>

      {meJson && (
        <pre style={{ marginTop: 12, padding: 12, background: "#111", color: "#eee", overflowX: "auto" }}>
          {JSON.stringify(meJson, null, 2)}
        </pre>
      )}
    </div>
  );
}

