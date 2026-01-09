import { useEffect, useState } from "react";
import { me } from "../api";
import { clearToken } from "../lib/auth";
import ProfilePage from "./ProfilePage";
import MatchesPage from "./MatchesPages";
import LeaderboardPage from "./LeaderboardPage";
import TournamentsPage from "./TournamentsPage";
import LobbyPage from "./LobbyPage";
import GamePage from "./GamePage";

type MeUser = { id: number; email: string; name: string | null; role: string; createdAt: string };
type Tab = "home" | "profile" | "matches" | "leaderboard" | "tournaments" | "lobby" | "game";

export default function HomePage({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [meUser, setMeUser] = useState<MeUser | null>(null);
  const [status, setStatus] = useState("loading...");
  
  useEffect(() => {
    const path = window.location.pathname;

    if (path === "/game") {
      setTab("game");
    }
    else if (path === "/tournaments") {
      setTab("tournaments");
    }
    else if (path === "/lobby") {
      setTab("lobby");
    }
  }, []);

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
  
  if (tab === "profile") {
    return (
      <ProfilePage
        meUser={meUser}
        refreshMe={refreshMe}
        goHome={() => setTab("home")}
      />
    );
  }
  
  if (tab === "matches") {
    return <MatchesPage goHome={() => setTab("home")} />;
  }
  
  if (tab === "leaderboard") {
    return <LeaderboardPage goHome={() => setTab("home")} />;
  }
  
  if (tab === "tournaments") {
    return <TournamentsPage goHome={() => setTab("home")} />;
  }
  
  if (tab === "lobby") {
    return <LobbyPage goHome={() => setTab("home")} />;
  }
  
  if (tab === "game") {
    return <GamePage goHome={() => setTab("home")} />;
  }

  return (
    <div style={{ maxWidth: 720, margin: "48px auto", padding: 24 }}>
      <h1>ft_transcendence</h1>
      <p>Status: {status}</p>

      <p>
        Logged in as: <b>{meUser?.name ?? "(no name yet)"}</b>
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setTab("profile")}>Profile</button>
        <button onClick={() => setTab("matches")}>Matches</button>
        <button onClick={() => setTab("leaderboard")}>Leaderboard</button>
        <button onClick={() => setTab("tournaments")}>Tournaments</button>
        <button onClick={() => setTab("lobby")}>Lobby</button>
        <button onClick={() => setTab("game")}>Game</button>
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
