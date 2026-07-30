import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

function Users() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [sort, setSort] = useState("asc");

  const limit = 10;

  const loadUsers = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/api/users?search=${search}&page=${page}&limit=${limit}&sort=${sort}`,
      );

      setUsers(res.data.users);

      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  const handleRoleUpdate = async (id, role) => {
    try {
      const nextRole =
        role === "customer"
          ? "admin"
          : role === "admin"
            ? "super-admin"
            : "customer";

      const res = await axios.patch(
        `http://localhost:5000/api/users/${id}/role`,
        {
          role: nextRole,
        },
      );

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Role Updated Successfully",
          timer: 1500,
          showConfirmButton: false,
        });

        loadUsers();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: error.message,
      });
    }
  };
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete User?",
      text: "You won't be able to recover it.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(`http://localhost:5000/api/users/${id}`);

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "User Deleted",
          timer: 1500,
          showConfirmButton: false,
        });

        loadUsers();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: error.message,
      });
    }
  };
  useEffect(() => {
    loadUsers();
  }, [search, page, sort]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <h2 className="text-3xl font-bold text-blue-600">Loading Users...</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-700">User Management</h1>

        <p className="text-gray-500 mt-2">Manage all registered users</p>
      </div>

      {/* Search & Sort */}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border rounded-lg px-4 py-3"
        >
          <option value="asc">A-Z</option>
          <option value="desc">Z-A</option>
        </select>
      </div>

      {/* Table */}

      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <table className="min-w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left">#</th>

              <th className="px-4 py-3 text-left">Name</th>

              <th className="px-4 py-3 text-left">Email</th>

              <th className="px-4 py-3 text-left">Role</th>

              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{(page - 1) * limit + index + 1}</td>

                <td className="px-4 py-3">{user.name || "N/A"}</td>

                <td className="px-4 py-3">{user.email}</td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      user.role === "super-admin"
                        ? "bg-purple-100 text-purple-700"
                        : user.role === "admin"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={user.role === "super-admin"}
                      onClick={() => handleRoleUpdate(user._id, user.role)}
                      className={`rounded-lg px-4 py-2 text-white transition
      ${
        user.role === "super-admin"
          ? "cursor-not-allowed bg-gray-400"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
                    >
                      {user.role === "customer"
                        ? "Make Admin"
                        : user.role === "admin"
                          ? "Make Super Admin"
                          : "Protected"}
                    </button>

                    <button
                      disabled={user.role === "super-admin"}
                      onClick={() => handleDelete(user._id)}
                      className={`rounded-lg px-4 py-2 text-white transition
      ${
        user.role === "super-admin"
          ? "cursor-not-allowed bg-gray-400"
          : "bg-red-600 hover:bg-red-700"
      }`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}

      <div className="mt-8 flex justify-center gap-3">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="rounded bg-gray-300 px-5 py-2 disabled:opacity-50"
        >
          Previous
        </button>

        <span className="rounded bg-blue-600 px-5 py-2 text-white">{page}</span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="rounded bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Users;
