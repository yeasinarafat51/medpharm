import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FaHome,
  FaCapsules,
  FaUsers,
  FaShoppingCart,
  FaClipboardList,
  FaArrowLeft,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChartBar,
} from "react-icons/fa";

import Swal from "sweetalert2";
import useAuth from "../../hooks/useAuth";

function Dashboard() {
  const { user, logoutUser } = useAuth();

  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const menuClass = ({ isActive }) =>
    `flex items-center gap-3 px-6 py-4 transition-all duration-200 ${
      isActive ? "bg-white text-blue-700 font-semibold" : "hover:bg-blue-800"
    }`;

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-40
          h-screen w-72
          bg-gradient-to-b
          from-blue-700
          to-blue-900
          text-white
          shadow-xl
          transform
          transition-transform
          duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Sidebar Header */}

        <div className="border-b border-blue-500 py-8 text-center relative">
          <h1 className="text-3xl font-bold">💊 MedPharm</h1>

          <p className="mt-2 text-blue-200">Pharmacy Management</p>

          {/* Mobile Close */}

          <button
            className="absolute right-5 top-5 text-2xl lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        {/* Sidebar Menu */}

        <nav className="mt-6 flex flex-col">
          <NavLink
            to="/dashboard"
            end
            className={menuClass}
            onClick={() => setSidebarOpen(false)}
          >
            <FaHome />
            Dashboard
          </NavLink>

          <NavLink
            to="/dashboard/add-medicine"
            className={menuClass}
            onClick={() => setSidebarOpen(false)}
          >
            <FaCapsules />
            Add Medicine
          </NavLink>

          <NavLink
            to="/dashboard/all-medicine"
            className={menuClass}
            onClick={() => setSidebarOpen(false)}
          >
            <FaClipboardList />
            All Medicine
          </NavLink>

          <NavLink
            to="/dashboard/all-orders"
            className={menuClass}
            onClick={() => setSidebarOpen(false)}
          >
            <FaShoppingCart />
            All Orders
          </NavLink>

          <NavLink
            to="/dashboard/users"
            className={menuClass}
            onClick={() => setSidebarOpen(false)}
          >
            <FaUsers />
            Users
          </NavLink>

          <NavLink
            to="/dashboard/sales-report"
            className={menuClass}
            onClick={() => setSidebarOpen(false)}
          >
            <FaChartBar />
            Sales Report
          </NavLink>

          <NavLink
            to="/"
            className="mt-6 flex items-center gap-3 px-6 py-4 hover:bg-red-600 transition"
            onClick={() => setSidebarOpen(false)}
          >
            <FaArrowLeft />
            Back Home
          </NavLink>
        </nav>
      </aside>{" "}
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}

        <header className="bg-white shadow-md px-4 md:px-8 py-4 flex items-center justify-between">
          {/* Left */}

          <div className="flex items-center gap-4">
            {/* Mobile Menu */}

            <button
              onClick={() => setSidebarOpen(true)}
              className="text-2xl text-blue-700 lg:hidden"
            >
              <FaBars />
            </button>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-blue-700">
                Dashboard
              </h2>

              <p className="text-sm text-gray-500">
                Welcome,
                <span className="font-semibold text-blue-700">
                  {" "}
                  {user?.displayName || "Admin"}
                </span>
              </p>
            </div>
          </div>

          {/* Right */}

          <div className="flex items-center gap-3">
            <img
              src={user?.photoURL || "https://i.ibb.co/4pDNDk1/avatar.png"}
              alt="User"
              className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-blue-600 object-cover"
            />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 md:px-5 py-2 text-white transition hover:bg-red-700"
            >
              <FaSignOutAlt />

              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
