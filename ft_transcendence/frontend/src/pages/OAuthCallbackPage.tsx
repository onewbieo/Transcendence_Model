import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../lib/auth";

export default function OAuthCallbackPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const nav = useNavigate();

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    
    const token = qs.get("token");
    const tempToken = qs.get("tempToken");
    const requires2fa = qs.get("requires2fa");
    
    if (token) {
      setToken(token);
      onLoggedIn();
      nav("/", { replace: true });
      return;
    }
    
    if (tempToken && requires2fa === "1") {
      // store tempToken for 2FA verify page
      localStorage.setItem("tempToken", tempToken);
      nav("/login", { replace: true });
      return;
    }
    
    nav("/login", { replace: true });
  }, [nav, onLoggedIn]);

  return <div className="p-6 text-center text-xs sm:text-sm md:text-base lg:text-lg">Completing login...</div>;
}
