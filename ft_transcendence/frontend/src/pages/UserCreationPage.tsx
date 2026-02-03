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
            onBlur={() => setEmail((v) => v.trim().toLowerCase())}
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

