import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useAuth from "../../../hooks/useAuth";
import useCart from "../../../hooks/useCart";
import medisin from "../../../imges/medicine.jpg";

function AllItemMedicine() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  // ==========================================
  // STATES
  // ==========================================

  const [medicines, setMedicines] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [quantities, setQuantities] = useState({});

  const limit = 8;

  const API_URL = "https://medpharm-server-sgs6.vercel.app";

  // ==========================================
  // LOAD MEDICINES
  // ==========================================

  const loadMedicine = async () => {
    try {
      // Start loading
      setLoading(true);

      const res = await axios.get(`${API_URL}/api/medicines`, {
        params: {
          search: search.trim(),
          page: page,
          limit: limit,
          sort: "asc",
        },
        timeout: 20000,
      });

      console.log("Medicine API Response:", res.data);

      // ========================================
      // SAFE DATA SET
      // ========================================

      const medicineData = Array.isArray(res.data?.medicines)
        ? res.data.medicines
        : [];

      const pages = Number(res.data?.totalPages) || 1;

      setMedicines(medicineData);

      setTotalPages(pages);
    } catch (error) {
      console.error("Medicine Load Error:", error);

      // Empty data
      setMedicines([]);

      setTotalPages(1);

      // Error alert
      Swal.fire({
        icon: "error",
        title: "Failed to Load Medicines",
        text:
          error?.response?.data?.message ||
          "Unable to load medicines. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      // IMPORTANT
      // Loading will always stop
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    loadMedicine();
  }, [search, page]);

  // ==========================================
  // INCREASE QUANTITY
  // ==========================================

  const increaseQty = (medicine) => {
    setQuantities((prev) => {
      const current = prev[medicine._id] || 1;

      const stock = Number(medicine.stock) || 0;

      // Stock 0
      if (stock <= 0) {
        return prev;
      }

      // Cannot exceed stock
      if (current >= stock) {
        return prev;
      }

      return {
        ...prev,
        [medicine._id]: current + 1,
      };
    });
  };

  // ==========================================
  // DECREASE QUANTITY
  // ==========================================

  const decreaseQty = (medicine) => {
    setQuantities((prev) => {
      const current = prev[medicine._id] || 1;

      if (current <= 1) {
        return prev;
      }

      return {
        ...prev,
        [medicine._id]: current - 1,
      };
    });
  };

  // ==========================================
  // ADD TO CART
  // ==========================================

  const handleAddToCart = (medicine) => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Please Login First",
        text: "You need to login before adding medicine to cart.",
      });

      return;
    }

    const stock = Number(medicine.stock) || 0;

    if (stock <= 0) {
      Swal.fire({
        icon: "error",
        title: "Out of Stock",
        text: "This medicine is currently out of stock.",
      });

      return;
    }

    const qty = quantities[medicine._id] || 1;

    if (qty > stock) {
      Swal.fire({
        icon: "warning",
        title: "Not Enough Stock",
        text: `Only ${stock} item available.`,
      });

      return;
    }

    addToCart({
      ...medicine,
      quantity: qty,
    });

    Swal.fire({
      icon: "success",
      title: "Added To Cart",
      text: `${qty} item added successfully`,
      timer: 1200,
      showConfirmButton: false,
    });
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = (e) => {
    const value = e.target.value;

    setSearch(value);

    // Search করলে page 1 এ যাবে
    setPage(1);
  };

  // ==========================================
  // PREVIOUS PAGE
  // ==========================================

  const handlePrevious = () => {
    if (page > 1 && !loading) {
      setPage((prev) => prev - 1);
    }
  };

  // ==========================================
  // NEXT PAGE
  // ==========================================

  const handleNext = () => {
    if (page < totalPages && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10">
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          {/* Spinner */}

          <div
            className="
              h-14
              w-14
              animate-spin
              rounded-full
              border-4
              border-gray-200
              border-t-blue-600
            "
          />

          <h2 className="mt-5 text-xl font-bold text-gray-700">
            Loading Medicines...
          </h2>

          <p className="mt-1 text-sm text-gray-500">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* ========================================
          HEADER
      ======================================== */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">All Medicines</h1>

          <p className="text-gray-500">
            Browse medicines and add them to your cart.
          </p>
        </div>

        {/* Search */}

        <input
          type="text"
          placeholder="Search medicine..."
          value={search}
          onChange={handleSearch}
          className="
            w-full
            rounded-xl
            border
            border-gray-300
            px-4
            py-3
            outline-none
            transition
            focus:border-blue-600
            focus:ring-2
            focus:ring-blue-100
            md:w-96
          "
        />
      </div>

      {/* ========================================
          EMPTY DATA
      ======================================== */}

      {medicines.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="text-6xl">💊</div>

            <h2 className="mt-4 text-2xl font-bold text-gray-700">
              No Medicine Found
            </h2>

            <p className="mt-2 text-gray-500">
              {search
                ? `No medicine found for "${search}"`
                : "There are no medicines available."}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ======================================
              MEDICINE GRID
          ====================================== */}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
            {medicines.map((medicine) => {
              const stock = Number(medicine.stock) || 0;

              const quantity = quantities[medicine._id] || 1;

              return (
                <div
                  key={medicine._id}
                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-200
                    bg-white
                    shadow-sm
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-xl
                  "
                >
                  {/* ==================================
                      MOBILE
                  ================================== */}

                  <div className="flex p-3 lg:hidden">
                    {/* Image */}

                    <img
                      src={medicine.image || medisin}
                      alt={medicine.medicineName || "Medicine"}
                      className="h-24 w-24 rounded-xl object-cover"
                    />

                    {/* Content */}

                    <div className="ml-3 flex flex-1 flex-col justify-between">
                      <div>
                        <h2 className="line-clamp-1 text-base font-bold text-gray-800">
                          {medicine.medicineName}
                        </h2>

                        <div className="mt-1 flex">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            {medicine.category || "Medicine"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {medicine.company || "N/A"}
                        </p>
                      </div>

                      {/* Price */}

                      <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Selling Price
                          </span>

                          <span className="text-xl font-bold text-green-600">
                            ৳ {medicine.sellingPrice || 0}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
                            MRP ৳ {medicine.mrpePrice || 0}
                          </span>

                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                            {medicine.bikriPercent || 0}% OFF
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              stock > 10
                                ? "bg-green-100 text-green-700"
                                : stock > 0
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            Stock: {stock}
                          </span>
                        </div>
                      </div>

                      {/* Quantity + Add */}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decreaseQty(medicine)}
                            disabled={stock <= 0}
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-red-500
                              text-white
                              disabled:bg-gray-300
                            "
                          >
                            -
                          </button>

                          <span className="w-6 text-center font-bold">
                            {quantity}
                          </span>

                          <button
                            onClick={() => increaseQty(medicine)}
                            disabled={stock <= 0 || quantity >= stock}
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-green-600
                              text-white
                              disabled:bg-gray-400
                            "
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleAddToCart(medicine)}
                          disabled={stock <= 0}
                          className="
                            rounded-lg
                            bg-blue-600
                            px-3
                            py-2
                            text-sm
                            font-semibold
                            text-white
                            disabled:cursor-not-allowed
                            disabled:bg-gray-400
                          "
                        >
                          {stock <= 0 ? "Out of Stock" : "Add"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ==================================
                      DESKTOP
                  ================================== */}

                  <div className="hidden lg:block">
                    {/* Image */}

                    <div className="relative overflow-hidden">
                      <img
                        src={medicine.image || medisin}
                        alt={medicine.medicineName || "Medicine"}
                        className="
                          h-56
                          w-full
                          object-cover
                          transition
                          duration-500
                          hover:scale-110
                        "
                      />

                      {/* Category */}

                      <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        {medicine.category || "Medicine"}
                      </span>

                      {/* Stock */}

                      <span
                        className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${
                          stock > 10
                            ? "bg-green-600"
                            : stock > 0
                              ? "bg-yellow-500"
                              : "bg-red-600"
                        }`}
                      >
                        Stock {stock}
                      </span>
                    </div>

                    {/* Content */}

                    <div className="p-5">
                      <h2 className="line-clamp-1 text-xl font-bold">
                        {medicine.medicineName}
                      </h2>

                      <p className="text-gray-500">
                        {medicine.company || "N/A"}
                      </p>

                      {/* Price Box */}

                      <div className="mt-4 rounded-xl bg-gray-50 p-3">
                        <div className="flex justify-between">
                          <span>MRP</span>

                          <span className="line-through text-gray-400">
                            ৳ {medicine.mrpePrice || 0}
                          </span>
                        </div>

                        <div className="mt-2 flex justify-between">
                          <span>Discount</span>

                          <span className="rounded-full bg-red-100 px-2 py-1 text-red-600">
                            {medicine.bikriPercent || 0}% OFF
                          </span>
                        </div>

                        <div className="mt-3 flex justify-between">
                          <span>Selling Price</span>

                          <span className="text-2xl font-bold text-green-600">
                            ৳ {medicine.sellingPrice || 0}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}

                      <div className="mt-5 flex items-center justify-center gap-4">
                        <button
                          onClick={() => decreaseQty(medicine)}
                          disabled={stock <= 0}
                          className="
                            h-10
                            w-10
                            rounded-full
                            bg-red-500
                            text-xl
                            text-white
                            disabled:bg-gray-300
                          "
                        >
                          -
                        </button>

                        <span className="w-10 text-center text-xl font-bold">
                          {quantity}
                        </span>

                        <button
                          onClick={() => increaseQty(medicine)}
                          disabled={stock <= 0 || quantity >= stock}
                          className="
                            h-10
                            w-10
                            rounded-full
                            bg-green-600
                            text-xl
                            text-white
                            disabled:bg-gray-400
                          "
                        >
                          +
                        </button>
                      </div>

                      {/* Add To Cart */}

                      <button
                        onClick={() => handleAddToCart(medicine)}
                        disabled={stock <= 0}
                        className="
                          mt-5
                          w-full
                          rounded-xl
                          bg-blue-600
                          py-3
                          font-semibold
                          text-white
                          transition
                          hover:bg-blue-700
                          disabled:cursor-not-allowed
                          disabled:bg-gray-400
                        "
                      >
                        {stock <= 0 ? "Out of Stock" : "🛒 Add To Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ======================================
              PAGINATION
          ====================================== */}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              {/* Previous */}

              <button
                disabled={page === 1 || loading}
                onClick={handlePrevious}
                className="
                  rounded-lg
                  bg-gray-200
                  px-5
                  py-2
                  font-semibold
                  transition
                  hover:bg-gray-300
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Previous
              </button>

              {/* Current Page */}

              <div className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white">
                {page} / {totalPages}
              </div>

              {/* Next */}

              <button
                disabled={page === totalPages || loading}
                onClick={handleNext}
                className="
                  rounded-lg
                  bg-blue-600
                  px-5
                  py-2
                  font-semibold
                  text-white
                  transition
                  hover:bg-blue-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AllItemMedicine;
