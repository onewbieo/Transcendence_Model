import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { me, notifications, type NotificationRow } from "../api";
import { clearToken } from "../lib/auth";

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
  const meUserPreview =
    meUser == null
      ? null
      : {
          ...meUser,
          name:
            meUser.name && meUser.name.length > 24
              ? `${meUser.name.slice(0, 24)}...`
              : meUser.name,
        };
  
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
  const goToGame = () => navigate("/game");
  
  return (
  <div className="px-4 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="w-full mx-auto border-4 border-orange-400 px-4 py-2 sm:max-w-sm md:max-w-md lg:max-w-lg">
      <h1 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">Ft_Transcendence</h1>
        <p className="flex gap-2">
          <span className="text-xs sm:text-sm md:text-base lg:text-lg text-blue-400 font-bold"> 
            Status:
          </span>
          <span className="text-xs sm:text-sm md:text-base lg:text-lg font-extrabold text-yellow-400">
            {status}
          </span>
        </p>

      <p className="text-xs sm:text-sm md:text-base lg:text-lg flex items-baseline gap-2 min-w-0">
        <span className="whitespace-nowrap text-purple-400 font-extrabold shrink-0">
          Logged in as:
        </span>
        <span 
          className="font-medium min-w-0 truncate"
        >
          {meUser?.name ?? "(no name yet)"}
        </span>
      </p>
      
      <div className="mt-2">
        <img
          src={meUser?.avatarUrl ?? "/default-avatar.png"}
          alt="avatar"
          width={96}
          height={96}
          className="rounded-xl border-4"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Use navigate for routing */}
        <button
          onClick={goToProfile}
          className="mt-2 px-2 py-2 rounded-md border-4 border-yellow-400 text-red-400 font-extrabold text-xs sm:text-sm md:text-base lg:text-lg hover:bg-blue-700"
        >
          Profile
        </button>
        <button
          onClick={goToMatches}
          className="mt-2 px-2 py-2 rounded-md border-4 border-yellow-400 text-red-400 font-extrabold text-xs sm:text-sm md:text-base lg:text-lg hover:bg-blue-700"
        >
          Matches
        </button>
        <button
          onClick={goToLeaderboard}
          className="mt-2 px-2 py-2 rounded-md border-4 border-yellow-400 text-red-400 font-extrabold text-xs sm:text-sm md:text-base lg:text-lg hover:bg-blue-700"
        >
          Leaderboard
        </button>
        <button
          onClick={goToGame}
          className="mt-2 px-2 py-2 rounded-md border-4 border-yellow-400 text-red-400 font-extrabold text-xs sm:text-sm md:text-base lg:text-lg hover:bg-blue-700"
        >
          Game
        </button>
        <button
          onClick={handleLogout}
          className="mt-2 px-2 py-2 rounded-md border-4 border-yellow-400 text-red-400 font-extrabold text-xs sm:text-sm md:text-base lg:text-lg hover:bg-blue-700"
        >
          Logout
        </button>
      </div>
      
      <section className="mt-5">
        <h2 className="w-fit px-2 py-1 font-bold text-xs sm:text-sm md:text-base lg:text-lg border-2 rounded-xl hover:bg-red-500">
          Notifications
        </h2>
        {notifs.length === 0 ? (
          <p className="mt-2 text-xs sm:text-sm md:text-base lg:text-lg font-bold">No notifications yet.</p>
        ) : (
          <ul className="mt-2 max-h-64 overflow-y-auto space-y-2 pr-5">
            {notifs.map((n) => (
              <li key={n.id} className="rounded-md border-2 px-3 py-2 hover:bg-red-400">
                <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-70">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 text-xs sm:text-sm md:text-base lg:text-lg break-words">
                  {n.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <h3 className="mt-2 px-2 py-1 w-fit border-4 border-pink-400 font-bold hover:bg-pink-400">Me</h3>
      <pre className="p-3 bg-black text-white overflow-x-auto whitespace-pre-wrap break-words">
        {JSON.stringify(meUserPreview, null, 2)}
      </pre>
    </div>
  </div>
  );
}
  
  
