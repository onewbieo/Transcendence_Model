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
    setStatus("Creating admin...");

    try {
      const data = await api("/admin/first-setup", {
        method: "POST",
        body: JSON.stringify({ email: normEmail, password: pw, name: name.trim() || null }),
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
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 24 }}>
      <h1>Create Admin User</h1>
      <form onSubmit={handleFirstSetup} noValidate style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            style={{ padding: 10 }}
          />
        </label>

        <button type="submit" style={{ padding: 10 }} disabled={loading}>
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </form>

      <p>{status}</p>
    </div>
  );
}

