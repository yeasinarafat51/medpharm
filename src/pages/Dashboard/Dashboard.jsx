import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCapsules,
  FaUsers,
  FaShoppingCart,
  FaClipboardList,
  FaArrowLeft,
  FaSignOutAlt,
} from "react-icons/fa";
import Swal from "sweetalert2";
import useAuth from "../../hooks/useAuth";

function Dashboard() {
  const { user, logoutUser } = useAuth();

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();

      Swal.fire({
        icon: "success",
        title: "Logout Successful",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/login");
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Logout Failed",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}

      <aside className="w-72 bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-xl">
        <div className="py-8 border-b border-blue-500 text-center">
          <h1 className="text-3xl font-bold">💊 MedPharm</h1>

          <p className="text-sm text-blue-200 mt-2">Pharmacy Management</p>
        </div>

        <nav className="mt-8 flex flex-col">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all
              ${
                isActive
                  ? "bg-white text-blue-700 font-semibold"
                  : "hover:bg-blue-800"
              }`
            }
          >
            <FaHome />
            Dashboard
          </NavLink>

          <NavLink
            to="/dashboard/add-medicine"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all
              ${
                isActive
                  ? "bg-white text-blue-700 font-semibold"
                  : "hover:bg-blue-800"
              }`
            }
          >
            <FaCapsules />
            Add Medicine
          </NavLink>

          <NavLink
            to="/dashboard/all-medicine"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all
              ${
                isActive
                  ? "bg-white text-blue-700 font-semibold"
                  : "hover:bg-blue-800"
              }`
            }
          >
            <FaClipboardList />
            All Medicine
          </NavLink>

          <NavLink
            to="/dashboard/all-item-medicine"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all
              ${
                isActive
                  ? "bg-white text-blue-700 font-semibold"
                  : "hover:bg-blue-800"
              }`
            }
          >
            <FaShoppingCart />
            All Item Medicine
          </NavLink>

          <NavLink
            to="/dashboard/all-orders"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all
              ${
                isActive
                  ? "bg-white text-blue-700 font-semibold"
                  : "hover:bg-blue-800"
              }`
            }
          >
            <FaShoppingCart />
            All Orders
          </NavLink>

          <NavLink
            to="/dashboard/my-orders"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all
              ${
                isActive
                  ? "bg-white text-blue-700 font-semibold"
                  : "hover:bg-blue-800"
              }`
            }
          >
            <FaClipboardList />
            My Orders
          </NavLink>

          <NavLink
            to="/dashboard/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all
              ${
                isActive
                  ? "bg-white text-blue-700 font-semibold"
                  : "hover:bg-blue-800"
              }`
            }
          >
            <FaUsers />
            Users
          </NavLink>
          <NavLink
            to="/dashboard/sales-report"
            className={({ isActive }) =>
              `px-6 py-3 hover:bg-blue-800 ${isActive ? "bg-blue-900" : ""}`
            }
          >
            Sales Report
          </NavLink>
          <NavLink
            to="/"
            className="flex items-center gap-3 px-6 py-4 hover:bg-red-600 mt-6"
          >
            <FaArrowLeft />
            Back Home
          </NavLink>
        </nav>
      </aside>

      {/* Main */}

      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}

        <header className="bg-white shadow-md px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-blue-700">Dashboard</h2>

            <p className="text-gray-500">
              Welcome back,
              <span className="font-semibold text-blue-700">
                {" "}
                {user?.displayName || "Admin"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={user?.photoURL || "https://i.ibb.co/4pDNDk1/avatar.png"}
              alt=""
              className="w-12 h-12 rounded-full border"
            />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </header>

        {/* Page */}

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
