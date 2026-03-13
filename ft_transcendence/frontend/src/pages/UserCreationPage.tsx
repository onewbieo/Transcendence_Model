import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function UserCreationPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("USER");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    
    const normEmail = email.trim().toLowerCase();
    const pw = password;
    
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
    
    setLoading(true);
    setStatus("Creating user...");

    try {
      const data = await api("/admin/users", {
        method: "POST",
        body: JSON.stringify({ email: normEmail, password: pw, name: name.trim() || null, role }),
      });

      setStatus("User created successfully!");
      // redirect back to user list or dashboard
      setTimeout(() => navigate("/admin"), 3000);
    }
    catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
    finally {
      setLoading(false);
    }
  }

  return (
  <div className="px-4 py-2 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="mt-2 px-2 py-1 pt-5 pb-5 border-4 border-yellow-400 mx-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
      <h1 className="border-4 rounded-md hover:bg-zinc-400 block w-fit mx-auto px-2 py-1 text-center font-bold text-xs sm:text-sm md:text-base lg:text-lg">Create New User</h1>
      <form
        onSubmit={handleCreateUser}
        noValidate
      >
          <label className="mt-8 flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
            <span className="text-cyan-500 font-bold">Email</span>
            <input
              className="w-full border-3 border-slate-400 px-2 py-1 focus:ring-0 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmail((v) => v.trim().toLowerCase())}
              type="email"
            />
          </label>
          
          <label className="mt-2 flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
            <span className="text-cyan-500 font-bold">Password</span>
            <input
              className="w-full border-3 border-slate-400 px-2 py-1 focus:ring-0 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </label>
          <label className="mt-2 flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
            <span className="text-cyan-500 font-bold">Name</span>
            <input
              className="w-full border-3 border-slate-400 px-2 py-1 focus:ring-0 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
            /> 
          </label>
        <label className="mt-2 flex items-center gap-4 text-xs sm:text-sm md:text-base lg:text-lg">
          <span className="text-cyan-500 font-bold">Role</span>
          <select
            className="font-bold border-3 border-slate-400 rounded-md px-2 py-1"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button
          className="mt-2 flex gap-2 px-2 py-1 border-4 border-blue-700 text-blue-700 rounded-xl font-bold w-fit mx-auto text-xs sm:text-sm md:text-base lg:text-lg hover:bg-blue-300"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create User"}
        </button>
        <button
          className="mt-3 flex gap-2 px-2 py-1 border-4 border-emerald-700 text-emerald-700 rounded-xl font-bold w-fit mx-auto text-xs sm:text-sm md:text-base lg:text-lg hover:bg-emerald-300"
          type="button"
          onClick={() => navigate("/admin")}
        >
          Back to Admin Dashboard
        </button>
      </form>
      <p className="mt-5 text-center text-red-400 font-extrabold text-xs sm:text-sm md:text-base lg:text-lg">{status}</p>
    </div>
  </div>
  );
}

