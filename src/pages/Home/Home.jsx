import useAuth from "../../hooks/useAuth";

function Home() {
  const { user, googleLogin, logoutUser } = useAuth();

  const handleGoogle = () => {
    googleLogin()
      .then(() => {
        console.log("Google Login Success");
      })
      .catch(console.error);
  };

  const handleLogout = () => {
    logoutUser()
      .then(() => {
        console.log("Logout Success");
      })
      .catch(console.error);
  };

  return (
    <div className="text-center mt-20">
      <h1 className="text-4xl font-bold">MedPharm</h1>

      {user ? (
        <>
          <h2 className="mt-6 text-green-600">{user.email}</h2>

          <button
            onClick={handleLogout}
            className="mt-5 bg-red-600 text-white px-5 py-2 rounded"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <h2 className="mt-6 text-red-600">User Not Logged In</h2>

          <button
            onClick={handleGoogle}
            className="mt-5 bg-blue-600 text-white px-5 py-2 rounded"
          >
            Google Login
          </button>
        </>
      )}
    </div>
  );
}

export default Home;
