import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { getToken } from "./lib/auth";

export default function App() {
  const [hasToken, setHasToken] = useState<boolean>(() => !!getToken());

  useEffect(() => {
    const onStorage = () => setHasToken(!!getToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!hasToken) return <LoginPage onLoggedIn={() => setHasToken(true)} />;

  return <HomePage onLogout={() => setHasToken(false)} />;
}
