import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
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
  FaImages,
  FaTags,
  FaFileInvoice,
} from "react-icons/fa";
import Swal from "sweetalert2";
import useAuth from "../../hooks/useAuth";

const API_URL =
  import.meta.env.VITE_API_URL || "https://medpharm-server-sgs6.vercel.app";

function Dashboard() {
  const { user, logoutUser } = useAuth();

  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        if (!user?.email) {
          setRoleLoading(false);
          return;
        }

        const token = await user.getIdToken();

        const response = await axios.get(
          `${API_URL}/api/users/email/${encodeURIComponent(user.email)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data?.success) {
          setRole(response.data.user?.role || "customer");
        }
      } catch (error) {
        console.error("Role Load Error:", error);

        if (error.response?.status === 401) {
          Swal.fire({
            icon: "error",
            title: "Authentication Failed",
            text: "Please login again.",
          });

          navigate("/login");
        } else if (error.response?.status === 403) {
          Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "You do not have permission to access dashboard.",
          });

          navigate("/");
        }
      } finally {
        setRoleLoading(false);
      }
    };

    loadUserRole();
  }, [user, navigate]);

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
      isActive ? "bg-white text-blue-700 font-semibold" : "hover:bg-cyan-800"
    }`;

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>

          <h2 className="text-xl font-semibold text-blue-700">
            Loading Dashboard...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-40
          h-screen w-72
          bg-gradient-to-b from-amber-700 to-amber-900
          text-white shadow-xl
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0
        `}
      >
        <div className="relative border-b border-blue-500 py-8 text-center">
          <h1 className="text-3xl font-bold">
            💊 Nova
            <span className="text-3xl font-bold text-cyan-700">Care</span>
          </h1>

          <p className="mt-2 text-blue-200">Pharmacy Management</p>

          <div className="mt-3">
            <span
              className={`rounded-full px-4 py-1 text-sm font-semibold ${
                role === "super-admin"
                  ? "bg-red-500 text-white"
                  : "bg-blue-500 text-white"
              }`}
            >
              {role === "super-admin" ? "Super Admin" : "Admin"}
            </span>
          </div>

          <button
            className="absolute right-5 top-5 text-2xl lg:hidden"
            onClick={closeSidebar}
          >
            <FaTimes />
          </button>
        </div>

        <nav className="mt-6 flex flex-col">
          {role === "super-admin" && (
            <NavLink
              to="/dashboard"
              end
              className={menuClass}
              onClick={closeSidebar}
            >
              <FaHome />
              Dashboard
            </NavLink>
          )}

          <NavLink
            to="/dashboard/add-medicine"
            className={menuClass}
            onClick={closeSidebar}
          >
            <FaCapsules />
            Add Medicine
          </NavLink>

          {role === "super-admin" && (
            <>
              <NavLink
                to="/dashboard/special-offers"
                className={menuClass}
                onClick={closeSidebar}
              >
                <FaTags />
                Special Offers
              </NavLink>

              <NavLink
                to="/dashboard/sliders"
                className={menuClass}
                onClick={closeSidebar}
              >
                <FaImages />
                Slider Management
              </NavLink>
            </>
          )}

          <NavLink
            to="/dashboard/all-medicine"
            className={menuClass}
            onClick={closeSidebar}
          >
            <FaClipboardList />
            All Medicine
          </NavLink>

          <NavLink
            to="/dashboard/all-orders"
            className={menuClass}
            onClick={closeSidebar}
          >
            <FaShoppingCart />
            All Orders
          </NavLink>

          {role === "super-admin" && (
            <>
              <NavLink
                to="/dashboard/users"
                className={menuClass}
                onClick={closeSidebar}
              >
                <FaUsers />
                Users
              </NavLink>

              <NavLink
                to="/dashboard/my-invoices"
                className={menuClass}
                onClick={closeSidebar}
              >
                <FaFileInvoice />
                My Invoices
              </NavLink>

              <NavLink
                to="/dashboard/sales-report"
                className={menuClass}
                onClick={closeSidebar}
              >
                <FaChartBar />
                Sales Report
              </NavLink>
            </>
          )}

          <NavLink
            to="/"
            className="mt-6 flex items-center gap-3 px-6 py-4 transition hover:bg-red-600"
            onClick={closeSidebar}
          >
            <FaArrowLeft />
            Back Home
          </NavLink>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-white px-4 py-4 shadow-md md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-2xl text-blue-700 lg:hidden"
            >
              <FaBars />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-blue-700 md:text-3xl">
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

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-700">
                {user?.displayName || "Admin"}
              </p>

              <p className="text-xs capitalize text-gray-500">
                {role === "super-admin" ? "Super Admin" : "Admin"}
              </p>
            </div>

            <img
              src={user?.photoURL || "https://i.ibb.co/4pDNDk1/avatar.png"}
              alt="User"
              className="h-10 w-10 rounded-full border-2 border-blue-600 object-cover md:h-12 md:w-12"
            />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white transition hover:bg-red-700 md:px-5"
            >
              <FaSignOutAlt />

              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
