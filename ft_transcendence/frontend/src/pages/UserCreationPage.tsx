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
    
    if (!email || !password) {
      setStatus("Email and password are required.");
      return;
    }
    
    setLoading(true);
    setStatus("Creating user...");

    try {
      const data = await api("/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, password, name, role }),
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
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 24 }}>
      <h1>Create New User</h1>
      <form
        onSubmit={handleCreateUser}
        noValidate
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label style={{ fontSize: "18px" }}>
            Email
          </label>
          <input 
            style={{
              padding: "4px",
              width: "220px",
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>  
          <label style={{ fontSize: "18px" }}>
            Password
          </label>
            <input
              style={{
                padding: "4px",
                width: "185px",
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label style={{ fontSize: "18px" }}>
            Name
          </label>
            <input
              style={{
                padding: "4px",
                width: "218px",
              }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
            />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}> 
        <label>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            fontSize: "20px",
            width: "71%",
          }}
        >
          {loading ? "Creating..." : "Create User"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin")}
          style={{
            fontSize: "20px",
            width: "71%",
            marginTop: 8,
            padding: 3,
          }}
        >
          Back to Admin Dashboard
        </button>
      </form>
      <p>{status}</p>
    </div>
  );
}

