import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { leaderboard, type LeaderboardRow } from "../api";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [status, setStatus] = useState("loading...");
  
  const navigate = useNavigate();

  useEffect(() => {
    leaderboard()
      .then((data) => {
        setRows(data ?? []);
        setStatus("ok ✅");
      })
      .catch((e: any) => setStatus(`failed ❌ ${e?.message ?? ""}`));
  }, []);

  return (
  <div className="px-4 py-2 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="px-2 py-1">
      <h1 className="mt-2 px-2 py-1 block w-fit mx-auto border-3 text-center rounded-md font-extrabold hover:bg-zinc-400 text-xs sm:text-sm md:text-base lg:text-lg">Leaderboard</h1>

      <div className="mt-4 px-2 py-1 w-fit border-3 border-blue-700 rounded-xl font-bold text-blue-700 hover:bg-blue-300 text-xs sm:text-sm md:text-base lg:text-lg">
        <button
          onClick={() => navigate("/")}
        >
          Back to Home
        </button> {/* Use navigate() for routing */}
      </div>

      <p className="flex gap-2 mt-2">
        <span className="font-bold text-sky-400 text-xs sm:text-sm md:text-base lg:text-lg">Status:</span>
        <span className="font-bold text-red-400 text-xs sm:text-sm md:text-base lg:text-lg">{status}</span>
      </p>

      {rows.length === 0 ? (
        <p className="font-bold text-xs sm:text-sm md:text-base lg:text-lg text-center">
          No leaderboard yet.
        </p>
      ) : (
        <div className="mt-2 pb-5 overflow-x-auto">
        <table className="w-full min-w-[560px] mt-2 border-3 border-yellow-400 text-left">
          <thead>
            <tr>
              <th className="px-1 text-xs sm:text-sm md:text-base lg:text-lg text-red-600">#</th>
              <th className="px-2 text-xs sm:text-sm md:text-base lg:text-lg text-cyan-500">Name</th>
              <th className="px-1 text-xs sm:text-sm md:text-base lg:text-lg text-pink-400">Email</th>
              <th className="px-1 pr-2 text-xs sm:text-sm md:text-base lg:text-lg text-indigo-400">Wins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.user.id} className="border-1 border-stone-400">
                <td className="px-1 text-xs sm:text-sm md:text-base lg:text-lg text-red-600">{idx + 1}</td>
                <td className="px-2 text-xs sm:text-sm md:text-base lg:text-lg">
                  <span className="block max-w-[300px] truncate whitespace-nowrap text-cyan-500">
                    {r.user.name ?? "(no name)"}
                  </span>
                </td>
                <td className="px-1 text-xs sm:text-sm md:text-base lg:text-lg">
                  <span className="block max-w-[300px] truncate whitespace-nowrap text-pink-400">
                    {r.user.email}
                  </span>
                </td>
                <td className="px-1 text-xs sm:text-sm md:text-base lg:text-lg text-indigo-400">{r.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  </div>
  );
}
