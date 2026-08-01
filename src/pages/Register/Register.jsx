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
      await axios.post("https://medpharm-server-sgs6.vercel.app/api/users", {
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

      navigate("/");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 flex items-center justify-center px-4 py-10">
      <div className="grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden max-w-6xl w-full">
        {/* Left Side */}
        <div className="hidden lg:flex bg-blue-700 text-white p-10 flex-col justify-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to MedPharm</h1>

          <p className="text-lg leading-8 text-blue-100">
            Create your account to order medicines online, track your orders,
            download invoices and manage your pharmacy purchases securely.
          </p>

          <img
            src="https://cdn-icons-png.flaticon.com/512/4320/4320371.png"
            alt=""
            className="w-72 mx-auto mt-10"
          />
        </div>

        {/* Right Side */}
        <div className="p-8 md:p-12">
          <h2 className="text-4xl font-bold text-center text-blue-700">
            Create Account
          </h2>

          <p className="text-center text-gray-500 mt-2 mb-8">
            Register your MedPharm account
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="input input-bordered w-full"
              {...register("name", {
                required: "Name is required",
              })}
            />
            <p className="text-red-500 text-sm">{errors.name?.message}</p>

            <input
              type="email"
              placeholder="Email Address"
              className="input input-bordered w-full"
              {...register("email", {
                required: "Email is required",
              })}
            />
            <p className="text-red-500 text-sm">{errors.email?.message}</p>

            <input
              type="text"
              placeholder="Full Address"
              className="input input-bordered w-full"
              {...register("address", {
                required: "Address is required",
              })}
            />
            <p className="text-red-500 text-sm">{errors.address?.message}</p>

            <input
              type="text"
              placeholder="Phone Number"
              className="input input-bordered w-full"
              {...register("phone", {
                required: "Phone is required",
              })}
            />
            <p className="text-red-500 text-sm">{errors.phone?.message}</p>

            <input
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              className="input input-bordered w-full"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Minimum 6 characters",
                },
              })}
            />
            <p className="text-red-500 text-sm">{errors.password?.message}</p>

            <input
              type="password"
              placeholder="Confirm Password"
              autoComplete="new-password"
              className="input input-bordered w-full"
              {...register("confirmPassword", {
                required: "Confirm Password is required",
              })}
            />
            <p className="text-red-500 text-sm">
              {errors.confirmPassword?.message}
            </p>

            <button className="btn btn-primary w-full text-lg" type="submit">
              Create Account
            </button>

            <p className="text-center text-gray-500">
              Already have an account?
              <a href="/login" className="text-blue-600 ml-1 font-semibold">
                Login
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
