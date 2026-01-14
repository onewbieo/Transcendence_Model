import { api } from "./client";
import { getToken } from "../lib/auth";

export type UserDTO = {
  id: number;
  email: string;
  name: string | null;
  createdAt?: string;
  role?: string;
  avatarUrl?: string | null;
};

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

export async function matches(): Promise<{ items: MatchRow[]; nextCursor: number | null }> {
  return api("/matches");
}


// Leaderboard
export type LeaderboardRow = {
  user: { id: number; email: string; name: string | null };
  wins: number;
};

export async function leaderboard(): Promise<LeaderboardRow[]> {
  return api("/leaderboard");
}

export type Tournament = {
  id: number;
  name: string;
  status: string; // "OPEN" etc
  createdAt: string;
};

export type TournamentBracket = Tournament & {
  participants: Array<{ user: { id: number; name: string | null; email?: string } }>;
  matches: any[]; // keep loose for now; we can type later
};

export async function createTournament(name: string): Promise<Tournament> {
  return api("/tournaments", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getTournament(id: number): Promise<Tournament> {
  return api(`/tournaments/${id}`);
}

export async function joinTournament(id: number): Promise<{ ok: true }> {
  return api(`/tournaments/${id}/join`, {
    method: "POST" 
  });
}

export async function tournamentBracket(id: number): Promise<TournamentBracket> {
  return api(`/tournaments/${id}/bracket`);
}

export async function startTournament(id: number): Promise<{ message: string }> {
  return api(`/tournaments/${id}/start`, {
    method: "POST",
    body: JSON.stringify({})
  });
}
