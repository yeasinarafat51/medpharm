import { useState } from "react";
import Swal from "sweetalert2";
import useAuth from "../../hooks/useAuth";

function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");

  const handleReset = () => {
    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Please enter your email",
      });
      return;
    }

    resetPassword(email)
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Password reset email sent",
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: error.message,
        });
      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-white p-8 shadow rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Forgot Password</h1>

        <input
          type="email"
          placeholder="Enter your email"
          className="border rounded-lg p-3 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="mt-5 bg-blue-600 text-white rounded-lg p-3 w-full"
        >
          Send Reset Email
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
