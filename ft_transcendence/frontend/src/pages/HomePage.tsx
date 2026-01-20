import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { me, notifications, type NotificationRow } from "../api";
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
  const [notifs, setNotifs] = useState<NotificationRow[]>([]);
  
  const navigate = useNavigate(); // Hook to navigate to different routes
  
  // Refresh user info on mount
  async function refreshMe() {
    const data = await me();
    setMeUser(data.me);
    return data.me;
  }
  
  function handleLogout() {
    clearToken();
    onLogout();
    navigate("/login", { replace: true });
  }
  
  useEffect(() => {
    refreshMe()
      .then(async () => {
        setStatus("ok ✅");
        const n = await notifications();
        setNotifs((n.items ?? []).slice(0, 10));
      })
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
          navigate("/login", { replace: true });
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
      <p style={{ fontSize: "20px" }}>
        Status: {status}
      </p>

      <p style={{ fontSize: "20px" }}>
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
        <button
          onClick={goToProfile}
          style={{
            flex: 0.15,
            fontSize: "20px",
          }}
        >
          Profile
        </button>
        <button
          onClick={goToMatches}
          style={{
            flex: 0.2,
            fontSize: "20px",
          }}  
        >
          Matches
        </button>
        <button
          onClick={goToLeaderboard}
          style={{
            flex: 0.22,
            fontSize: "18px",
          }}
        >
          Leaderboard
        </button>
        <button
          onClick={goToLobby}
          style={{
            flex: 0.15,
            fontSize: "20px",
          }}
        >
          Lobby
        </button>
        <button
          onClick={goToGame}
          style={{
            flex: 0.15,
            fontSize: "22px",
          }}
        >
          Game
        </button>
        <button
          onClick={handleLogout}
          style={{
            flex: 0.14,
            fontSize: "22px",
          }}
        >
          Logout
        </button>
      </div>
      
      <h2 style={{ marginTop: 24 }}>Notifications</h2>
        {notifs.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {notifs.map((n) => (
              <li key={n.id} style={{ marginBottom: 6 }}>
                <span style={{ opacity: 0.7 }}>
                  {new Date(n.createdAt).toLocaleString()} —{" "}
                </span>
                {n.message}
              </li>
            ))}
          </ul>
        )}
      <h3 style={{ marginTop: 24 }}>Me</h3>
      <pre style={{ padding: 12, background: "#111", color: "#eee", overflowX: "auto" }}>
        {JSON.stringify(meUser, null, 2)}
      </pre>
    </div>
  );
}
  
  
