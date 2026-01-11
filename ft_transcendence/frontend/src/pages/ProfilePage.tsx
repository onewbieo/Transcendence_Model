import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { updateMe } from "../api";

export default function ProfilePage({
  meUser,
  refreshMe,
  goHome,
}: {
  meUser: any;
  refreshMe: () => Promise<any>;
  goHome: () => void;
}) {
  const [name, setName] = useState(meUser?.name ?? "");
  const [status, setStatus] = useState("");
  
  const navigate = useNavigate(); // Hook to navigate to different routes

  // if you open Profile, then refreshMe updates meUser later, sync the input
  useEffect(() => {
    setName(meUser?.name ?? "");
  }, [meUser?.name]);

  async function onSave() {
    setStatus("saving...");
    try {
      await updateMe({ name });     // ✅ PATCH /users/me
      await refreshMe();            // ✅ refresh Home immediately
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
