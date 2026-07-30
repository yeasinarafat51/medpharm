import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-xl bg-white p-10 shadow-xl text-center">
        <h1 className="text-6xl font-bold text-red-600">403</h1>

        <h2 className="mt-4 text-3xl font-bold">Access Denied</h2>

        <p className="mt-3 text-gray-600">
          You don't have permission to access this page.
        </p>

        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Back Home
        </Link>
      </div>
    </div>
  );
}

export default Unauthorized;
