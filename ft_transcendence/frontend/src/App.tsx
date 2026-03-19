import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import MatchesPage from "./pages/MatchesPages";
import LeaderboardPage from "./pages/LeaderboardPage";
import GamePage from "./pages/GamePage";
import LoginPage from "./pages/LoginPage";
import { getToken } from "./lib/auth"; // Token helper for login status
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import FirstSetupPage from "./pages/FirstSetupPage";
import UserCreationPage from "./pages/UserCreationPage.tsx";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import UserListPage from "./pages/UserListPage";
import { api, me } from "./api";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import Footer from "./components/Footer";
import PublicApiTestPage from "./pages/PublicApiTestPage";

export default function App() {
  const [hasToken, setHasToken] = useState<boolean>(() => !!getToken());
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(() => !!getToken());
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check token storage and first time setup state
  useEffect(() => {
    const onStorage = () => setHasToken(!!getToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncRole = async () => {
      if (!hasToken) {
        setUserRole(null);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);

      try {
        const data = await me();
        if (!cancelled) {
          setUserRole(data.me?.role ?? null);
        }
      }
      catch {
        if (!cancelled) {
          setUserRole(null);
        }
      }
      finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    syncRole();

    return () => {
      cancelled = true;
    };
  }, [hasToken]);
  
  // Check if there are users (to decide if first setup is needed)
  useEffect(() => {
    const checkForUsers = async () => {
      try {
        const data = await api<{ firstSetupRequired: boolean }>("/admin/first-setup", { method: "GET" });
        if (data?.firstSetupRequired) {
          setIsFirstTime(true);
        }
        else {
          setIsFirstTime(false);
        }
      }
      catch (error: any) {
        // If request fails, assume not first time (or show an error UI)
          setIsFirstTime(false);
      }
      finally {
        setLoading(false);
      }
    };
    
    checkForUsers();
  }, []);
  
  if (loading || authLoading) {
    return <div>Loading...</div>;
  }

  // Main App with routing wrapped in Router
  return (
    <Router>
      <div className="flex flex-col">
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
                <HomePage onLogout={() => setHasToken(false)} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        
          <Route
            path="/profile"
            element={hasToken ? <ProfilePage /> : <Navigate to="/login" replace /> }
          />
          <Route
            path="/matches"
            element={hasToken ? <MatchesPage /> : <Navigate to="/login" replace /> }
          />
          <Route
            path="/leaderboard"
            element={hasToken ? <LeaderboardPage /> : <Navigate to="/login" replace /> }
          />
          <Route
            path="/game"
            element={hasToken ? <GamePage /> : <Navigate to="/login" replace /> } />
        
          {/* First Time Setup Route */}
          <Route
            path="/first-setup"
            element={<FirstSetupPage onSetupComplete={() => setIsFirstTime(false)} /> }
          />
          <Route
            path="/create-user"
            element={
              hasToken ? (
                userRole === "ADMIN" ? <UserCreationPage /> : <Navigate to="/" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              hasToken ? (
                userRole === "ADMIN" ? (
                  <AdminDashboardPage onLogout={() => setHasToken(false)} />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/users"
            element={
              hasToken ? (
                userRole === "ADMIN" ? <UserListPage /> : <Navigate to="/" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
         
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
            
          <Route path="/public-test" element={<PublicApiTestPage />} />
            
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}
