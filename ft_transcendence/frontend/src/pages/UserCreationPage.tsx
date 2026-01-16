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

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("Creating user...");

    try {
      const data = await api("/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, password, name, role }),
      });

      setStatus("User created successfully!");
      // redirect back to user list or dashboard
      setTimeout(() => navigate("/admin/users"), 1500);
    }
    catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 24 }}>
      <h1>Create New User</h1>
      <form onSubmit={handleCreateUser} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} type="text" />
        </label>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>
      <p>{status}</p>
    </div>
  );
}

