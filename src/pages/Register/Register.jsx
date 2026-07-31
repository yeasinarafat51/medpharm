import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

function Register() {
  const { createUser, updateUserProfile, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      // Password Match Check
      if (data.password !== data.confirmPassword) {
        return Swal.fire({
          icon: "error",
          title: "Password Doesn't Match",
        });
      }

      // Firebase Registration
      const result = await createUser(data.email, data.password);

      // Update Firebase Profile
      await updateUserProfile(data.name, "");

      // MongoDB-তে User Save
      await axios.post("http://localhost:5000/api/users", {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        photo: "",
      });

      // Verification Email
      await verifyEmail();

      Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: "Verification Email Sent Successfully",
      });

      reset();

      navigate("/login");
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Registration Failed",
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
        <h1 className="text-3xl font-bold text-center mb-6">Register</h1>

        {/* Name */}
        <input
          type="text"
          placeholder="Full Name"
          className="input input-bordered w-full mb-3"
          {...register("name", {
            required: "Name is required",
          })}
        />

        {errors.name && (
          <p className="text-red-500 mb-2">{errors.name.message}</p>
        )}

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="input input-bordered w-full mb-3"
          {...register("email", {
            required: "Email is required",
          })}
        />

        {errors.email && (
          <p className="text-red-500 mb-2">{errors.email.message}</p>
        )}
        <input
          type="text"
          placeholder="Full Address"
          className="input input-bordered w-full mb-3"
          {...register("address", {
            required: "Name is required",
          })}
        />

        {errors.address && (
          <p className="text-red-500 mb-2">{errors.address.message}</p>
        )}
        <input
          type="text"
          placeholder="Phone Number"
          className="input input-bordered w-full mb-3"
          {...register("phone", {
            required: "phone is required",
          })}
        />

        {errors.phone && (
          <p className="text-red-500 mb-2">{errors.address.message}</p>
        )}
        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="input input-bordered w-full mb-3"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
        />

        {errors.password && (
          <p className="text-red-500 mb-2">{errors.password.message}</p>
        )}

        {/* Confirm Password */}
        <input
          type="password"
          placeholder="Confirm Password"
          className="input input-bordered w-full mb-4"
          {...register("confirmPassword", {
            required: "Confirm Password is required",
          })}
        />

        {errors.confirmPassword && (
          <p className="text-red-500 mb-2">{errors.confirmPassword.message}</p>
        )}

        <button type="submit" className="btn btn-primary w-full">
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;
