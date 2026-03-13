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
  <div className="px-4 py-8 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="mx-auto px-2 py-1 pt-5 pb-5 border-4 border-yellow-400 sm:max-w-sm md:max-w-md lg:max-w-lg">
      <h1 className="block w-fit px-2 py-1 mx-auto mb-1 text-xs sm:text-sm md:text-base lg:text-lg text-center font-extrabold border-4 hover:bg-zinc-400 rounded-md">Welcome</h1>
      
      {!tempToken ? (
        <form onSubmit={onSubmit} className="grid gap-3 block">
          <label className="grid gap-1.5">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg text-cyan-500 font-bold">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmail((v) => v.trim().toLowerCase())}
              autoComplete="email"
              className="border-4 border-slate-500 px-3 py-2 focus:ring-0 outline-none"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg text-cyan-500 font-bold">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="border-4 border-slate-500 px-3 py-2 focus:ring-0 outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 border-4 mx-auto px-2 border-blue-700 text-blue-700 font-extrabold hover:bg-blue-300 text-xs sm:text-sm md:text-base lg:text-lg rounded-xl"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          
          <button
            type="button"
            className="mt-2 border-4 border-emerald-700 mx-auto px-2 text-xs sm:text-sm md:text-base lg:text-lg hover:bg-emerald-400 text-emerald-700 font-extrabold rounded-xl"
            onClick={() => {
              window.location.href = "/api/auth/oauth/google";
            }}
          >
            Continue with Google
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmitOtp} className="grid gap-3">
          <label className="mt-2 grid text-center gap-2">
            <span>2FA code</span>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="w-fit mx-auto border rounded-md text-center px-4 py-2"
            />
          </label>
          
          <button type="submit" className="mt-2 px-4 py-2 w-fit mx-auto border text-xs sm:text-sm md:text-base lg:text-lg hover:bg-lime-400">
            Verify
          </button>
          
          <button
            type="button"
            className="px-4 py-2 w-fit mx-auto border text-xs sm:text-sm md:text-base lg:text-lg hover:bg-lime-400"
            onClick={resetToLogin}
          >
            Back
          </button>
        </form>
      )}

      <p className="mt-3 text-center text-red-500 font-extrabold text-xs sm:text-sm md:text-base lg:text-lg">{status}</p>

      {meJson && (
        <pre
          className="mt-3 px-4 py-2 bg-black text-white overflow-x-auto"
        >
          {JSON.stringify(meJson, null, 2)}
        </pre>
      )}
      
    </div>
</div>
  );
}
