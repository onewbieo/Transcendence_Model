import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { me, updateMe } from "../api";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  
  const navigate = useNavigate(); // Hook to navigate to different routes
  
  async function loadMe() {
    const res = await me();
    setName(res.me?.name ?? "");
  }

  // if you open Profile, then refreshMe updates meUser later, sync the input
  useEffect(() => {
    loadMe().catch(() => {});
  }, []);

  async function onSave() {
    setStatus("saving...");
    try {
      await updateMe({ name });     // ✅ PATCH /users/me
      await loadMe();
      setStatus("Saved ✅");
    }
    catch (e: any) {
      setStatus(`Save failed ❌ ${e?.message ?? ""}`);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "48px auto", padding: 24 }}>
      <h1>Profile</h1>

      <label style={{ display: "grid", gap: 6, maxWidth: 360 }}>
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 10 }} />
      </label>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onSave}>Save</button>
        <button onClick={() => navigate("/")}>Back to Home</button> {/* Use navigate() for routing */}
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>
    </div>
  );
}
