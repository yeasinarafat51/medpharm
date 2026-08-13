import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useAuth from "../../../hooks/useAuth";
import useCart from "../../../hooks/useCart";
import medisin from "../../../imges/medpharm_pharmacy.jpg";

function AllItemMedicine() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  // ==========================================
  // STATES
  // ==========================================

  const [medicines, setMedicines] = useState([]);

  // First page loading
  const [loading, setLoading] = useState(true);

  // Search loading
  const [searchLoading, setSearchLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [quantities, setQuantities] = useState({});

  // Axios request cancel করার জন্য
  const cancelSourceRef = useRef(null);

  const API_URL = "https://medpharm-server-sgs6.vercel.app";

  // ==========================================
  // LOAD MEDICINES
  // ==========================================

  const loadMedicine = async (searchValue = "", isFirstLoad = false) => {
    // আগের request cancel
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
    }

    const source = axios.CancelToken.source();

    cancelSourceRef.current = source;

    try {
      // ========================================
      // FIRST LOAD
      // ========================================

      if (isFirstLoad) {
        setLoading(true);
      } else {
        // Search করার সময় full loading নয়
        setSearchLoading(true);
      }

      const res = await axios.get(`${API_URL}/api/medicines`, {
        params: {
          search: searchValue.trim(),
          sort: "asc",
        },

        timeout: 20000,

        cancelToken: source.token,
      });

      console.log("Medicine API Response:", res.data);

      // ========================================
      // SAFE DATA
      // ========================================

      const medicineData = Array.isArray(res.data?.medicines)
        ? res.data.medicines
        : Array.isArray(res.data)
          ? res.data
          : [];

      setMedicines(medicineData);

      // Search result change হলে quantity reset
      setQuantities({});
    } catch (error) {
      // ========================================
      // REQUEST CANCEL হলে ERROR দেখাবে না
      // ========================================

      if (axios.isCancel(error)) {
        return;
      }

      console.error("Medicine Load Error:", error);

      setMedicines([]);

      Swal.fire({
        icon: "error",
        title: "Failed to Load Medicines",
        text:
          error?.response?.data?.message ||
          "Unable to load medicines. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      // ========================================
      // LOADING STOP
      // ========================================

      if (isFirstLoad) {
        setLoading(false);
      }

      setSearchLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadMedicine("", true);

    // Component unmount হলে request cancel
    return () => {
      if (cancelSourceRef.current) {
        cancelSourceRef.current.cancel();
      }
    };
  }, []);

  // ==========================================
  // SEARCH EFFECT
  // ==========================================

  useEffect(() => {
    // প্রথমবার empty search-এর জন্য এই effect চালানোর দরকার নেই
    if (search === "") {
      return;
    }

    // Debounce
    const timer = setTimeout(() => {
      loadMedicine(search, false);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // ==========================================
  // SEARCH INPUT
  // ==========================================

  const handleSearch = (e) => {
    const value = e.target.value;

    setSearch(value);

    // Search box empty করলে আবার সব medicine load
    if (value.trim() === "") {
      loadMedicine("", false);
    }
  };

  // ==========================================
  // INCREASE QUANTITY
  // ==========================================

  const increaseQty = (medicine) => {
    const stock = Number(medicine.stock) || 0;

    // Stock না থাকলে quantity বাড়বে না
    if (stock <= 0) {
      return;
    }

    setQuantities((prev) => {
      const current = prev[medicine._id] || 1;

      // Stock এর বেশি হতে পারবে না
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
    const stock = Number(medicine.stock) || 0;

    if (stock <= 0) {
      return;
    }

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
    // ========================================
    // LOGIN CHECK
    // ========================================

    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Please Login First",
        text: "You need to login before adding medicine to cart.",
        confirmButtonText: "Login",
      });

      return;
    }

    // ========================================
    // STOCK CHECK
    // ========================================

    const stock = Number(medicine.stock) || 0;

    if (stock <= 0) {
      Swal.fire({
        icon: "error",
        title: "Out of Stock",
        text: "This medicine is currently out of stock.",
        confirmButtonText: "OK",
      });

      return;
    }

    // ========================================
    // QUANTITY
    // ========================================

    const qty = quantities[medicine._id] || 1;

    // ========================================
    // QUANTITY VALIDATION
    // ========================================

    if (qty <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Quantity",
        text: "Please select a valid quantity.",
      });

      return;
    }

    if (qty > stock) {
      Swal.fire({
        icon: "warning",
        title: "Not Enough Stock",
        text: `Only ${stock} item available.`,
      });

      return;
    }

    // ========================================
    // ADD TO CART
    // ========================================

    addToCart({
      ...medicine,
      quantity: qty,
    });

    // ========================================
    // SUCCESS ALERT
    // ========================================

    Swal.fire({
      icon: "success",
      title: "Added To Cart",
      text: `${qty} item added successfully.`,
      timer: 1200,
      showConfirmButton: false,
    });
  };

  // ==========================================
  // FULL PAGE LOADING
  // শুধু প্রথমবার দেখাবে
  // ==========================================

  if (loading) {
    return (
      <div className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10">
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
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
        {/* Title */}

        <div>
          <h1 className="text-3xl font-bold text-slate-800">All Medicines</h1>

          <p className="mt-1 text-gray-500">
            Browse medicines and add them to your cart.
          </p>
        </div>

        {/* ======================================
            SEARCH BOX
        ====================================== */}

        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search medicine, company or generic..."
            value={search}
            onChange={handleSearch}
            className="
              w-full
              rounded-xl
              border
              border-gray-300
              bg-white
              px-4
              py-3
              pr-12
              outline-none
              transition
              focus:border-blue-600
              focus:ring-2
              focus:ring-blue-100
            "
          />

          {/* Search Loading */}

          {searchLoading && (
            <div
              className="
                absolute
                right-4
                top-1/2
                h-5
                w-5
                -translate-y-1/2
                animate-spin
                rounded-full
                border-2
                border-gray-300
                border-t-blue-600
              "
            />
          )}
        </div>
      </div>

      {/* ========================================
          SEARCH STATUS
      ======================================== */}

      {search.trim() && (
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Search result for:{" "}
            <span className="font-semibold text-blue-600">"{search}"</span>
          </p>

          {searchLoading && (
            <span className="text-sm font-medium text-blue-600">
              Searching...
            </span>
          )}
        </div>
      )}

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

              const isOutOfStock = stock <= 0;

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
                      MOBILE CARD
                  ================================== */}

                  <div className="flex p-3 lg:hidden">
                    {/* Image */}

                    <div className="relative">
                      <img
                        src={medicine.image || medisin}
                        alt={medicine.medicineName || "Medicine"}
                        className="h-24 w-24 rounded-xl object-cover"
                      />

                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                          <span className="text-center text-xs font-bold text-white">
                            OUT OF
                            <br />
                            STOCK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}

                    <div className="ml-3 flex flex-1 flex-col justify-between">
                      <div>
                        <h2 className="line-clamp-1 text-base font-bold text-gray-800">
                          {medicine.medicineName || "Unknown Medicine"}
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
                            ৳ {Number(medicine.sellingPrice || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
                            MRP ৳ {Number(medicine.mrpePrice || 0).toFixed(2)}
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
                            disabled={isOutOfStock || quantity <= 1}
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-red-500
                              text-white
                              transition
                              hover:bg-red-600
                              disabled:cursor-not-allowed
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
                            disabled={isOutOfStock || quantity >= stock}
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-green-600
                              text-white
                              transition
                              hover:bg-green-700
                              disabled:cursor-not-allowed
                              disabled:bg-gray-400
                            "
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleAddToCart(medicine)}
                          disabled={isOutOfStock}
                          className="
                            rounded-lg
                            bg-blue-600
                            px-3
                            py-2
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-blue-700
                            disabled:cursor-not-allowed
                            disabled:bg-gray-400
                          "
                        >
                          {isOutOfStock ? "Out of Stock" : "🛒 Add"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ==================================
                      DESKTOP CARD
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
                        {stock > 0 ? `Stock ${stock}` : "Out of Stock"}
                      </span>

                      {/* Out of Stock Overlay */}

                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="rounded-lg bg-red-600 px-5 py-3 text-lg font-bold text-white">
                            OUT OF STOCK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}

                    <div className="p-5">
                      <h2 className="line-clamp-1 text-xl font-bold text-gray-800">
                        {medicine.medicineName || "Unknown Medicine"}
                      </h2>

                      <p className="mt-1 text-gray-500">
                        {medicine.company || "N/A"}
                      </p>

                      {/* Price Box */}

                      <div className="mt-4 rounded-xl bg-gray-50 p-4">
                        {/* MRP */}

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">MRP</span>

                          <span className="line-through text-gray-400">
                            ৳ {Number(medicine.mrpePrice || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Discount */}

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-gray-600">Discount</span>

                          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">
                            {medicine.bikriPercent || 0}% OFF
                          </span>
                        </div>

                        {/* Selling Price */}

                        <div className="mt-3 flex items-center justify-between border-t pt-3">
                          <span className="font-semibold text-gray-700">
                            Selling Price
                          </span>

                          <span className="text-2xl font-bold text-green-600">
                            ৳ {Number(medicine.sellingPrice || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Stock */}

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-gray-600">Available Stock</span>

                          <span
                            className={`rounded-full px-3 py-1 text-sm font-bold ${
                              stock > 10
                                ? "bg-green-100 text-green-700"
                                : stock > 0
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {stock}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}

                      <div className="mt-5 flex items-center justify-center gap-4">
                        <button
                          onClick={() => decreaseQty(medicine)}
                          disabled={isOutOfStock || quantity <= 1}
                          className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-full
                            bg-red-500
                            text-xl
                            font-bold
                            text-white
                            transition
                            hover:bg-red-600
                            disabled:cursor-not-allowed
                            disabled:bg-gray-300
                          "
                        >
                          −
                        </button>

                        <span className="flex h-10 w-12 items-center justify-center rounded-lg border bg-gray-50 text-xl font-bold">
                          {quantity}
                        </span>

                        <button
                          onClick={() => increaseQty(medicine)}
                          disabled={isOutOfStock || quantity >= stock}
                          className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-full
                            bg-green-600
                            text-xl
                            font-bold
                            text-white
                            transition
                            hover:bg-green-700
                            disabled:cursor-not-allowed
                            disabled:bg-gray-400
                          "
                        >
                          +
                        </button>
                      </div>

                      {/* Add To Cart */}

                      <button
                        onClick={() => handleAddToCart(medicine)}
                        disabled={isOutOfStock}
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
                        {isOutOfStock ? "Out of Stock" : "🛒 Add To Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default AllItemMedicine;
