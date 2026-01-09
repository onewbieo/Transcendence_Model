import { getToken } from "../lib/auth";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token)
    headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`/api${path}`, { ...options, headers });

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

  return data as T;
}
