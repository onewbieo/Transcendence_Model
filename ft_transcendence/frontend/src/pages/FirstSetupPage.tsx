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
      const data = await api<{ message?: string }>("/admin/first-setup", {
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
    <div className="px-2 py-1 pt-5 pb-5 mx-auto border-4 border-yellow-300 sm:max-w-sm md:max-w-md lg:max-w-lg">
      <h1 className="px-2 py-1 block w-fit mx-auto rounded-md text-center font-bold border-3 hover:bg-zinc-400">Create Admin User</h1>
      <form onSubmit={handleFirstSetup} noValidate className="grid gap-3">
        <label className="mt-6 flex gap-2 items-center text-xs sm:text-sm md:text-base lg:text-lg">
          <span className="text-cyan-500 font-bold">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmail((v) => v.trim().toLowerCase())}
            type="email"
            className="w-full border-3 border-slate-400 px-2 py-1 focus:ring-0 outline-none"
          />
        </label>

        <label className="mt-2 flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
          <span className="text-left text-cyan-500 font-bold">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full border-3 border-slate-400 px-2 py-1 focus:ring-0 outline-none"
          />
        </label>

        <label className="mt-2 flex gap-2 items-center text-xs sm:text-sm md:text-base lg:text-lg">
          <span className="font-bold text-cyan-500">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            className="w-full border-3 border-slate-400 px-2 py-1 focus:ring-0 outline-none"
          />
        </label>

        <button type="submit" className="px-2 py-1 w-fit mx-auto border-4 border-blue-700 text-blue-700 font-bold rounded-xl text-xs sm:text-sm md:text-base lg:text-lg hover:bg-blue-300" disabled={loading}>
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </form>

      <p className="mt-3 text-center font-extrabold text-red-500 text-xs sm:text-sm md:text-base lg:text-lg">{status}</p>
    </div>
  </div>
  );
}
