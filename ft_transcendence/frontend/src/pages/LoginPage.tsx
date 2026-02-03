import { useEffect, useState } from "react";
import { login, me, verify2fa } from "../api";
import { setToken } from "../lib/auth";
import { useNavigate } from "react-router-dom"; // Correct import for useNavigate

const TEMP_TOKEN_KEY = "tempToken";

export default function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState(""); // your test user
  const [password, setPassword] = useState(""); // change to your real test pw
  
  const [status, setStatus] = useState<string>("");
  const [meJson, setMeJson] = useState<any>(null);
  
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); // Correct hook use
  
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // If OAUTH flow stored a tempToken, jump straight to 2FA step
  useEffect(() => {
    const t = localStorage.getItem(TEMP_TOKEN_KEY);
    if (t) {
      setTempToken(t);
      setStatus("✅ Google login OK. Enter your 2FA code.");
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMeJson(null);
    
    const normEmail = email.trim().toLowerCase();
    const pw = password;
    
    // frontend checks
    if (!normEmail) {
      setStatus("❌ Email is required.");
      return;
    }
    
    if (!EMAIL_RE.test(normEmail)) {
      setStatus("❌ Invalid email format.");
      return;
    }
    
    if (!pw) {
      setStatus("❌ Password is required.");
      return;
    }
    
    setLoading(true);
    setStatus("Logging in...");

    try {
      const res = await login(normEmail, pw);
      
      // 2FA required path
      if ("requires2fa" in res && res.requires2fa) {
        setTempToken(res.tempToken);
        localStorage.setItem(TEMP_TOKEN_KEY, res.tempToken);
        setStatus("✅ Password OK. Enter your 2FA code.");
        return;
      }
      
      if (!("token" in res)) {
        throw new Error("Login response missing token");
      }
      
      // success: clear any tempToken leftover
      localStorage.removeItem(TEMP_TOKEN_KEY);
      setTempToken(null);
      
      setToken(res.token);

      setStatus("Logged in. Fetching /users/me...");
      const who = await me();
      setMeJson(who);

      setStatus("✅ Login OK");
      onLoggedIn();
      navigate("/"); // Navigate to home page after successful login
    }
    catch (err: any) {
      if (err?.status === 401) {
        setStatus("❌ Wrong email or password.");
        return;
      }
      else if (err?.status === 429) {
        setStatus("❌ Too many attempts. Try again in a bit.");
      }
      else if (err?.status) {
        setStatus(`❌ Login failed (HTTP ${err.status}).`);
      }
      else {
        setStatus(`❌ ${err?.message ?? "login failed"}`);
      }
    }
    finally {
      setLoading(false);
    }
  }
  
  async function onSubmitOtp(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Verifying 2FA...");
    
    try {
      if (!tempToken)
        throw new Error("Missing tempToken. Please login again.");
        
      const res = await verify2fa(tempToken, otp);
      
      // Success clear tempToken
      localStorage.removeItem(TEMP_TOKEN_KEY);
      setTempToken(null);
      
      setToken(res.token);
      
      setStatus("Logged in. Fetching /users/me...");
      const who = await me();
      setMeJson(who);
      
      setStatus("✅ 2FA OK. Logged in.");
      onLoggedIn();
      navigate("/");
    }
    catch (err: any) {
      setStatus(`❌ ${err?.message ?? "2fa failed"}`);
    }
  }
  
  function resetToLogin() {
    // clear temp token everywhere
    localStorage.removeItem(TEMP_TOKEN_KEY);
    setTempToken(null);
    setOtp("");
    setStatus("");
    setMeJson(null);
    
    // make the UI feel like it actually changed
    navigate("/", { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
        
  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Login</h1>
      
      {!tempToken ? (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmail((v) => v.trim().toLowerCase())}
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

          <button
            type="submit"
            disabled={loading}
            style={{ padding: 10, fontSize: "20px" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          
          <button
            type="button"
            style={{ padding: 10, width: "100%", fontSize: "20px" }}
            onClick={() => {
              window.location.href = "/api/auth/oauth/google";
            }}
          >
            Continue with Google
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmitOtp} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>2FA code</span>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              style={{ padding: 10 }}
            />
          </label>
          
          <button type="submit" style={{ padding: 10, fontSize: "20px" }}>
            Verify
          </button>
          
          <button
            type="button"
            style={{ padding: 10, fontSize: "20px" }}
            onClick={resetToLogin}
          >
            Back
          </button>
        </form>
      )}

      <p style={{ marginTop: 12 }}>{status}</p>

      {meJson && (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: "#111",
            color: "#eee",
            overflowX: "auto"
          }}
        >
          {JSON.stringify(meJson, null, 2)}
        </pre>
      )}
    </div>
  );
}
