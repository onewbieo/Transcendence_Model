import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function FirstSetupPage({ onSetupComplete }: {onSetupComplete?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleFirstSetup(e: React.FormEvent) {
    e.preventDefault();
    
    const normEmail = email.trim().toLowerCase();
    const pw = password;
    const normName = name.trim();
    
    if (!normEmail) {
      setStatus("Email is required.");
      return;
    }
    
    if (!pw) {
      setStatus("Password is required.");
      return;
    }
    
    if (!EMAIL_RE.test(normEmail)) {
      setStatus("Invalid email format.");
      return;
    }
    
    if (pw.length < 8 || pw.length > 72) {
      setStatus("Password must be 8-72 characters.");
      return;
    }
    
    if (!normName) {
      setStatus("Name is required.");
      return;
    }
    
    setLoading(true);
    setStatus("Creating admin...");

    try {
      const data = await api("/admin/first-setup", {
        method: "POST",
        body: JSON.stringify({ email: normEmail, password: pw, name: normName }),
      });
      
      // backend sends { message: "...", user: {...} }
      setStatus(data.message || "Admin user created successfully!");
      
      if (onSetupComplete)
        onSetupComplete();
      
      // redirect after a short delay
      setTimeout(() => navigate("/login"), 3000);
    }
    catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
    finally {
      setLoading(false);
    }
  }

  return (
  <div className="px-4 py-8 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="px-2 py-1 pt-5 pb-5 mx-auto w-fit border-3 border-slate-300">
      <h1 className="text-center font-bold">Create Admin User</h1>
      <form onSubmit={handleFirstSetup} noValidate className="grid gap-3">
        <label className="mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
          <span className="w-20 text-right">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmail((v) => v.trim().toLowerCase())}
            type="email"
            className="w-56 border px-2 py-1"
          />
        </label>

        <label className="mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
          <span className="w-20 text-right">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-56 border px-2 py-1 "
          />
        </label>

        <label className="mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
          <span className="w-20 text-right">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            className="w-56 border px-2 py-1"
          />
        </label>

        <button type="submit" className="px-2 py-1 w-fit mx-auto border text-xs sm:text-sm md:text-base lg:text-lg hover:bg-red-400" disabled={loading}>
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </form>

      <p className="mt-2 text-center font-bold text-xs sm:text-sm md:text-base lg:text-lg">{status}</p>
    </div>
  </div>
  );
}

