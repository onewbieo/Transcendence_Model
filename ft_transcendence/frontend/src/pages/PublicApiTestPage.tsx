import { useState } from "react";
import { publicItemsApiKeyTest } from "../api";
import { useNavigate } from "react-router-dom";

const API_KEY = import.meta.env.VITE_PUBLIC_API_KEY ?? "";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "x-api-key": API_KEY,
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  }
  catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      (typeof data === "string" ? data : "") ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return data;
}

export default function PublicApiTestPage() {
  const [out, setOut] = useState<string>("");
  const [lastId, setLastId] = useState<number | null>(null);
  
  const [idInput, setIdInput] = useState<string>("");
  
  const navigate = useNavigate(); // Hook to navigate to different routes

  async function runList() {
    setOut("loading...");
    try {
      const data = await publicItemsApiKeyTest();
      setOut(JSON.stringify(data, null, 2));
    }
    catch (e: any) {
      setOut(`failed: ${e?.message ?? e}`);
    }
  }

  async function runCreate() {
    setOut("loading...");
    try {
      const data = await apiFetch("/public/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `test ${new Date().toISOString()}`,
          content: "created from frontend",
        }),
      });

      const id = data?.item?.id ?? null;
      if (typeof id === "number")
        setLastId(id);

      setOut(JSON.stringify(data, null, 2));
    }
    catch (e: any) {
      setOut(`failed: ${e?.message ?? e}`);
    }
  }

  async function runGetOne() {
    setOut("loading...");
    try {
      if (lastId === null)
        throw new Error("No lastId yet. Click POST first.");
      const data = await apiFetch(`/public/items/${lastId}`);
      setOut(JSON.stringify(data, null, 2));
    }
    catch (e: any) {
      setOut(`failed: ${e?.message ?? e}`);
    }
  }
  
  async function runUpdate() {
    setOut("loading...");
    try {
      if (lastId === null)
        throw new Error("No lastId yet. Click POST first.");
      const data = await apiFetch(`/public/items/${lastId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `updated ${new Date().toISOString()}`,
          content: "updated from frontend",
        }),
      });
      setOut(JSON.stringify(data, null, 2));
    }
    catch (e: any) {
      setOut(`failed: ${e?.message ?? e}`);
    }
  }
  
  async function runDelete() {
    setOut("loading...");
    try {
      if (lastId === null)
        throw new Error("No lastId yet. Click POST first.");
      await apiFetch(`/public/items/${lastId}`, { method: "DELETE" });
      setOut(`Deleted id=${lastId} (204 expected)`);
      setLastId(null);
    }
    catch (e: any) {
      setOut(`failed: ${e?.message ?? e}`);
    }
  }


  return (
  <div className="px-4 py-8 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="px-2 py-1 pt-5 pb-5 border-4 border-yellow-400 block w-full mx-auto sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
      <h1 className="block w-fit mx-auto px-2 py-1 border-4 hover:bg-zinc-400 rounded-md text-center font-extrabold text-xs sm:text-sm md:text-base lg:text-base">Public API test</h1>
      
      <div className="mt-8 flex flex-wrap gap-3 items-center justify-center">
        <button
          onClick={runList}
          className="px-2 py-1 border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-300 rounded-md text-xs sm:text-sm md:text-base lg:text-base"
        >
          GET /public/items
        </button>
      
        <button
          onClick={runCreate}
          className="px-2 py-1 border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-300 rounded-md text-xs sm:text-sm md:text-base lg:text-base"
        >
          POST /public/items
        </button>
      
        <button
          onClick={runGetOne}
          disabled={lastId === null}
          className="px-2 py-1 border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-300 rounded-md text-xs sm:text-sm md:text-base lg:text-base"
        >
          GET /public/items/:id
        </button>
      
        <button
          onClick={runUpdate}
          disabled={lastId === null}
          className="px-2 py-1 border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-300 rounded-md text-xs sm:text-sm md:text-base lg:text-base"
        >
          PUT /public/items/:id
        </button>
      
        <button
          onClick={runDelete}
          disabled={lastId === null}
          className="px-2 py-1 border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-300 rounded-md text-xs sm:text-sm md:text-base lg:text-base"
        >
          DELETE /public/items/:id
        </button>
        
        <button
          onClick={async () => {
            setOut("loading...");
            try {
              const id = Number(idInput);
              if (!Number.isFinite(id))
                throw new Error("Invalid id");
              await apiFetch(`/public/items/${id}`, { method: "DELETE" });
              
              setOut(`Deleted id=${id} (204 expected)`);
              
              // optional: if you deleted the last created one, clear it
              if (lastId === id) setLastId(null);
            }
            catch (e: any) {
              setOut(`failed: ${e?.message ?? e}`);
            }
          }}
          className="px-2 py-1 border-4 border-red-600 text-red-600 font-bold hover:bg-red-300 rounded-xl text-xs sm:text-sm md:text-base lg:text-base"
        >
          DELETE by id  
        </button>
        <input
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          placeholder="Id to delete"
          className="text-center border-3 border-red-600 text-red-600 font-bold hover:bg-red-300 w-24 rounded-md text-xs sm:text-sm md:text-base lg:text-base focus:ring-0 outline-none"
        />
      </div>
    
      <div className="mt-5 px-2 py-1 block w-fit mx-auto border-2 border-emerald-700 rounded-md text-emerald-700 font-bold hover:bg-emerald-400 text-xs sm:text-sm md:text-base lg:text-base">
        Last created id: <b>{lastId ?? "-"}</b>
        {!API_KEY ? (
          <span>
            (VITE_PUBLIC_API_KEY is missing)
          </span>
        ) : null}
      </div>
      
      <pre className="mt-2 font-bold text-center overflow-x-auto text-xs sm:text-sm md:text-base lg:text-base">
        {out}
      </pre>
       
    </div>
    <button
      onClick={() => navigate("/")}
      className="mt-5 w-1/2 border-3 px-2 py-1 block w-fit mx-auto text-xs sm:text-sm md:text-base lg:text-lg rounded-xl text-fuchsia-500 border-fuchsia-500 hover:bg-fuchsia-200 font-bold"
    >
      Back to Home
    </button> {/* Use navigate() for routing */}
  </div>
  );
}
