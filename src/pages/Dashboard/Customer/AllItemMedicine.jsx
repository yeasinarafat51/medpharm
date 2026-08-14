import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaSearch,
  FaCapsules,
  FaExclamationTriangle,
} from "react-icons/fa";

import useAuth from "../../../hooks/useAuth";
import useCart from "../../../hooks/useCart";
import medisin from "../../../imges/medpharm_pharmacy.jpg";

function AllItemMedicine() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  // =========================================================
  // STATES
  // =========================================================

  const [medicines, setMedicines] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchLoading, setSearchLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [quantities, setQuantities] = useState({});

  // =========================================================
  // AXIOS CANCEL
  // =========================================================

  const cancelSourceRef = useRef(null);

  // =========================================================
  // API
  // =========================================================

  const API_URL = "https://medpharm-server-sgs6.vercel.app";

  // =========================================================
  // LOAD MEDICINES
  // =========================================================

  const loadMedicine = async (searchValue = "", isFirstLoad = false) => {
    // -------------------------------------------------------
    // Cancel previous request
    // -------------------------------------------------------

    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
    }

    const source = axios.CancelToken.source();

    cancelSourceRef.current = source;

    try {
      // -----------------------------------------------------
      // Loading
      // -----------------------------------------------------

      if (isFirstLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }

      // -----------------------------------------------------
      // API Request
      // -----------------------------------------------------

      const res = await axios.get(`${API_URL}/api/medicines`, {
        params: {
          search: searchValue.trim(),
          sort: "asc",
        },

        timeout: 30000,

        cancelToken: source.token,
      });

      console.log("Medicine API:", res.data);

      // -----------------------------------------------------
      // Safe Data
      // -----------------------------------------------------

      let medicineData = [];

      if (Array.isArray(res.data?.medicines)) {
        medicineData = res.data.medicines;
      } else if (Array.isArray(res.data)) {
        medicineData = res.data;
      }

      setMedicines(medicineData);

      // Search/change হলে quantity reset
      setQuantities({});
    } catch (error) {
      // -----------------------------------------------------
      // Cancelled Request
      // -----------------------------------------------------

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
          error?.message ||
          "Unable to load medicines. Please try again.",
      });
    } finally {
      // -----------------------------------------------------
      // Stop Loading
      // -----------------------------------------------------

      if (isFirstLoad) {
        setLoading(false);
      }

      setSearchLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadMedicine("", true);

    return () => {
      if (cancelSourceRef.current) {
        cancelSourceRef.current.cancel();
      }
    };
  }, []);

  // =========================================================
  // SEARCH DEBOUNCE
  // =========================================================

  useEffect(() => {
    if (search === "") {
      return;
    }

    const timer = setTimeout(() => {
      loadMedicine(search, false);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // =========================================================
  // SEARCH HANDLER
  // =========================================================

  const handleSearch = (e) => {
    const value = e.target.value;

    setSearch(value);

    // Search empty হলে সব medicine আবার load
    if (value.trim() === "") {
      loadMedicine("", false);
    }
  };

  // =========================================================
  // GET QUANTITY
  // =========================================================

  const getQuantity = (medicine) => {
    return quantities[medicine._id] || 1;
  };

  // =========================================================
  // INCREASE QUANTITY
  // =========================================================

  const increaseQty = (medicine) => {
    const stock = Number(medicine.stock) || 0;

    if (stock <= 0) {
      return;
    }

    setQuantities((prev) => {
      const current = prev[medicine._id] || 1;

      if (current >= stock) {
        return prev;
      }

      return {
        ...prev,
        [medicine._id]: current + 1,
      };
    });
  };

  // =========================================================
  // DECREASE QUANTITY
  // =========================================================

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

  // =========================================================
  // ADD TO CART
  // =========================================================

  const handleAddToCart = (medicine) => {
    // -------------------------------------------------------
    // Login Check
    // -------------------------------------------------------

    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Please Login First",
        text: "You need to login before adding medicine to cart.",
        confirmButtonText: "Login",
      });

      return;
    }

    // -------------------------------------------------------
    // Stock
    // -------------------------------------------------------

    const stock = Number(medicine.stock) || 0;

    if (stock <= 0) {
      Swal.fire({
        icon: "error",
        title: "Out of Stock",
        text: "This medicine is currently out of stock.",
      });

      return;
    }

    // -------------------------------------------------------
    // Quantity
    // -------------------------------------------------------

    const qty = quantities[medicine._id] || 1;

    // -------------------------------------------------------
    // Stock Validation
    // -------------------------------------------------------

    if (qty > stock) {
      Swal.fire({
        icon: "warning",
        title: "Not Enough Stock",
        text: `Only ${stock} item available.`,
      });

      return;
    }

    // -------------------------------------------------------
    // Add
    // -------------------------------------------------------

    addToCart({
      ...medicine,
      quantity: qty,
    });

    // -------------------------------------------------------
    // Success
    // -------------------------------------------------------

    Swal.fire({
      icon: "success",
      title: "Added To Cart",
      text: `${qty} item added successfully.`,
      timer: 1100,
      showConfirmButton: false,
    });
  };

  // =========================================================
  // FULL PAGE LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div
            className="
              mx-auto
              h-12
              w-12
              animate-spin
              rounded-full
              border-4
              border-gray-200
              border-t-blue-600
            "
          />

          <h2 className="mt-4 text-lg font-bold text-gray-700">
            Loading Medicines...
          </h2>

          <p className="mt-1 text-sm text-gray-400">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="
            mb-5
            flex
            flex-col
            gap-4
            sm:mb-7
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          {/* TITLE */}

          <div>
            <div className="flex items-center gap-2">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-600
                  text-white
                  shadow-md
                "
              >
                <FaCapsules />
              </div>

              <div>
                <h1
                  className="
                    text-2xl
                    font-black
                    tracking-tight
                    text-slate-800
                    sm:text-3xl
                  "
                >
                  All Medicines
                </h1>

                <p className="text-xs text-gray-500 sm:text-sm">
                  Browse medicines and add them to your cart.
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="relative w-full md:w-96">
            <FaSearch
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search medicine..."
              className="
                w-full
                rounded-xl
                border
                border-gray-200
                bg-white
                py-3
                pl-11
                pr-11
                text-sm
                shadow-sm
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "
            />

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

        {/* ==================================================
            SEARCH RESULT
        ================================================== */}

        {search.trim() && (
          <div
            className="
              mb-4
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-blue-100
              bg-blue-50
              px-3
              py-2.5
              text-xs
              sm:text-sm
            "
          >
            <p className="text-blue-700">
              Search result for <span className="font-bold">"{search}"</span>
            </p>

            {searchLoading && (
              <span className="font-semibold text-blue-600">Searching...</span>
            )}
          </div>
        )}

        {/* ==================================================
            NO MEDICINE
        ================================================== */}

        {medicines.length === 0 ? (
          <div
            className="
              flex
              min-h-[45vh]
              items-center
              justify-center
            "
          >
            <div className="text-center">
              <FaCapsules
                className="
                  mx-auto
                  text-6xl
                  text-gray-300
                "
              />

              <h2 className="mt-4 text-2xl font-black text-gray-700">
                No Medicine Found
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {search
                  ? `No medicine found for "${search}"`
                  : "There are no medicines available."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* =================================================
                MOBILE VIEW
                ONE CARD PER ROW
            ================================================= */}

            <div className="space-y-3 lg:hidden">
              {medicines.map((medicine) => {
                const stock = Number(medicine.stock) || 0;

                const quantity = getQuantity(medicine);

                const isOutOfStock = stock <= 0;

                const sellingPrice = Number(medicine.sellingPrice) || 0;

                const mrpPrice = Number(medicine.mrpePrice) || 0;

                const discount = Number(medicine.bikriPercent) || 0;

                return (
                  <div
                    key={medicine._id}
                    className="
                      group
                      flex
                      w-full
                      overflow-hidden
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      shadow-sm
                      transition-all
                      duration-300
                      hover:shadow-md
                    "
                  >
                    {/* ========================================
                        MOBILE IMAGE
                    ======================================== */}

                    <div
                      className="
                        relative
                        w-28
                        shrink-0
                        sm:w-36
                      "
                    >
                      <img
                        src={medicine.image || medisin}
                        alt={medicine.medicineName || "Medicine"}
                        className="
                          h-full
                          min-h-[175px]
                          w-full
                          object-cover
                          transition
                          duration-500
                          group-hover:scale-105
                        "
                      />

                      {/* CATEGORY */}

                      <span
                        className="
                          absolute
                          left-2
                          top-2
                          max-w-[90%]
                          truncate
                          rounded-full
                          bg-blue-600
                          px-2
                          py-1
                          text-[8px]
                          font-bold
                          text-white
                          shadow
                          sm:text-[9px]
                        "
                      >
                        {medicine.category || "Medicine"}
                      </span>

                      {/* STOCK */}

                      <span
                        className={`absolute bottom-2 left-2 rounded-full px-2 py-1 text-[8px] font-bold text-white shadow sm:text-[9px] ${
                          stock > 10
                            ? "bg-green-600"
                            : stock > 0
                              ? "bg-yellow-500"
                              : "bg-red-600"
                        }`}
                      >
                        {stock > 0 ? `Stock ${stock}` : "Out"}
                      </span>

                      {/* OUT OF STOCK */}

                      {isOutOfStock && (
                        <div
                          className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            bg-black/45
                          "
                        >
                          <span
                            className="
                              flex
                              items-center
                              gap-1
                              rounded-md
                              bg-red-600
                              px-2
                              py-1
                              text-[8px]
                              font-black
                              text-white
                              sm:text-[9px]
                            "
                          >
                            <FaExclamationTriangle />
                            OUT OF STOCK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ========================================
                        MOBILE CONTENT
                    ======================================== */}

                    <div className="min-w-0 flex-1 p-3">
                      {/* NAME */}

                      <h2
                        className="
                          truncate
                          text-sm
                          font-black
                          leading-5
                          text-gray-800
                          sm:text-base
                        "
                      >
                        {medicine.medicineName || "Unknown Medicine"}
                      </h2>

                      {/* GENERIC */}

                      {medicine.genericName && (
                        <p
                          className="
                            mt-0.5
                            truncate
                            text-[9px]
                            text-blue-600
                            sm:text-[10px]
                          "
                        >
                          {medicine.genericName}
                        </p>
                      )}

                      {/* COMPANY */}

                      <p
                        className="
                          mt-0.5
                          truncate
                          text-[9px]
                          text-gray-500
                          sm:text-[10px]
                        "
                      >
                        {medicine.company || "N/A"}
                      </p>

                      {/* ======================================
                          PRICE BOX
                      ====================================== */}

                      <div
                        className="
                          mt-2
                          rounded-lg
                          bg-gray-50
                          p-2
                          sm:p-2.5
                        "
                      >
                        {/* MRP */}

                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="
                              text-[9px]
                              font-medium
                              text-gray-500
                              sm:text-[10px]
                            "
                          >
                            MRP
                          </span>

                          <span
                            className="
                              text-[9px]
                              text-gray-400
                              line-through
                              sm:text-[10px]
                            "
                          >
                            ৳ {mrpPrice.toFixed(2)}
                          </span>
                        </div>

                        {/* DISCOUNT */}

                        <div
                          className="
                            mt-1
                            flex
                            items-center
                            justify-between
                            gap-2
                          "
                        >
                          <span
                            className="
                              text-[9px]
                              font-medium
                              text-gray-500
                              sm:text-[10px]
                            "
                          >
                            Discount
                          </span>

                          <span
                            className="
                              rounded-full
                              bg-red-100
                              px-2
                              py-0.5
                              text-[8px]
                              font-bold
                              text-red-600
                              sm:text-[9px]
                            "
                          >
                            {discount}% OFF
                          </span>
                        </div>

                        {/* SELLING */}

                        <div
                          className="
                            mt-1
                            flex
                            items-center
                            justify-between
                            gap-2
                            border-t
                            border-gray-200
                            pt-1.5
                          "
                        >
                          <span
                            className="
                              text-[9px]
                              font-bold
                              text-gray-600
                              sm:text-[10px]
                            "
                          >
                            Selling Price
                          </span>

                          <span
                            className="
                              text-base
                              font-black
                              text-green-600
                              sm:text-lg
                            "
                          >
                            ৳ {sellingPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* ======================================
                          ACTION ROW
                      ====================================== */}

                      <div
                        className="
                          mt-2
                          flex
                          items-center
                          gap-2
                          sm:mt-3
                        "
                      >
                        {/* QUANTITY */}

                        <div className="flex shrink-0 items-center gap-1">
                          {/* MINUS */}

                          <button
                            type="button"
                            onClick={() => decreaseQty(medicine)}
                            disabled={isOutOfStock || quantity <= 1}
                            className="
                              flex
                              h-7
                              w-7
                              items-center
                              justify-center
                              rounded-full
                              bg-red-500
                              text-[9px]
                              font-bold
                              text-white
                              transition
                              hover:bg-red-600
                              disabled:cursor-not-allowed
                              disabled:bg-gray-300
                              sm:h-8
                              sm:w-8
                            "
                          >
                            <FaMinus />
                          </button>

                          {/* NUMBER */}

                          <span
                            className="
                              flex
                              h-7
                              min-w-8
                              items-center
                              justify-center
                              rounded-md
                              border
                              border-gray-200
                              bg-gray-50
                              px-1
                              text-xs
                              font-black
                              text-gray-700
                              sm:h-8
                              sm:min-w-9
                            "
                          >
                            {quantity}
                          </span>

                          {/* PLUS */}

                          <button
                            type="button"
                            onClick={() => increaseQty(medicine)}
                            disabled={isOutOfStock || quantity >= stock}
                            className="
                              flex
                              h-7
                              w-7
                              items-center
                              justify-center
                              rounded-full
                              bg-green-600
                              text-[9px]
                              font-bold
                              text-white
                              transition
                              hover:bg-green-700
                              disabled:cursor-not-allowed
                              disabled:bg-gray-400
                              sm:h-8
                              sm:w-8
                            "
                          >
                            <FaPlus />
                          </button>
                        </div>

                        {/* ADD TO CART */}

                        <button
                          type="button"
                          onClick={() => handleAddToCart(medicine)}
                          disabled={isOutOfStock}
                          className="
                            flex
                            min-w-0
                            flex-1
                            items-center
                            justify-center
                            gap-1.5
                            rounded-lg
                            bg-blue-600
                            px-2
                            py-1.5
                            text-[9px]
                            font-bold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-blue-700
                            disabled:cursor-not-allowed
                            disabled:bg-gray-400
                            sm:py-2
                            sm:text-[10px]
                          "
                        >
                          <FaShoppingCart />

                          {isOutOfStock ? "Out of Stock" : "Add To Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                DESKTOP VIEW
            ================================================= */}

            <div className="hidden gap-5 lg:grid lg:grid-cols-4">
              {medicines.map((medicine) => {
                const stock = Number(medicine.stock) || 0;

                const quantity = quantities[medicine._id] || 1;

                const isOutOfStock = stock <= 0;

                const sellingPrice = Number(medicine.sellingPrice) || 0;

                const mrpPrice = Number(medicine.mrpePrice) || 0;

                const discount = Number(medicine.bikriPercent) || 0;

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
                    {/* IMAGE */}

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

                      {/* CATEGORY */}

                      <span
                        className="
                          absolute
                          left-3
                          top-3
                          rounded-full
                          bg-blue-600
                          px-3
                          py-1
                          text-xs
                          font-bold
                          text-white
                        "
                      >
                        {medicine.category || "Medicine"}
                      </span>

                      {/* STOCK */}

                      <span
                        className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white ${
                          stock > 10
                            ? "bg-green-600"
                            : stock > 0
                              ? "bg-yellow-500"
                              : "bg-red-600"
                        }`}
                      >
                        {stock > 0 ? `Stock ${stock}` : "Out of Stock"}
                      </span>

                      {/* OUT */}

                      {isOutOfStock && (
                        <div
                          className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            bg-black/40
                          "
                        >
                          <span
                            className="
                              rounded-lg
                              bg-red-600
                              px-5
                              py-3
                              font-bold
                              text-white
                            "
                          >
                            OUT OF STOCK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="p-5">
                      {/* NAME */}

                      <h2
                        className="
                          line-clamp-1
                          text-xl
                          font-bold
                          text-gray-800
                        "
                      >
                        {medicine.medicineName || "Unknown Medicine"}
                      </h2>

                      {/* GENERIC */}

                      {medicine.genericName && (
                        <p className="mt-1 text-xs text-blue-600">
                          {medicine.genericName}
                        </p>
                      )}

                      {/* COMPANY */}

                      <p className="mt-1 text-sm text-gray-500">
                        {medicine.company || "N/A"}
                      </p>

                      {/* PRICE BOX */}

                      <div
                        className="
                          mt-4
                          rounded-xl
                          bg-gray-50
                          p-4
                        "
                      >
                        {/* MRP */}

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">MRP</span>

                          <span className="text-gray-400 line-through">
                            ৳ {mrpPrice.toFixed(2)}
                          </span>
                        </div>

                        {/* DISCOUNT */}

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-gray-600">Discount</span>

                          <span
                            className="
                              rounded-full
                              bg-red-100
                              px-3
                              py-1
                              text-sm
                              font-bold
                              text-red-600
                            "
                          >
                            {discount}% OFF
                          </span>
                        </div>

                        {/* SELLING */}

                        <div
                          className="
                            mt-3
                            flex
                            items-center
                            justify-between
                            border-t
                            pt-3
                          "
                        >
                          <span className="font-semibold text-gray-700">
                            Selling Price
                          </span>

                          <span className="text-2xl font-black text-green-600">
                            ৳ {sellingPrice.toFixed(2)}
                          </span>
                        </div>

                        {/* STOCK */}

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

                      {/* QUANTITY */}

                      <div className="mt-5 flex items-center justify-center gap-4">
                        <button
                          type="button"
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
                            text-white
                            transition
                            hover:bg-red-600
                            disabled:cursor-not-allowed
                            disabled:bg-gray-300
                          "
                        >
                          <FaMinus />
                        </button>

                        <span
                          className="
                            flex
                            h-10
                            w-12
                            items-center
                            justify-center
                            rounded-lg
                            border
                            bg-gray-50
                            font-bold
                          "
                        >
                          {quantity}
                        </span>

                        <button
                          type="button"
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
                            text-white
                            transition
                            hover:bg-green-700
                            disabled:cursor-not-allowed
                            disabled:bg-gray-400
                          "
                        >
                          <FaPlus />
                        </button>
                      </div>

                      {/* ADD CART */}

                      <button
                        type="button"
                        onClick={() => handleAddToCart(medicine)}
                        disabled={isOutOfStock}
                        className="
                          mt-5
                          flex
                          w-full
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-blue-600
                          py-3
                          font-bold
                          text-white
                          transition
                          hover:bg-blue-700
                          disabled:cursor-not-allowed
                          disabled:bg-gray-400
                        "
                      >
                        <FaShoppingCart />

                        {isOutOfStock ? "Out of Stock" : "Add To Cart"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AllItemMedicine;
