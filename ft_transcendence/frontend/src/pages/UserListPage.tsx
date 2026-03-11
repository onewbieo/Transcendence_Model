import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function UserListPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  
  const navigate = useNavigate();

  async function fetchUsers() {
    setStatus("Loading users...");
    try {
      const data = await api("/admin/users");
      setUsers(data);
      setStatus("");
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  async function deleteUser(id: number) {
    try {
      await api(`/admin/users/${id}`, { method: "DELETE" });
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "48px auto", padding: 24 }}>
      <h1>User List</h1>
      <button
        onClick={() => navigate("/admin")}
        style={{
          marginBottom: 16,
          fontSize: "16px",
          padding: 12,
        }}
      >
        Back to Admin Dashboard
      </button>
      {status && <p>{status}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.name}</td>
              <td>{user.role}</td>
              <td>{new Date(user.createdAt).toLocaleString()}</td>
              <td>
                <button onClick={() => deleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

