import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import MatchesPage from "./pages/MatchesPages";
import LeaderboardPage from "./pages/LeaderboardPage";
import TournamentsPage from "./pages/TournamentsPage";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";
import LoginPage from "./pages/LoginPage";
import { getToken } from "./lib/auth"; // Token helper for login status

export default function App() {
  const [hasToken, setHasToken] = useState<boolean>(() => !!getToken());

  // Check token storage to manage login state
  useEffect(() => {
    const onStorage = () => setHasToken(!!getToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Main App with routing wrapped in Router
  return (
    <Router>
      <Routes>
        <Route path="/" element={hasToken ? <HomePage onLogout={() => setHasToken(false)} /> : <LoginPage onLoggedIn={() => setHasToken(true)} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </Router>
  );
}

