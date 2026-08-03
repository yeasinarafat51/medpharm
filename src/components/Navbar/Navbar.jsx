import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaBars, FaTimes } from "react-icons/fa";
import useAuth from "../../hooks/useAuth";
import { FaShoppingCart } from "react-icons/fa";
import useCart from "../../hooks/useCart";
// import useAuth from "../hooks/useAuth";
import logo from "../../imges/novacare.jpg";
function Navbar() {
  const { user, logoutUser } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
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
        console.log(error);
      }
    };

    getRole();
  }, [user]);

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
    }
  };

  const navLinkClass = ({ isActive }) =>
    isActive
      ? "text-blue-600 font-semibold"
      : "text-gray-700 hover:text-blue-600 transition";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
        {/* Logo */}{" "}
        <NavLink to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Radiance"
            className="w-64 h-16  object-cover  "
          />

          {/* <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Radiance
              </h2>

              <p className="text-xs tracking-[3px] uppercase text-amber-600">
                Leather Industry
              </p>
            </div> */}
        </NavLink>
        {/* <Link to="/" className="text-3xl font-bold text-blue-600">
          MedPharm
        </Link> */}
        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={navLinkClass}>
            All Medicines
          </NavLink>

          {user && (
            <NavLink to="/my-orders" className={navLinkClass}>
              My Orders
            </NavLink>
          )}
          {user && (
            <NavLink to="/cart" className={navLinkClass}>
              <div className="relative">
                <FaShoppingCart size={22} />

                {cart.length > 0 && (
                  <span className="absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                    {cart.length}
                  </span>
                )}
              </div>
            </NavLink>
          )}
          {/* {user && <NavLink to="/my-invoices">My Invoices</NavLink>} */}

          {(role === "admin" || role === "super-admin") && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}

          {!user ? (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>

              <NavLink to="/register" className={navLinkClass}>
                Register
              </NavLink>
            </>
          ) : (
            <>
              <span className="font-semibold text-gray-700">
                {user.displayName || user.email}
              </span>

              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
              >
                Logout
              </button>
            </>
          )}
        </nav>
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}

      {menuOpen && (
        <div className="md:hidden border-t bg-white shadow-lg">
          <div className="flex flex-col">
            <NavLink
              to="/"
              onClick={() => setMenuOpen(false)}
              className="px-6 py-4 border-b"
            >
              All Medicines
            </NavLink>

            {user && (
              <NavLink
                to="/my-orders"
                onClick={() => setMenuOpen(false)}
                className="px-6 py-4 border-b"
              >
                My Orders
              </NavLink>
            )}
            {user && (
              <NavLink
                to="/cart"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between border-b px-6 py-4"
              >
                <div className="flex items-center gap-2">
                  <FaShoppingCart />
                  <span>Cart</span>
                </div>

                {cart.length > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                    {cart.length}
                  </span>
                )}
              </NavLink>
            )}
            {(role === "admin" || role === "super-admin") && (
              <NavLink
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="px-6 py-4 border-b"
              >
                Dashboard
              </NavLink>
            )}

            {!user ? (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-6 py-4 border-b"
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="px-6 py-4 border-b"
                >
                  Register
                </NavLink>
              </>
            ) : (
              <>
                <div className="px-6 py-4 border-b font-semibold">
                  {user.displayName || user.email}
                </div>

                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="m-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg"
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
