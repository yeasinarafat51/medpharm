import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

const API = "https://medpharm-server-sgs6.vercel.app";

const companies = [
  { name: "All Medicines", value: "" },
  { name: "Square", value: "Square" },
  { name: "Aci", value: "Aci" },
  { name: "Popular", value: "Popular" },
  { name: "Ibn-Sina", value: "Ibnsina" },
  { name: "SKF", value: "SKF" },
  { name: "Radiant", value: "Radiant" },
  { name: "Aristopharma", value: "Aristopharma" },
];

const AllMedicine = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [sort, setSort] = useState("asc");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 5;

  // =========================
  // LOAD MEDICINES
  // =========================
  const loadMedicine = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        search: search.trim(),
        company: company.trim(),
        page: String(page),
        limit: String(limit),
        sort,
      });

      const response = await axios.get(
        `${API}/api/medicines?${params.toString()}`,
      );

      if (response.data?.success) {
        setMedicines(response.data.medicines || []);

        setTotalPages(
          Number(response.data.totalPages) > 0
            ? Number(response.data.totalPages)
            : 1,
        );
      } else {
        setMedicines([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Medicine Load Error:", error);

      setMedicines([]);
      setTotalPages(1);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Medicine load করা যায়নি!",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    loadMedicine();
  }, [page, company, sort]);

  // =========================
  // SEARCH
  // =========================
  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);

    // Search change হওয়ার পর manually load করার দরকার নেই
    // search dependency useEffect-এ দিলে typing-এর সাথে সাথে API call হবে।
    loadMedicine();
  };

  // =========================
  // COMPANY FILTER
  // =========================
  const handleCompanyChange = (companyValue) => {
    setCompany(companyValue);
    setPage(1);
  };

  // =========================
  // DELETE MEDICINE
  // =========================
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "এই medicine delete করলে আর ফিরে পাওয়া যাবে না!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await axios.delete(`${API}/api/medicines/${id}`);

      if (response.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Medicine successfully deleted.",
          timer: 1500,
          showConfirmButton: false,
        });

        loadMedicine();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.data?.message || "Delete failed!",
        });
      }
    } catch (error) {
      console.error("Delete Medicine Error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Medicine delete করা যায়নি!",
      });
    }
  };

  // =========================
  // SEARCH INPUT
  // =========================
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // =========================
  // SEARCH ENTER
  // =========================
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      setPage(1);
      loadMedicine();
    }
  };

  // =========================
  // PREVIOUS PAGE
  // =========================
  const handlePrevious = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  // =========================
  // NEXT PAGE
  // =========================
  const handleNext = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            All Medicines
          </h1>

          <p className="text-gray-500 mt-1">Manage all medicines from here.</p>
        </div>

        <Link
          to="/dashboard/add-medicine"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-center transition"
        >
          + Add Medicine
        </Link>
      </div>

      {/* =========================
          COMPANY BUTTONS
      ========================= */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Filter By Company
        </h2>

        <div className="flex flex-wrap gap-2">
          {companies.map((companyItem) => (
            <button
              key={companyItem.value}
              type="button"
              onClick={() => handleCompanyChange(companyItem.value)}
              className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                company === companyItem.value
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
              }`}
            >
              {companyItem.name}
            </button>
          ))}
        </div>
      </div>

      {/* =========================
          SEARCH + SORT
      ========================= */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search medicine, company or generic name..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={() => {
              setPage(1);
              loadMedicine();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
          >
            Search
          </button>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </select>
        </div>
      </div>

      {/* =========================
          SELECTED COMPANY
      ========================= */}
      {company && (
        <div className="mb-4">
          <span className="text-gray-600">Showing medicines from:</span>

          <span className="ml-2 font-bold text-blue-600">
            {companies.find((item) => item.value === company)?.name || company}
          </span>
        </div>
      )}

      {/* =========================
          TABLE
      ========================= */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  #
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Medicine
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Company
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Purchase
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Selling
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Stock
                </th>

                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>

                      <span className="text-gray-500">
                        Loading medicines...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    <p className="text-gray-500 text-lg">No medicine found.</p>

                    {company && (
                      <p className="text-sm text-gray-400 mt-1">
                        এই company-এর কোনো medicine পাওয়া যায়নি।
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                medicines.map((medicine, index) => (
                  <tr
                    key={medicine._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    {/* Number */}
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {(page - 1) * limit + index + 1}
                    </td>

                    {/* Medicine */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            medicine.image ||
                            "https://placehold.co/60x60?text=Medicine"
                          }
                          alt={medicine.medicineName || "Medicine"}
                          className="w-12 h-12 rounded-lg object-cover border"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/60x60?text=Medicine";
                          }}
                        />

                        <div>
                          <p className="font-semibold text-gray-800">
                            {medicine.medicineName || "N/A"}
                          </p>

                          <p className="text-xs text-gray-500">
                            {medicine.genericName || "No generic name"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {medicine.company || "N/A"}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {medicine.category || "N/A"}
                    </td>

                    {/* Purchase Price */}
                    <td className="px-4 py-4 text-sm font-medium text-gray-700">
                      ৳{Number(medicine.purchasePrice || 0).toFixed(2)}
                    </td>

                    {/* Selling Price */}
                    <td className="px-4 py-4 text-sm font-semibold text-green-600">
                      ৳{Number(medicine.sellingPrice || 0).toFixed(2)}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          Number(medicine.stock || 0) > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {medicine.stock || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <Link
                          to={`/dashboard/update-medicine/${medicine._id}`}
                          className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(medicine._id)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition"
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

        {/* =========================
            PAGINATION
        ========================= */}
        {!loading && medicines.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t">
            <p className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-800">{page}</span>{" "}
              of{" "}
              <span className="font-semibold text-gray-800">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  page === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Previous
              </button>

              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
                {page}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={page >= totalPages}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  page >= totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMedicine;
