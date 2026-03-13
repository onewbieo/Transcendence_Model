import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../lib/auth";

export default function AdminDashboardPage({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  
  function handleLogout() {
    clearToken();
    onLogout();
    navigate("/login", { replace: true });
  }
  
  return (
  <div className="px-4 py-2 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="px-2 py-1 pt-5 pb-5 mx-auto border-4 border-yellow-400 sm:max-w-sm md:max-w-md lg:max-w-lg">
      <h1 className="mt-2 px-2 py-1 text-center font-extrabold w-fit border-4 mx-auto hover:bg-zinc-400 rounded-md">Admin Dashboard</h1>
      
      <nav className="grid gap-3">
        <Link to="/create-user" className="no-underline">
          <button className="mt-8 block mx-auto px-2 py-1 border-4 border-blue-700 font-bold text-center text-blue-700 hover:bg-blue-300 rounded-xl">
            Create New User
          </button>
        </Link>
        <Link to="/admin/users" className="no-underline">
          <button className="mt-2 block mx-auto px-2 py-1 border-4 border-emerald-700 font-bold text-center text-emerald-700 hover:bg-emerald-300 rounded-xl">
            View All Users
          </button>
        </Link>
          <button 
            className="mt-2 block mx-auto px-2 py-1 border-4 border-orange-500 font-bold text-center text-orange-500 hover:bg-orange-300 rounded-xl" 
            onClick={handleLogout}
          >
            Logout (Go to Login)
          </button>
      </nav>
    </div>
  </div>
  );
}
