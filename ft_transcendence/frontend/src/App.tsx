import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import MatchesPage from "./pages/MatchesPages";
import LeaderboardPage from "./pages/LeaderboardPage";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";
import LoginPage from "./pages/LoginPage";
import { getToken } from "./lib/auth"; // Token helper for login status
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import FirstSetupPage from "./pages/FirstSetupPage";
import UserCreationPage from "./pages/UserCreationPage.tsx";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import UserListPage from "./pages/UserListPage";
import { api } from "./api";


export default function App() {
  const [hasToken, setHasToken] = useState<boolean>(() => !!getToken());
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Check token storage and first time setup state
  useEffect(() => {
    const onStorage = () => setHasToken(!!getToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  
  // Check if there are users (to decide if first setup is needed)
  useEffect(() => {
    const checkForUsers = async () => {
      try {
        const data = await api("/admin/first-setup", { method: "GET" })
        if (data?.firstSetupRequired) {
          setIsFirstTime(true);
        }
        else {
          setIsFirstTime(false);
        }
      }
      catch (error: any) {
        // If backend returned 400, mark first time setup
        if (error.message.includes("400")) {
          setIsFirstTime(false);
        }
      }
      finally {
        setLoading(false);
      }
    };
    
    checkForUsers();
  }, []);
  
  if (loading) {
    return <div>Loading...</div>;
  }

  // Main App with routing wrapped in Router
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isFirstTime ? (
              <Navigate to="/first-setup" replace />
            ) : hasToken ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLoggedIn={() => setHasToken(true)} />
            )
          }
        />
        
        <Route
          path="/oauth/callback"
          element={<OAuthCallbackPage onLoggedIn={() => setHasToken(true)} />}
        />
        
        <Route
          path="/"
          element={
            isFirstTime ? (
              <Navigate to="/first-setup" replace />
            ) : hasToken ? (
              // TODO: check role here
              <HomePage onLogout={() => setHasToken(false)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/game" element={<GamePage />} />
        
        {/* First Time Setup Route */}
        <Route
          path="/first-setup"
          element={<FirstSetupPage onSetupComplete={() => setIsFirstTime(false)} />}
        />
        <Route path="/create-user" element={<UserCreationPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<UserListPage />} />
      </Routes>
    </Router>
  );
}

