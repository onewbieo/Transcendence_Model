import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../lib/auth";

export default function AdminDashboardPage({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  
  const adminBtnClass =
    "mt-5 block mx-auto px-2 py-1 border-4 font-bold text-center hover:bg-blue-300";
  
  function handleLogout() {
    clearToken();
    onLogout();
    navigate("/login", { replace: true });
  }
  
  return (
  <div className="px-4 py-2 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="px-2 py-1 pt-5 pb-5 max-w-[280px] mx-auto border-4 border-slate-200">
      <h1 className="mt-2 px-2 py-1 text-center font-extrabold w-fit border-2 mx-auto hover:bg-blue-400">Admin Dashboard</h1>
      
      <nav className="grid gap-3">
        <Link to="/create-user" className="no-underline">
          <button className={adminBtnClass}>Create New User</button>
        </Link>
        <Link to="/admin/users" className="no-underline">
          <button className={adminBtnClass}>View All Users</button>
        </Link>
          <button className={adminBtnClass} onClick={handleLogout}>
            Logout (Go to Login)
          </button>
      </nav>
    </div>
  </div>
  );
}
