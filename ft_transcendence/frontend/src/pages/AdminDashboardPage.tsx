import { Link } from "react-router-dom";

const adminButtonStyle: React.CSSProperties = {
  width: "28%",
  padding: "20px",
  fontSize: "18px",
  borderRadius: 30,
};

export default function AdminDashboardPage() {
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
      </nav>
    </div>
  );
}

