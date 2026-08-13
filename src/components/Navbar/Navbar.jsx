import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaBars, FaTimes, FaShoppingCart } from "react-icons/fa";

import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";

import logo from "../../imges/novacare.jpg";

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
          `https://medpharm-server-sgs6.vercel.app/api/users/email/${user.email}`,
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
  // NAV LINK STYLE
  // ==========================================

  const navLinkClass = ({ isActive }) =>
    isActive
      ? "text-blue-600 font-semibold"
      : "text-gray-700 hover:text-blue-600 transition";

  // ==========================================
  // CLOSE MOBILE MENU
  // ==========================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* =====================================================
          MAIN NAVBAR
      ===================================================== */}

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-5 md:py-4">
        {/* =====================================================
            MOBILE LEFT SIDE
            MENU BUTTON
        ===================================================== */}

        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl text-gray-700 hover:bg-gray-100"
            aria-label="Menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* =====================================================
            LOGO
        ===================================================== */}

        <NavLink
          to="/"
          className="flex items-center md:flex-1"
          onClick={closeMenu}
        >
          <img
            src={logo}
            alt="NovaCare"
            className="
              h-11
              w-40
              object-cover
              md:h-16
              md:w-64
            "
          />
        </NavLink>

        {/* =====================================================
            DESKTOP MENU
        ===================================================== */}

        <nav className="hidden items-center gap-6 md:flex">
          {/* All Medicines */}

          <NavLink to="/" className={navLinkClass}>
            All Medicines
          </NavLink>

          {/* My Orders */}

          {user && (
            <NavLink to="/my-orders" className={navLinkClass}>
              My Orders
            </NavLink>
          )}

          {/* Cart */}

          {user && (
            <NavLink to="/cart" className={navLinkClass}>
              <div className="relative">
                <FaShoppingCart size={22} />

                {cart.length > 0 && (
                  <span
                    className="
                      absolute
                      -right-3
                      -top-3
                      flex
                      h-5
                      w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-red-600
                      text-xs
                      text-white
                    "
                  >
                    {cart.length}
                  </span>
                )}
              </div>
            </NavLink>
          )}

          {/* Dashboard */}

          {(role === "admin" || role === "super-admin") && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}

          {/* Login / Register */}

          {!user ? (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>

              <NavLink to="/register" className={navLinkClass}>
                Register
              </NavLink>

              <a
                href="https://web2apkpro.com/public_download.php?project_id=20811&token=6e0ada7cc4"
                className={navLinkClass}
              >
                Download App
              </a>
            </>
          ) : (
            <>
              <span className="font-semibold text-gray-700">
                {user.displayName || user.email}
              </span>

              <button
                onClick={handleLogout}
                className="
                  rounded-lg
                  bg-red-600
                  px-5
                  py-2
                  text-white
                  hover:bg-red-700
                "
              >
                Logout
              </button>
            </>
          )}
        </nav>

        {/* =====================================================
            MOBILE CART
            RIGHT SIDE
        ===================================================== */}

        <div className="flex items-center md:hidden">
          {user && (
            <NavLink
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
              aria-label="Cart"
            >
              <FaShoppingCart size={22} />

              {cart.length > 0 && (
                <span
                  className="
                    absolute
                    -right-1
                    -top-1
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-red-600
                    px-1
                    text-[10px]
                    font-bold
                    text-white
                  "
                >
                  {cart.length}
                </span>
              )}
            </NavLink>
          )}

          {/* Login হলে cart-এর জায়গা ঠিক রাখতে */}

          {!user && <div className="h-10 w-10" />}
        </div>
      </div>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {menuOpen && (
        <div className="border-t bg-white shadow-lg md:hidden">
          <div className="flex flex-col">
            {/* All Medicines */}

            <NavLink
              to="/"
              onClick={closeMenu}
              className="border-b px-6 py-4 font-medium text-gray-700 hover:bg-gray-50"
            >
              All Medicines
            </NavLink>

            {/* My Orders */}

            {user && (
              <NavLink
                to="/my-orders"
                onClick={closeMenu}
                className="border-b px-6 py-4 font-medium text-gray-700 hover:bg-gray-50"
              >
                My Orders
              </NavLink>
            )}

            {/* Dashboard */}

            {(role === "admin" || role === "super-admin") && (
              <NavLink
                to="/dashboard"
                onClick={closeMenu}
                className="border-b px-6 py-4 font-medium text-gray-700 hover:bg-gray-50"
              >
                Dashboard
              </NavLink>
            )}

            {/* Login / Register */}

            {!user ? (
              <>
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className="border-b px-6 py-4 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  onClick={closeMenu}
                  className="border-b px-6 py-4 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Register
                </NavLink>

                <a
                  href="https://web2apkpro.com/public_download.php?project_id=20811&token=6e0ada7cc4"
                  onClick={closeMenu}
                  className="border-b px-6 py-4 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Download App
                </a>
              </>
            ) : (
              <>
                {/* User */}

                <div className="border-b px-6 py-4">
                  <p className="text-sm text-gray-500">Logged in as</p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {user.displayName || user.email}
                  </p>
                </div>

                {/* Logout */}

                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="
                    m-4
                    rounded-lg
                    bg-red-600
                    py-3
                    font-semibold
                    text-white
                    hover:bg-red-700
                  "
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
