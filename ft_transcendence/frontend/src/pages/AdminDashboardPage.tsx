import { Link } from "react-router-dom";

export default function AdminDashboardPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <nav style={{ display: "grid", gap: 12 }}>
        <Link to="/create-user">
          <button>Create New User</button>
        </Link>
        <Link to="/admin/users">
          <button>View All Users</button>
        </Link>
        {/* Add more admin actions here */}
      </nav>
    </div>
  );
}

