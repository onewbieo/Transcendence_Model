import { getToken } from "./auth";

export function makeWsUrl(path: string) {
  const base = import.meta.env.VITE_WS_BASE ?? "/ws"; // "/ws"
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const token = getToken();

  // example -> ws://localhost:5173/ws/game?token=...
  const url = new URL(`${proto}://${window.location.host}${base}${path}`);

  if (token) url.searchParams.set("token", token);
  return url.toString();
}
