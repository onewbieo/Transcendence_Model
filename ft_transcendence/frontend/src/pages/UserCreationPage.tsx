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
    <div className="mt-2 px-2 py-1 pt-5 pb-5 border-4 border-slate-200 mx-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
      <h1 className="text-center font-bold text-xs sm:text-sm md:text-base lg:text-lg">Create New User</h1>
      <form
        onSubmit={handleCreateUser}
        noValidate
      >
          <label className="mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
            <span className="w-20 text-right">Email</span>
            <input
              className="w-56 border px-2 py-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmail((v) => v.trim().toLowerCase())}
              type="email"
            />
          </label>
          
          <label className="mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
            <span className="w-20 text-right">Password</span>
            <input
              className="w-56 border px-2 py-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </label>
          <label className="mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
            <span className="w-20 text-right">Name</span>
            <input
              className="w-56 border px-2 py-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
            /> 
          </label>
        <label className="mt-2 flex items-center justify-center gap-4 text-xs sm:text-sm md:text-base lg:text-lg">
          <span className="w-20 text-right">Role</span>
          <select
            className="w-56"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button
          className="mt-2 flex gap-2 px-2 py-1 border w-fit mx-auto text-xs sm:text-sm md:text-base lg:text-lg hover:bg-red-400"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create User"}
        </button>
        <button
          className="mt-2 flex gap-2 px-2 py-1 border w-fit mx-auto text-xs sm:text-sm md:text-base lg:text-lg hover:bg-red-400"
          type="button"
          onClick={() => navigate("/admin")}
        >
          Back to Admin Dashboard
        </button>
      </form>
      <p>{status}</p>
    </div>
  </div>
  );
}

