import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { me } from "../api";
import { clearToken } from "../lib/auth";
import ProfilePage from "./ProfilePage";
import MatchesPage from "./MatchesPages";
import LeaderboardPage from "./LeaderboardPage";
import LobbyPage from "./LobbyPage";
import GamePage from "./GamePage";

type MeUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  avatarUrl?: string | null;
};

export default function HomePage({ onLogout }: { onLogout: () => void }) {
  const [meUser, setMeUser] = useState<MeUser | null>(null);
  const [status, setStatus] = useState("loading...");
  const navigate = useNavigate(); // Hook to navigate to different routes
  
  // Refresh user info on mount
  async function refreshMe() {
    const data = await me();
    setMeUser(data.me);
    return data.me;
  }
  
  useEffect(() => {
    refreshMe()
      .then(() => setStatus("ok ✅"))
      .catch((e: any) => {
        console.error("me() failed:", e);
        
        const msg = String(e?.message ?? "");

        // ⛔ ONLY logout on auth failure
        if (
          msg.includes("401") ||
          msg.includes("Unauthorized") ||
          msg.includes("Forbidden")
        ) {
          setStatus("session expired ❌");
          clearToken();
          onLogout();
          return;
        }

        // ✅ Otherwise, stay logged in
        setStatus("backend error ⚠️ (still logged in)");
      });
  }, []);
  
  const goToProfile = () => navigate("/profile");
  const goToMatches = () => navigate("/matches");
  const goToLeaderboard = () => navigate("/leaderboard");
  const goToLobby = () => navigate("/lobby");
  const goToGame = () => navigate("/game");
  
  return (
    <div style={{ maxWidth: 720, margin: "48px auto", padding: 24 }}>
      <h1>ft_transcendence</h1>
      <p>Status: {status}</p>

      <p>
        Logged in as: <b>{meUser?.name ?? "(no name yet)"}</b>
      </p>
      
      <div style={{ marginTop: 12 }}>
        <img
          src={meUser?.avatarUrl ?? "/default-avatar.png"}
          alt="avatar"
          width={96}
          height={96}
          style={{
            borderRadius: 12,
            objectFit: "cover",
            border: "1px solid #333",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {/* Use navigate for routing */}
        <button onClick={goToProfile}>Profile</button>
        <button onClick={goToMatches}>Matches</button>
        <button onClick={goToLeaderboard}>Leaderboard</button>
        <button onClick={goToLobby}>Lobby</button>
        <button onClick={goToGame}>Game</button>
        <button
          onClick={() => {
            clearToken();
            onLogout();
          }}
        >
          Logout
        </button>
      </div>

      <h2 style={{ marginTop: 24 }}>Me</h2>
      <pre style={{ padding: 12, background: "#111", color: "#eee", overflowX: "auto" }}>
        {JSON.stringify(meUser, null, 2)}
      </pre>
    </div>
  );
}
  
  
