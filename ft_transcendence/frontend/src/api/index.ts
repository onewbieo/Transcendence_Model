import { api } from "./client";
import { getToken } from "../lib/auth";
export { api }

export type UserDTO = {
  id: number;
  email: string;
  name: string | null;
  createdAt?: string;
  role?: string;
  avatarUrl?: string | null;
  twoFactorEnabled?: boolean;
};

export type NotificationRow = {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
};

export async function notifications() {
  return api("/notifications");
}

export type LoginOkResponse = {
  token: string;
  user: UserDTO;
};

export type Login2FAResponse = {
  requires2fa: true;
  tempToken: string;
};

export type Verify2FAResponse = {
  token: string;
  user: UserDTO;
};

export type LoginResponse = LoginOkResponse | Login2FAResponse;

export async function verify2fa(tempToken: string, code: string): Promise<Verify2FAResponse> {
  return api<Verify2FAResponse>("/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ tempToken, code }),
  });
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return api<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function me(): Promise<{ me: UserDTO & { role: string; createdAt: string } }> {
  return api("/users/me");
}

export async function updateMe(input: { name?: string }): Promise<UserDTO & { role:string; createdAt: string }> {
  return api("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function uploadAvatar(file: File): Promise<{
  me: { id: number; email: string; name: string | null; role: string; createdAt: string; avatarUrl: string | null };
}> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/users/me/avatar", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
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

export async function changePassword(oldPassword: string, newPassword: string): Promise<{ ok: true }> {
  return api("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export type TwoFASetupResponse = {
  otpauthUrl: string;
  qrDataUrl: string;
};

export async function twoFaSetup(): Promise<TwoFASetupResponse> {
  return api("/auth/2fa/setup", { method: "POST" });
}

export async function twoFaEnable(code: string): Promise<{ ok: true }> {
  return api("/auth/2fa/enable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function twoFaDisable(code: string): Promise<{ ok: true }> {
  return api("/auth/2fa/disable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// Matches
export type MatchRow = {
  id: number;
  createdAt: string;
  status: "ONGOING" | "FINISHED" | "DRAW";
  player1Id: number;
  player2Id: number;
  player1Score: number;
  player2Score: number;
  winnerId: number | null;
  durationMs: number | null;
};

export async function matches(params?: { take?: number; cursor?: number | null }): Promise<{ items: MatchRow[]; nextCursor: number | null }> {
  const qs = new URLSearchParams();

  if (params?.take !== undefined)
    qs.set("take", String(params.take));
  if (params?.cursor !== undefined && params.cursor !== null)
    qs.set("cursor", String(params.cursor));

  const url = `/matches${qs.toString() ? `?${qs.toString()}` : ""}`;
  return api(url);
}

// Leaderboard
export type LeaderboardRow = {
  user: { id: number; email: string; name: string | null };
  wins: number;
};

export async function leaderboard(): Promise<LeaderboardRow[]> {
  return api("/leaderboard");
}

export async function publicItemsApiKeyTest() {
  const res = await fetch("/api/public/items", {
    headers: {
      "x-api-key": import.meta.env.VITE_PUBLIC_API_KEY ?? "",
    },
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  }
  catch { data = text; }

  if (!res.ok)
    throw new Error((data && (data.error || data.message)) || `${res.status} ${res.statusText}`);
  return data as { items: any[] };
}
