import { api } from "./client";

export type LoginResponse = {
  token: string;
  user: { id: number; email: string; name: string | null; createdAt: string };
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  return api<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function me(): Promise<{
  me: { id: number; email: string; name: string | null; role: string; createdAt: string };
}> {
  return api("/users/me");
}

export async function updateMe(input: { name?: string }): Promise<{
  me: { id: number; email: string; name: string | null; role: string; createdAt: string };
}> {
  return api("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
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
