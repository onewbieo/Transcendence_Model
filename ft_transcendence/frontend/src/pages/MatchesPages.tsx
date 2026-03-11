import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { matches, type MatchRow } from "../api";

const PAGE_SIZE = 20;

export default function MatchesPage() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [status, setStatus] = useState("loading...");
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function loadFirst() {
    setLoading(true);
    setStatus("loading...");
    try {
      const res = await matches({ take: PAGE_SIZE });
      console.log("FIRST RES:", res);

      setRows(res.items ?? []);
      setNextCursor(res.nextCursor ?? null);
      setStatus("ok ✅");
    }
    catch (e: any) {
      setStatus(`failed ❌ ${e?.message ?? ""}`);
    }
    finally {
      setLoading(false);
    }
  }

  async function loadNext() {
    if (nextCursor === null || loading)
      return;

    setLoading(true);
    try {
      const res = await matches({ take: PAGE_SIZE, cursor: nextCursor });
      console.log("NEXT RES:", res);

      setRows(res.items ?? []);
      setNextCursor(res.nextCursor ?? null);
    }
    catch (e: any) {
      setStatus(`failed ❌ ${e?.message ?? ""}`);
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFirst();
  }, []);

  return (
  <div className="px-4 py-2 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="px-2 py-1">
      <h1 className="text-center font-extrabold w-fit border mx-auto px-2 py-1 hover:bg-red-400 text-xs sm:text-sm md:text-base lg:text-lg">Match History</h1>

      <button
        onClick={() => navigate("/")}
        className="mt-2 border-4 px-2 py-1 font-bold hover:bg-pink-400 text-xs sm:text-sm md:text-base lg:text-lg"
      >
        Back to Home</button>

      <p className="flex gap-2 mt-2 ">
        <span className="text-sky-400 text-xs sm:text-sm md:text-base lg:text-lg">Status:</span>
        <span className="text-red-400 font-bold text-xs sm:text-sm md:text-base lg:text-lg">{status}</span>
      </p>

      {rows.length === 0 ? (
        <p className="font-bold text-xs sm:text-sm md:text-base lg:text-lg">No matches yet.</p>
      ) : (
        <>
        <div className="mt-2 pb-5 overflow-x-auto">
          <table className="mt-2 border-4 w-full min-w-[760px] text-left">
            <thead>
              <tr>
                <th className="px-1 py-1 text-xs sm:text-sm md:text-base lg:text-lg">Id</th>
                <th className="px-1 py-1 text-xs sm:text-sm md:text-base lg:text-lg">Created</th>
                <th className="px-1 py-1 text-xs sm:text-sm md:text-base lg:text-lg">Status</th>
                <th className="px-1 py-1 text-xs sm:text-sm md:text-base lg:text-lg">Score</th>
                <th className="px-1 py-1 text-xs sm:text-sm md:text-base lg:text-lg">Winner</th>
                <th className="px-1 py-1 text-xs sm:text-sm md:text-base lg:text-lg">Duration</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border border-slate-300">
                  <td className="px-1 text-xs sm:text-sm md:text-base lg:text-lg whitespace-nowrap">{m.id}</td>
                  <td className="px-1 text-xs sm:text-sm md:text-base lg:text-lg whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-1 text-xs sm:text-sm md:text-base lg:text-lg whitespace-nowrap">{m.status}</td>
                  <td className="px-1 text-xs sm:text-sm md:text-base lg:text-lg whitespace-nowrap">{m.player1Score} - {m.player2Score}</td>
                  <td className="px-1 text-xs sm:text-sm md:text-base lg:text-lg whitespace-nowrap">{m.winnerId ?? "DRAW"}</td>
                  <td className="px-1 text-xs sm:text-sm md:text-base lg:text-lg whitespace-nowrap">{m.durationMs ? `${Math.round(m.durationMs / 1000)}s` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="mt-4 px-2 py-1 text-center w-fit mx-auto border-2 border-orange-400 font-bold hover:bg-orange-400 text-xs sm:text-sm md:text-base lg:text-lg">
            {nextCursor !== null ? (
              <button
                onClick={loadNext}
                disabled={loading}
              >
                {loading ? "Loading..." : "Next page"}
              </button>
            ) : (
              <div className="opacity-70 text-xs sm:text-sm md:text-base lg:text-lg">No more matches.</div>
            )}
          </div>
        </>
      )}
    </div>
  </div>
  );
}

