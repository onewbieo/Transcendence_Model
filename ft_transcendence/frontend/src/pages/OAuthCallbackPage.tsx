import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../lib/auth";

export default function OAuthCallbackPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const nav = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) {
      setToken(token);
      onLoggedIn();
      nav("/", { replace: true });
    }
    else {
      nav("/login", { replace: true });
    }
  }, [nav, onLoggedIn]);

  return <div style={{ padding: 24 }}>Completing login...</div>;
}
