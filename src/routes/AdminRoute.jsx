import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  const [roleLoading, setRoleLoading] = useState(true);
  const [role, setRole] = useState("");

  const location = useLocation();

  useEffect(() => {
    const getRole = async () => {
      if (!user?.email) {
        setRoleLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `https://medpharm-server-sgs6.vercel.app/api/users/email/${user.email}`,
        );

        setRole(res.data.user.role);
      } catch (error) {
        console.log(error);
      } finally {
        setRoleLoading(false);
      }
    };

    getRole();
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h2 className="text-3xl font-bold text-blue-600">Loading...</h2>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === "admin" || role === "super-admin") {
    return children;
  }

  return <Navigate to="/unauthorized" replace />;
}

export default AdminRoute;
