import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import useAuth from "../../hooks/useAuth";

function Login() {
  const { loginUser, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // ===========================
  // Login
  // ===========================
  const onSubmit = async (data) => {
    try {
      // Firebase Login
      const result = await loginUser(data.email, data.password);

      // Firebase Token
      const token = await result.user.getIdToken();

      console.log("Firebase Token:", token);

      // Backend API
      const res = await axios.get(
        "https://medpharm-server-sgs6.vercel.app/api/test/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(res.data);

      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome to MedPharm",
      });

      navigate("/");
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.message,
      });
    }
  };

  // ===========================
  // Google Login
  // ===========================
  const handleGoogleLogin = async () => {
    try {
      const result = await googleLogin();

      const token = await result.user.getIdToken();

      const res = await axios.get(
        "https://medpharm-server-sgs6.vercel.app/api/test/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(res.data);

      Swal.fire({
        icon: "success",
        title: "Google Login Successful",
      });

      navigate("/");
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Google Login Failed",
        text: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center mb-6">Login</h1>

        {/* Email */}

        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded-lg p-3 mb-2"
          {...register("email", {
            required: "Email is required",
          })}
        />

        {errors.email && (
          <p className="text-red-500 mb-3">{errors.email.message}</p>
        )}

        {/* Password */}

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          className="w-full border rounded-lg p-3 mb-2"
          {...register("password", {
            required: "Password is required",
          })}
        />

        {errors.password && (
          <p className="text-red-500 mb-3">{errors.password.message}</p>
        )}

        {/* Show Password */}

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            onChange={() => setShowPassword(!showPassword)}
          />

          <span>Show Password</span>
        </div>

        {/* Login Button */}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3"
        >
          Login
        </button>

        {/* Google */}

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white rounded-lg p-3"
        >
          Continue with Google
        </button>

        {/* Forgot */}

        <p className="text-center mt-5">
          <Link to="/forgot-password" className="text-blue-600">
            Forgot Password?
          </Link>
        </p>

        {/* Register */}

        <p className="text-center mt-5">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 font-semibold">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
