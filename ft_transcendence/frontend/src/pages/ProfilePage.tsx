import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { me, updateMe, uploadAvatar } from "../api";
import type { userDTO } from "..api";

type MeUser = UserDTO & { role: string; createdAt: string };

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [meUser, setMeUser] = useState<MeUser | null>(null);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);  
  
  const navigate = useNavigate(); // Hook to navigate to different routes
  
  async function loadMe() {
    const res = await me();
    setMeUser(res.me);
    setName(res.me?.name ?? "");
    return res.me;
  }

  // if you open Profile, then refreshMe updates meUser later, sync the input
  useEffect(() => {
    loadMe().catch(() => {});
  }, []);

  async function onSave() {
    setStatus("saving name...");
    try {
      await updateMe({ name });     // ✅ PATCH /users/me
      await loadMe();
      setStatus("Saved ✅");
    }
    catch (e: any) {
      setStatus(`Save failed ❌ ${e?.message ?? ""}`);
    }
  }
  
  async function onUploadAvatar() {
    if (!file) {
      setStatus("Pick a file first 🙂");
      return;
    }
    
    setStatus("uploading avatar...");
    try {
      await uploadAvatar(file);
      setFile(null);
      await loadMe();
      setStatus("Avatar uploaded ✅");
    }
    catch (e: any) {
      setStatus(`Upload failed ❌ ${e?.message ?? ""}`);
    }
  }
  
  const avatarSrc =
    meUser?.avatarUrl ? meUser.avatarUrl : "/default-avatar.png";

  return (
    <div style={{ maxWidth: 720, margin: "48px auto", padding: 24 }}>
      <h1>Profile</h1>
      
      <div style={{ display: "flex", gap:16, alignItems: "center", marginTop: 12 }}>
        <img
          src={avatarSrc}
          alt="avatar"
          width={96}
          height={96}
          style={{ borderRadius: 12, objectFit: "cover", border: "1px solid #333" }}
        />
      
      <div style={{ display: "grid", gap: 8 }}>
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button onClick={onUploadAvatar}>Upload Avatar</button>
      </div>
    </div>

      <label style={{ display: "grid", gap: 6, maxWidth: 360, marginTop: 18 }}>
        <span>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10 }}
        />
      </label>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onSave}>Save</button>
        <button onClick={() => navigate("/")}>Back to Home</button> {/* Use navigate() for routing */}
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>
    </div>
  );
}
