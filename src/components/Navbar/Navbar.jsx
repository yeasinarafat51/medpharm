import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaBars,
  FaTimes,
  FaShoppingCart,
  FaHome,
  FaPills,
  FaClipboardList,
  FaUserCircle,
  FaDownload,
  FaSignOutAlt,
  FaTachometerAlt,
  FaSignInAlt,
  FaUserPlus,
  FaAndroid,
} from "react-icons/fa";

import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";

import logo from "../../imges/novacare.jpg";

const APK_DOWNLOAD_URL =
  "https://web2apkpro.com/public_download.php?project_id=20811&token=6e0ada7cc4";

function Navbar() {
  const { user, logoutUser } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // ==========================================
  // GET USER ROLE
  // ==========================================
  useEffect(() => {
    const getRole = async () => {
      if (!user?.email) {
        setRole("");
        return;
      }

      try {
        const res = await axios.get(
          `https://medpharm-server-3.onrender.com/api/users/email/${user.email}`,
        );

        if (res.data.success) {
          setRole(res.data.user.role);
        }
      } catch (error) {
        console.log("Role Load Error:", error);
      }
    };

    getRole();
  }, [user]);

  // ==========================================
  // LOGOUT
  // ==========================================
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
      console.log("Logout Error:", error);
    }
  };

  // ==========================================
  // DESKTOP NAV LINK STYLE
  // ==========================================
  const navLinkClass = ({ isActive }) =>
    isActive
      ? "rounded-xl bg-emerald-50 px-3.5 py-2 text-sm font-bold text-emerald-700 transition"
      : "rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-600 transition";

  // ==========================================
  // MOBILE BOTTOM TAB STYLE
  // ==========================================
  const bottomTabClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold transition ${
      isActive
        ? "text-emerald-600 scale-105"
        : "text-slate-500 hover:text-slate-800"
    }`;

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      {/* =====================================================
          STICKY PREMIUM APP HEADER (TOP BAR)
      ===================================================== */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 md:px-6 md:py-3.5">
          {/* MOBILE LEFT: DRAWER BUTTON */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-700 active:scale-95 transition"
              aria-label="Menu"
            >
              {menuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* BRAND LOGO */}
          <NavLink
            to="/"
            className="flex items-center gap-2 md:flex-1"
            onClick={closeMenu}
          >
            <img
              src={logo}
              alt="NovaCare"
              className="h-10 w-36 rounded-lg object-cover md:h-14 md:w-56"
            />
          </NavLink>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>

            <NavLink to="/allproduct" className={navLinkClass}>
              Medicines
            </NavLink>

            {user && (
              <NavLink to="/my-orders" className={navLinkClass}>
                My Orders
              </NavLink>
            )}

            {(role === "admin" || role === "super-admin") && (
              <NavLink to="/dashboard/all-orders" className={navLinkClass}>
                Dashboard
              </NavLink>
            )}

            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <FaDownload className="text-xs" />
              <span>Download App</span>
            </a>

            {user && (
              <NavLink
                to="/cart"
                className="relative mx-1 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition"
              >
                <FaShoppingCart size={19} />
                {cart.length > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-extrabold text-white shadow-xs">
                    {cart.length}
                  </span>
                )}
              </NavLink>
            )}

            {!user ? (
              <div className="flex items-center gap-2 pl-2">
                <NavLink
                  to="/login"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Register
                </NavLink>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-2">
                <span className="max-w-[150px] truncate text-sm font-bold text-slate-700">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>

          {/* MOBILE RIGHT: APP INSTALL + CART */}
          <div className="flex items-center gap-2 md:hidden">
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 items-center gap-1 rounded-xl bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white shadow-xs active:scale-95"
            >
              <FaAndroid className="text-sm" />
              <span>App</span>
            </a>

            <NavLink
              to={user ? "/cart" : "/login"}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-95"
              aria-label="Cart"
            >
              <FaShoppingCart size={19} />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white">
                  {cart.length}
                </span>
              )}
            </NavLink>
          </div>
        </div>
      </header>

      {/* =====================================================
          MOBILE SLIDE-OVER APP DRAWER MENU
      ===================================================== */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={closeMenu}
          />

          {/* Drawer Content */}
          <div className="relative z-10 flex w-72 max-w-[82vw] flex-col bg-white shadow-2xl">
            {/* Drawer Header / Profile Card */}
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-200">
                  NovaCare BD App
                </span>
                <button
                  onClick={closeMenu}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
                >
                  <FaTimes />
                </button>
              </div>

              {user ? (
                <div className="mt-4 flex items-center gap-3">
                  <FaUserCircle className="text-4xl text-emerald-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-white">
                      {user.displayName || "Valued Customer"}
                    </p>
                    <p className="truncate text-xs text-emerald-200">
                      {user.email}
                    </p>
                    {role && (
                      <span className="mt-1 inline-block rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-slate-900">
                        {role}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm font-bold text-white">
                    Welcome to NovaCare BD
                  </p>
                  <p className="text-xs text-emerald-200">
                    অর্ডার ট্র্যাক করতে লগইন করুন
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <NavLink
                to="/"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FaHome className="text-base text-emerald-600" />
                <span>Home</span>
              </NavLink>

              <NavLink
                to="/allproduct"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FaPills className="text-base text-emerald-600" />
                <span>All Medicines</span>
              </NavLink>

              {user && (
                <NavLink
                  to="/my-orders"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <FaClipboardList className="text-base text-emerald-600" />
                  <span>My Orders</span>
                </NavLink>
              )}

              {(role === "admin" || role === "super-admin") && (
                <NavLink
                  to="/dashboard/all-orders"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-900 hover:bg-amber-100"
                >
                  <FaTachometerAlt className="text-base text-amber-600" />
                  <span>Admin Dashboard</span>
                </NavLink>
              )}

              <div className="my-2 border-t border-slate-100 pt-2">
                <a
                  href={APK_DOWNLOAD_URL}
                  onClick={closeMenu}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-700"
                >
                  <FaDownload className="text-base" />
                  <span>Download Android App</span>
                </a>
              </div>

              {!user ? (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <NavLink
                    to="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                  >
                    <FaSignInAlt />
                    <span>Login</span>
                  </NavLink>

                  <NavLink
                    to="/register"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-extrabold text-white hover:bg-slate-800"
                  >
                    <FaUserPlus />
                    <span>Register</span>
                  </NavLink>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMenu();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-extrabold text-red-600 hover:bg-red-100"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          FIXED BOTTOM MOBILE APP NAVIGATION BAR (ONLY ON MOBILE)
      ===================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-1 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-center">
          {/* 1. Home */}
          <NavLink to="/" className={bottomTabClass} onClick={closeMenu}>
            <FaHome className="text-lg" />
            <span>Home</span>
          </NavLink>

          {/* 2. Medicines */}
          <NavLink
            to="/allproduct"
            className={bottomTabClass}
            onClick={closeMenu}
          >
            <FaPills className="text-lg" />
            <span>Medicines</span>
          </NavLink>

          {/* 3. Center Floating Cart Button */}
          <NavLink
            to={user ? "/cart" : "/login"}
            onClick={closeMenu}
            className="relative -top-3 mx-auto flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition"
          >
            <FaShoppingCart className="text-lg" />
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white ring-2 ring-white">
                {cart.length}
              </span>
            )}
          </NavLink>

          {/* 4. Orders or App Download */}
          {user ? (
            <NavLink
              to="/my-orders"
              className={bottomTabClass}
              onClick={closeMenu}
            >
              <FaClipboardList className="text-lg" />
              <span>Orders</span>
            </NavLink>
          ) : (
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-emerald-600"
            >
              <FaDownload className="text-lg" />
              <span>Get App</span>
            </a>
          )}

          {/* 5. Dashboard / Account */}
          {role === "admin" || role === "super-admin" ? (
            <NavLink
              to="/dashboard/all-orders"
              className={bottomTabClass}
              onClick={closeMenu}
            >
              <FaTachometerAlt className="text-lg" />
              <span>Admin</span>
            </NavLink>
          ) : user ? (
            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-slate-500"
            >
              <FaUserCircle className="text-lg" />
              <span>Account</span>
            </button>
          ) : (
            <NavLink to="/login" className={bottomTabClass} onClick={closeMenu}>
              <FaUserCircle className="text-lg" />
              <span>Login</span>
            </NavLink>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
