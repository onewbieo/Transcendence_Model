import { useState } from "react";
import { publicItemsApiKeyTest } from "../api";

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
    <div style={{ maxWidth: 900, margin: "48px auto", padding: 24 }}>
      <h1>Public API test</h1>
      
      <div style={{ display: "flex", gap:10, flexWrap: "wrap" }}>
        <button onClick={runList} style={{ padding: 10 }}>
          GET /public/items
        </button>
      
        <button onClick={runCreate} style={{ padding: 10 }}>
          POST /public/items
        </button>
      
        <button onClick={runGetOne} style={{ padding: 10 }} disabled={lastId === null}>
          GET /public/items/:id
        </button>
      
        <button onClick={runUpdate} style={{ padding: 10 }} disabled={lastId === null}>
          PUT /public/items/:id
        </button>
      
        <button onClick={runDelete} style={{ padding: 10 }} disabled={lastId === null}>
          DELETE /public/items/:id
        </button>
        
        <input
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          placeholder="id to delete"
          style={{ padding: 10, width: 140 }}
        />
        
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
          style={{ padding: 10 }}
        >
          DELETE by id
        </button>
      </div>
    
      <div style={{ marginTop: 12, opacity: 0.85 }}>
        Last created id: <b>{lastId ?? "-"}</b>
        {!API_KEY ? (
          <span style={{ marginLeft: 10, color: "#ffb" }}>
            (VITE_PUBLIC_API_KEY is missing)
          </span>
        ) : null}
      </div>
      
      <pre
        style={{
          marginTop: 16,
          background: "#111",
          color: "#eee",
          padding: 12,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {out}
      </pre>
    </div>
  );
}

