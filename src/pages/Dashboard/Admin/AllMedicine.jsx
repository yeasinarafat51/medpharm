import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

function AllMedicine() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("asc");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 5;

  const loadMedicine = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/api/medicines?search=${search}&page=${page}&limit=${limit}&sort=${sort}`,
      );

      setMedicines(res.data.medicines);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicine();
  }, [search, page, sort]);

  // Delete Medicine

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Medicine?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#2563eb",
      confirmButtonText: "Yes, Delete",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/medicines/${id}`);

        Swal.fire({
          icon: "success",
          title: "Medicine Deleted",
          timer: 1500,
          showConfirmButton: false,
        });

        loadMedicine();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: error.message,
        });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}

      <div className="flex flex-col lg:flex-row justify-between items-center gap-5 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            💊 All Medicines
          </h1>

          <p className="text-gray-500 mt-2">
            Manage all medicines from one place.
          </p>
        </div>

        <Link
          to="/dashboard/add-medicine"
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-3 rounded-xl font-semibold shadow"
        >
          + Add Medicine
        </Link>
      </div>

      {/* Search & Sort */}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Search Medicine
            </label>

            <input
              type="text"
              placeholder="Search by medicine name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Sort
            </label>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}

      <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-5 py-4 text-left">#</th>

              <th className="px-5 py-4 text-left">Medicine</th>

              <th className="px-5 py-4 text-left">Company</th>

              <th className="px-5 py-4 text-left">Category</th>

              <th className="px-5 py-4 text-left">Purchase</th>

              <th className="px-5 py-4 text-left">Selling</th>

              <th className="px-5 py-4 text-left">Stock</th>

              <th className="px-5 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-16 text-center text-lg font-semibold text-blue-600"
                >
                  Loading medicines...
                </td>
              </tr>
            ) : medicines.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-500">
                  No Medicine Found
                </td>
              </tr>
            ) : (
              medicines.map((medicine, index) => (
                <tr
                  key={medicine._id}
                  className="border-b hover:bg-blue-50 transition duration-200"
                >
                  <td className="px-5 py-4 font-semibold">
                    {(page - 1) * limit + index + 1}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          medicine.image ||
                          "https://placehold.co/60x60?text=Medicine"
                        }
                        alt={medicine.medicineName}
                        className="h-14 w-14 rounded-lg border object-cover"
                      />

                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {medicine.medicineName}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {medicine.genericName}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">{medicine.company}</td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                      {medicine.category}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-medium text-gray-700">
                    ৳ {medicine.purchasePrice}
                  </td>

                  <td className="px-5 py-4 font-bold text-green-600">
                    ৳ {medicine.sellingPrice}
                  </td>

                  <td className="px-5 py-4">
                    {Number(medicine.stock) <= 10 ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">
                        {medicine.stock} Low
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                        {medicine.stock}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <Link
                        to={`/dashboard/update-medicine/${medicine._id}`}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(medicine._id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="rounded-lg bg-gray-200 px-5 py-2 font-semibold transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <div className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white">
          {page}
        </div>

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AllMedicine;
