import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaSearch,
  FaCapsules,
  FaBuilding,
} from "react-icons/fa";

import useAuth from "../../../hooks/useAuth";
import useCart from "../../../hooks/useCart";

import medisin from "../../../imges/medpharm_pharmacy.jpg";

function AllItemMedicine() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  // =====================================================
  // API
  // =====================================================

  const API_URL = "https://medpharm-server-sgs6.vercel.app";

  // =====================================================
  // STATES
  // =====================================================

  const [medicines, setMedicines] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchLoading, setSearchLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedCompany, setSelectedCompany] = useState("");

  const [quantities, setQuantities] = useState({});

  const cancelSourceRef = useRef(null);

  // =====================================================
  // COMPANIES
  // =====================================================

  const companies = [
    {
      name: "All Medicines",
      value: "",
    },
    {
      name: "Square",
      value: "Square",
    },
    {
      name: "SKF",
      value: "SKF",
    },
    {
      name: "Radiant",
      value: "Radiant",
    },
    {
      name: "Aristopharma",
      value: "Aristopharma",
    },
  ];

  // =====================================================
  // LOAD MEDICINES
  // =====================================================

  const loadMedicine = async (
    searchValue = "",
    companyValue = selectedCompany,
    isFirstLoad = false,
  ) => {
    // Cancel previous request
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
    }

    const source = axios.CancelToken.source();

    cancelSourceRef.current = source;

    try {
      if (isFirstLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }

      const res = await axios.get(`${API_URL}/api/medicines`, {
        params: {
          search: searchValue.trim(),
          company: companyValue,
          sort: "asc",
        },

        timeout: 30000,

        cancelToken: source.token,
      });

      console.log("Medicine API:", res.data);

      let medicineData = [];

      if (Array.isArray(res.data?.medicines)) {
        medicineData = res.data.medicines;
      } else if (Array.isArray(res.data)) {
        medicineData = res.data;
      }

      setMedicines(medicineData);

      setQuantities({});
    } catch (error) {
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
          "Unable to load medicines.",
      });
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }

      setSearchLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadMedicine("", "", true);

    return () => {
      if (cancelSourceRef.current) {
        cancelSourceRef.current.cancel();
      }
    };
  }, []);

  // =====================================================
  // SEARCH DEBOUNCE
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMedicine(search, selectedCompany, false);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // =====================================================
  // COMPANY CHANGE
  // =====================================================

  const handleCompanyChange = (company) => {
    setSelectedCompany(company);

    setSearch("");

    setQuantities({});

    loadMedicine("", company, false);
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // =====================================================
  // QUANTITY
  // =====================================================

  const getQuantity = (medicine) => {
    return quantities[medicine._id] || 1;
  };

  // =====================================================
  // INCREASE
  // =====================================================

  const increaseQty = (medicine) => {
    const stock = Number(medicine.stock) || 0;

    if (stock <= 0) return;

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

  // =====================================================
  // DECREASE
  // =====================================================

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

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = (medicine) => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Please Login First",
        text: "You need to login before adding medicine to cart.",
        confirmButtonText: "Login",
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

    const quantity = quantities[medicine._id] || 1;

    if (quantity > stock) {
      Swal.fire({
        icon: "warning",
        title: "Not Enough Stock",
        text: `Only ${stock} item available.`,
      });

      return;
    }

    addToCart({
      ...medicine,
      quantity,
    });

    Swal.fire({
      icon: "success",
      title: "Added To Cart",
      text: `${quantity} item added successfully.`,
      timer: 1100,
      showConfirmButton: false,
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <h2 className="mt-4 text-lg font-bold text-slate-700">
            Loading Medicines...
          </h2>

          <p className="mt-1 text-sm text-slate-400">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-5 lg:px-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* TITLE */}

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <FaCapsules className="text-lg" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
                  All Medicines
                </h1>

                <p className="text-xs text-slate-500 sm:text-sm">
                  Find medicines from your favorite pharmaceutical company.
                </p>
              </div>
            </div>

            {/* SEARCH */}

            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search medicine..."
                className="
                  w-full
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  py-3
                  pl-11
                  pr-11
                  text-sm
                  text-slate-700
                  shadow-sm
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              />

              {searchLoading && (
                <div className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            COMPANY BUTTONS
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <FaBuilding className="text-blue-600" />

            <h2 className="text-sm font-bold text-slate-700">
              Pharmaceutical Companies
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {companies.map((company) => {
              const active = selectedCompany === company.value;

              return (
                <button
                  key={company.value || "all"}
                  type="button"
                  onClick={() => handleCompanyChange(company.value)}
                  className={`
                    shrink-0
                    rounded-xl
                    px-4
                    py-2.5
                    text-xs
                    font-bold
                    transition-all
                    duration-200
                    sm:px-5
                    sm:text-sm
                    ${
                      active
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    }
                  `}
                >
                  {company.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================
            CURRENT FILTER
        ================================================= */}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div>
            <p className="text-xs text-blue-500">Showing medicines from</p>

            <p className="text-sm font-black text-blue-700">
              {selectedCompany || "All Companies"}
            </p>
          </div>

          <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
            {medicines.length} Medicines
          </div>
        </div>

        {/* =================================================
            NO MEDICINE
        ================================================= */}

        {medicines.length === 0 ? (
          <div className="flex min-h-[45vh] items-center justify-center">
            <div className="text-center">
              <FaCapsules className="mx-auto text-6xl text-slate-300" />

              <h2 className="mt-4 text-2xl font-black text-slate-700">
                No Medicine Found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {selectedCompany
                  ? `No medicine found for ${selectedCompany}.`
                  : search
                    ? `No medicine found for "${search}".`
                    : "There are no medicines available."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* =================================================
                MOBILE
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
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      shadow-sm
                      transition
                      duration-300
                      hover:shadow-md
                    "
                  >
                    {/* IMAGE */}

                    <div className="relative w-28 shrink-0 sm:w-36">
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

                      <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[8px] font-bold text-white shadow sm:text-[9px]">
                        {medicine.category || "Medicine"}
                      </span>

                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                          <span className="rounded-lg bg-red-600 px-2 py-1 text-[8px] font-black text-white">
                            OUT OF STOCK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="min-w-0 flex-1 p-3">
                      <h2 className="truncate text-sm font-black text-slate-800 sm:text-base">
                        {medicine.medicineName || "Unknown Medicine"}
                      </h2>

                      {medicine.genericName && (
                        <p className="mt-0.5 truncate text-[9px] text-blue-600 sm:text-[10px]">
                          {medicine.genericName}
                        </p>
                      )}

                      <p className="mt-0.5 truncate text-[9px] text-slate-500 sm:text-[10px]">
                        {medicine.company || "N/A"}
                      </p>

                      {/* PRICE */}

                      <div className="mt-2 rounded-xl bg-slate-50 p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-500">MRP</span>

                          <span className="text-[9px] text-slate-400 line-through">
                            ৳ {mrpPrice.toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[9px] text-slate-500">
                            Discount
                          </span>

                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[8px] font-bold text-red-600">
                            {discount}% OFF
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-1.5">
                          <span className="text-[9px] font-bold text-slate-600">
                            Price
                          </span>

                          <span className="text-base font-black text-green-600 sm:text-lg">
                            ৳ {sellingPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* ACTION */}

                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex shrink-0 items-center gap-1">
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
                              text-white
                              transition
                              hover:bg-red-600
                              disabled:bg-slate-300
                            "
                          >
                            <FaMinus />
                          </button>

                          <span className="flex h-7 min-w-8 items-center justify-center rounded-lg border bg-slate-50 px-1 text-xs font-black text-slate-700">
                            {quantity}
                          </span>

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
                              text-white
                              transition
                              hover:bg-green-700
                              disabled:bg-slate-300
                            "
                          >
                            <FaPlus />
                          </button>
                        </div>

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
                            transition
                            hover:bg-blue-700
                            disabled:bg-slate-400
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
                DESKTOP
            ================================================= */}

            <div className="hidden gap-5 lg:grid lg:grid-cols-4">
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
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-200
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
                          h-52
                          w-full
                          object-cover
                          transition
                          duration-500
                          hover:scale-110
                        "
                      />

                      <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                        {medicine.category || "Medicine"}
                      </span>

                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white">
                            OUT OF STOCK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="p-4">
                      <h2 className="line-clamp-1 text-lg font-black text-slate-800">
                        {medicine.medicineName || "Unknown Medicine"}
                      </h2>

                      {medicine.genericName && (
                        <p className="mt-1 line-clamp-1 text-xs text-blue-600">
                          {medicine.genericName}
                        </p>
                      )}

                      <p className="mt-1 text-sm text-slate-500">
                        {medicine.company || "N/A"}
                      </p>

                      {/* PRICE */}

                      <div className="mt-3 rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">MRP</span>

                          <span className="text-xs text-slate-400 line-through">
                            ৳ {mrpPrice.toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            Discount
                          </span>

                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-600">
                            {discount}% OFF
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                          <span className="text-sm font-bold text-slate-700">
                            Price
                          </span>

                          <span className="text-xl font-black text-green-600">
                            ৳ {sellingPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* QUANTITY */}

                      <div className="mt-4 flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => decreaseQty(medicine)}
                          disabled={isOutOfStock || quantity <= 1}
                          className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-full
                            bg-red-500
                            text-white
                            transition
                            hover:bg-red-600
                            disabled:bg-slate-300
                          "
                        >
                          <FaMinus />
                        </button>

                        <span className="flex h-9 w-12 items-center justify-center rounded-lg border bg-slate-50 font-bold text-slate-700">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => increaseQty(medicine)}
                          disabled={isOutOfStock || quantity >= stock}
                          className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-full
                            bg-green-600
                            text-white
                            transition
                            hover:bg-green-700
                            disabled:bg-slate-300
                          "
                        >
                          <FaPlus />
                        </button>
                      </div>

                      {/* CART */}

                      <button
                        type="button"
                        onClick={() => handleAddToCart(medicine)}
                        disabled={isOutOfStock}
                        className="
                          mt-4
                          flex
                          w-full
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-blue-600
                          py-3
                          text-sm
                          font-bold
                          text-white
                          shadow-md
                          transition
                          hover:bg-blue-700
                          hover:shadow-lg
                          disabled:bg-slate-400
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
