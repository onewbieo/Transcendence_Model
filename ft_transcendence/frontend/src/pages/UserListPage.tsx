import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function UserListPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const isError = status.startsWith("Error:");
  
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
      setUsers(prevUsers => prevUsers.filter(u => u.id !== id));
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
  <div className="px-4 py-8 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="px-2 py-1 pb-5 pt-5 border-3 border-yellow-400 block w-full mx-auto sm:max-w-3xl md:max-w-5xl lg:max-w-7xl">
      <h1 className="px-2 py-1 block w-fit mx-auto border-4 rounded-md hover:bg-zinc-400 text-center font-extrabold text-xs sm:text-sm md:text-base lg:text-lg">User List</h1>
      <button
        onClick={() => navigate("/admin")}
        className="mt-6 px-2 py-1 border-4 border-blue-700 text-blue-700 rounded-xl hover:bg-blue-300 block w-fit mx-auto font-bold text-xs sm:text-sm md:text-base lg:text-lg"
      >
        Back to Admin Dashboard
      </button>
      {status && <p className="mt-2 text-center text-red-600 font-extrabold px-2 py-1 block w-fit mx-auto border-4 border-red-600 rounded-xl hover:bg-red-200">{status}</p>}
      {!isError && users.length > 0 && (
      <div className="mt-2 pb-5 overflow-x-auto">
      <table className="w-full min-w-[640px] mt-2 text-left">
        <thead>
          <tr>
            <th className="px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-red-500">Email</th>
            <th className="px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-cyan-500">Name</th>
            <th className="px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-emerald-600">Role</th>
            <th className="px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-pink-400">Created</th>
            <th className="px-3 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-indigo-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-1 border-slate-300">
              <td className="px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-red-400">
                <span className="block max-w-[240px] truncate whitespace-nowrap">
                  {user.email}
                </span>
              </td>
              <td className="px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-cyan-500">
                <span className="block max-w-[90px] truncate whitespace-nowrap">
                  {user.name}
                </span>
              </td>
              <td className="px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-emerald-600">
                {user.role}
              </td>
              <td className="px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-pink-400">
                {new Date(user.createdAt).toLocaleString()}
              </td>
              <td className="px-2 py-1 text-xs sm:text-sm md:text-base lg:text-lg">
                <button 
                  onClick={() => deleteUser(user.id)} 
                  className="px-2 py-1 border-2 rounded-md text-indigo-400 text-xs sm:text-sm md:text-base lg:text-lg hover:bg-indigo-200"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      )}
    </div>
  </div>
  );
}
