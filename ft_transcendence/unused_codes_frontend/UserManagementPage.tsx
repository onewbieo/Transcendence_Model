import { useState } from "react";
import { api } from "../api";  // import API functions
import { useNavigate } from "react-router-dom";  // useNavigate for redirection

export default function UserManagementPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("USER"); // Default to "USER"
  const [status, setStatus] = useState("");
  const [users, setUsers] = useState<any[]>([]); // To hold the list of users
  const navigate = useNavigate();

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Creating user...");

    const userData = {
      email,
      password,
      name,
      role
    };

    try {
      await api("/admin/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      setStatus("User created successfully!");
      navigate("/admin/users"); // Redirect to user list after creation
      loadUsers();  // Reload users after creating a new one
    }
    catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  // Load the list of users
  async function loadUsers() {
    try {
      const userList = await api("/admin/users");
      setUsers(userList);
    } catch (err: any) {
      console.error("Error loading users:", err);
    }
  }

  // Call this function when component mounts
  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 24 }}>
      <h1>Create New User</h1>
      <form onSubmit={handleCreateUser} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            required
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ padding: 10 }}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>

        <button type="submit" style={{ padding: 10 }}>
          Create User
        </button>
      </form>

      <p>{status}</p>

      {/* User List */}
      <h2>User List</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} ({user.email}) - {user.role}
            <button onClick={() => handleEditUser(user.id)}>Edit</button>
            <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
