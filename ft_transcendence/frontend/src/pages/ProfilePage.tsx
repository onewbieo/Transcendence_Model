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
  <div className="px-2 py-1 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="w-fit mx-auto px-2 py-1 pt-5 pb-5 border-4 border-yellow-400">
      <h1 className="block w-fit px-2 py-1 mx-auto border-4 text-center font-extrabold text-xs sm:text-sm md:text-base lg:text-lg hover:bg-zinc-400 rounded-xl">Profile</h1>
      
      <div className="mt-2 flex justify-center">
        <img
          src={avatarSrc}
          alt="avatar"
          width={96}
          height={96}
          className="border border-4 rounded-xl"
        />
      </div>

        <input
          id="avatar-file"
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        
        <div className="mt-3 flex w-full gap-2 justify-center">
          <label
            htmlFor="avatar-file"
            className="px-2 py-1 border-3 border-blue-700 hover:bg-blue-300 font-bold text-blue-700 text-xs sm:text-sm md:text-base lg:text-lg text-center rounded-md"
          >      
            Browse
          </label>
        
          <p 
            className="px-2 py-1 truncate text-center text-xs sm:text-sm md:text-base lg:text-lg font-bold border-3 border-blue-700 hover:bg-blue-300 text-blue-700 rounded-md"
            title={file?.name ?? ""}
          >
            {file?.name ?? "No file selected"}
        </p>
        
          <button
            onClick={onUploadAvatar}
            className="px-2 py-1 border-3 border-blue-700 hover:bg-blue-300 text-blue-700 font-bold text-xs sm:text-sm md:text-base lg:text-lg rounded-md"
          >
            Upload Avatar
          </button>
        </div>

      <label className="mt-9 block mx-auto w-full max-w-[308px] grid gap-1">
        <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-cyan-500">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-slate-500 rounded-md px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg focus:ring-0 outline-none"
        />
      </label>

      <div className="mt-3 mx-auto flex gap-2 justify-center">
        <button
          onClick={onSave}
          className="border-3 px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg border-emerald-700 hover:bg-emerald-300 font-bold text-emerald-700"
        >
          Update Name
        </button>
        <button
          onClick={() => navigate("/")}
          className="border-3 px-2 pt-1 text-xs sm:text-sm md:text-base lg:text-lg border-emerald-700 hover:bg-emerald-300 font-bold text-emerald-700"
        >
          Back to Home
        </button> {/* Use navigate() for routing */}
      </div>

      <p className="mt-3 font-bold text-red-400 text-center">{status}</p>
      
      <label className="mt-9 mx-auto grid w-full max-w-[308px] gap-1 font-bold">
        <span className="text-cyan-500">
          Change Password
        </span>
        <input
          type="password"
          placeholder="Old password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="px-2 py-1 border border-slate-500 rounded-md text-xs sm:text-sm md:text-base lg:text-lg focus:ring-0 outline-none"
        />
        <input
          type="password"
          placeholder="New password (min 8 chars)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-3 px-2 py-1 border border-slate-500 rounded-md text-xs sm:text-sm md:text-base lg:text-lg focus:ring-0 outline-none"
        />
        <button onClick={onChangePassword} className="mt-2 px-2 py-1 w-fit mx-auto border-4 border-orange-500 text-orange-500 font-bold hover:bg-orange-300 text-xs sm:text-sm md:text-base lg:text-lg">
          Update Password
        </button>
        <div
          className="opacity-90">{pwStatus}
        </div>
      </label>  
      
      <h3 className="mt-9 text-center font-extrabold text-xs sm:text-sm md:text-base lg:text-lg">Two-Factor Authentication (2FA)</h3>
      
      <div className="mx-auto grid w-fit gap-2 justify-items-center text-center">
        <div className="text-xs sm:text-sm md:text-base lg:text-lg text-red-500">
          Status:{" "}
          <b>{meUser?.twoFactorEnabled ? "Enabled ✅" : "Not enabled ❌"}</b>
        </div>
        
        {!meUser?.twoFactorEnabled ? (
          <>
            <button onClick={onStartTwoFaSetup} className="border-3 border-indigo-700 text-indigo-700 rounded-xl px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg hover:bg-indigo-200 font-bold">
              Start 2FA Setup (Generate QR)
            </button>
            
            {twoFaQr && (
              <div className="grid gap-2">
                <img
                  src={twoFaQr}
                  alt="2FA QR code"
                  className="mx-auto block"
                />
                
                <input
                  placeholder="Enter 6 digit code"
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                  inputMode="numeric"
                  className="border border-slate-500 rounded-md text-center px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg focus:ring-0 outline-none"
                />
                
                <button onClick={onEnableTwoFa} className="border-4 rounded-xl border-pink-600 text-pink-600 font-bold hover:bg-pink-300 px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg ">
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
              className="border mt-4 text-center px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg"
            />
            
            <button onClick={onDisableTwoFa} className="border px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg">
              Disable 2FA
            </button>
          </>
        )}
        <div className="text-xs sm:text-sm md:text-base lg:text-lg text-red-500 font-bold">{twoFaStatus}</div>
      </div>
    </div>
  </div>
  );
}
