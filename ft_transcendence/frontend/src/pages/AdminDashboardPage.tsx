import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../lib/auth";

const adminButtonStyle: React.CSSProperties = {
  width: "28%",
  padding: "20px",
  fontSize: "18px",
  borderRadius: 30,
};

export default function AdminDashboardPage({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  
  function handleLogout() {
    clearToken();
    onLogout();
    navigate("/login", { replace: true });
  }
  
  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <nav style={{ display: "grid", gap: 12 }}>
        <Link to="/create-user" style={{ textDecoration: "none" }}>
          <button style={adminButtonStyle}>Create New User</button>
        </Link>
        <Link to="/admin/users" style={{ textDecoration: "none" }}>
          <button style={adminButtonStyle}>View All Users</button>
        </Link>
          <button style={adminButtonStyle} onClick={handleLogout}>
            Logout (Go to Login)
          </button>
      </nav>
    </div>
  );
}

