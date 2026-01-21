import TournamentsPage from "./TournamentsPage";

const goToTournaments = () => navigate("/tournaments");
<button onClick={goToTournaments}>Tournaments</button>

<Route path="/tournaments" element={<TournamentsPage />} />

import TournamentsPage from "./pages/TournamentsPage";


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




<Route path="/admin/users/create" element={<UserManagementPage />} />

import UserManagementPage from "./pages/UserManagementPage";




{/* First Time Setup Route */}
        <Route
          path="/first-setup"
          element={isFirstTime ? <FirstSetupPage /> : <Navigate to="/login" />}
        />
