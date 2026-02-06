import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import {
  me,
  updateMe,
  uploadAvatar,
  changePassword,
  twoFaSetup,
  twoFaEnable,
  twoFaDisable,
  type UserDTO, 
} from "../api";

type MeUser = UserDTO & { role: string; createdAt: string };

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [meUser, setMeUser] = useState<MeUser | null>(null);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState("");
  
  const [twoFaQr, setTwoFaQr] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaDisableCode, setTwoFaDisableCode] = useState("");
  const [twoFaStatus, setTwoFaStatus] = useState("");
  
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
    setStatus("updating Name...");
    try {
      await updateMe({ name });     // ✅ PATCH /users/me
      await loadMe();
      setStatus("Name updated ✅");
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
  
  async function onChangePassword() {
    setPwStatus("updating password...");
    try {
      if (!oldPassword || !newPassword) {
        setPwStatus("Please fill in both passwords.");
        return;
      }
      if (newPassword.length < 8) {
        setPwStatus("New password must be at least 8 characters.");
        return;
      }
      
      await changePassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setPwStatus("Password updated ✅");
    }
    catch (e: any) {
      setPwStatus(`Password update failed ❌ ${e?.message ?? ""}`);
    }
  }
  
  async function onStartTwoFaSetup() {
    setTwoFaStatus("Starting 2FA setup...");
    try {
      const res = await twoFaSetup();
      setTwoFaQr(res.qrDataUrl);
      setTwoFaStatus("Scan the QR with Google Authenticator / Authy, then enter the 6-digit code to enable.");
      await loadMe();
    }
    catch (e: any) {
      setTwoFaStatus(`2FA setup failed ❌ ${e?.message ?? ""}`);
    }
  }
  
  async function onEnableTwoFa() {
    setTwoFaStatus("Enabling 2FA...");
    try {
      if (!twoFaCode) {
        setTwoFaStatus("Enter the 6-digit code from your authenticator app.");
        return;
      }
      await twoFaEnable(twoFaCode);
      setTwoFaCode("");
      setTwoFaQr(null);
      await loadMe();
      setTwoFaStatus("2FA enabled ✅");
    }
    catch (e: any) {
      setTwoFaStatus(`Enable failed ❌ ${e?.message ?? ""}`);
    }
  }
  
  async function onDisableTwoFa() {
    setTwoFaStatus("Disabling 2FA...");
    try {
      if (!twoFaDisableCode) {
        setTwoFaStatus("Enter the 6-digit code to disable 2FA.");
        return;
      }
      await twoFaDisable(twoFaDisableCode);
      setTwoFaDisableCode("");
      setTwoFaQr(null);
      await loadMe();
      setTwoFaStatus("2FA disabled ✅");
    }
    catch (e: any) {
      setTwoFaStatus(`Disable failed ❌ ${e?.message ?? ""}`);
    }
  }
  
  const avatarSrc =
    meUser?.avatarUrl ? meUser.avatarUrl : "/default-avatar.png";

  return (
    <div style={{ maxWidth: 720, margin: "48px auto", padding: 24 }}>
      <h1>Profile</h1>
      
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 12 }}>
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
          style={{ fontSize: "15px" }}
        />
        <button
          onClick={onUploadAvatar}
          style={{ fontSize: "15px", width: 195 }}>
          Upload Avatar
        </button>
      </div>
    </div>

      <label style={{ display: "grid", gap: 4, maxWidth: 308, marginTop: 18 }}>
        <span style={{ fontSize: "18px" }}>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10 }}
        />
      </label>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={onSave}
          style={{
            flex: 0.18,
            fontSize: "16px",
            padding: "2px",
          }}
        >
          Update Name
        </button>
        <button
          onClick={() => navigate("/")}
          style={{
            flex: 0.22,
            fontSize: "16px",
            padding: "5px",
          }}
        >
          Back to Home
        </button> {/* Use navigate() for routing */}
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>
      
      <h2 style={{ marginTop: 28 }}>Change Password</h2>
      <div style={{ display: "grid", gap: 10, maxWidth: 305 }}>
        <input
          type="password"
          placeholder="Old password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          style={{ padding: 10 }}
        />
        <input
          type="password"
          placeholder="New password (min 8 chars)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ padding: 10}}
        />
        <button onClick={onChangePassword} style={{ padding: 10, fontSize: 16 }}>
          Update Password
        </button>
        <div style={{ opacity: 0.9 }}>{pwStatus}</div>
      </div>  
      <h3 style={{ marginTop: 28 }}>Two-Factor Authentication (2FA)</h3>
      
      <div style={{ display: "grid", gap: 10, maxWidth: 305 }}>
        <div style={{ fontSize: "16px" }}>
          Status:{" "}
          <b>{meUser?.twoFactorEnabled ? "Enabled ✅" : "Not enabled ❌"}</b>
        </div>
        
        {!meUser?.twoFactorEnabled ? (
          <>
            <button onClick={onStartTwoFaSetup} style={{ padding: 10, fontSize: "16px" }}>
              Start 2FA Setup (Generate QR)
            </button>
            
            {twoFaQr && (
              <div style={{ display: "grid", gap: 8 }}>
                <img
                  src={twoFaQr}
                  alt="2FA QR code"
                  style={{ width: 220, height: 220, border: "1px solid #333", borderRadius: 8 }}
                />
                
                <input
                  placeholder="Enter 6 digit code"
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                  inputMode="numeric"
                  style={{ padding: 10 }}
                />
                
                <button onClick={onEnableTwoFa} style={{ padding: 10, fontSize: "16px" }}>
                  Enable 2FA
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <input
              placeholder="Enter 6-digit code to disable"
              value={twoFaDisableCode}
              onChange={(e) => setTwoFaDisableCode(e.target.value)}
              inputMode="numeric"
              style={{ padding: 10 }}
            />
            
            <button onClick={onDisableTwoFa} style={{ padding: 10, fontSize: "16px" }}>
              Disable 2FA
            </button>
          </>
        )}
        <div style={{ opacity: 0.9 }}>{twoFaStatus}</div>
      </div>
    </div>
  );
}
