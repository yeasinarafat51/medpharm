import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  FaMinus,
  FaPlus,
  FaSearch,
  FaCapsules,
  FaBuilding,
  FaChevronDown,
  FaRegHeart,
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
  const API_URL = "https://medpharm-server-3.onrender.com";

  // =====================================================
  // STATES
  // =====================================================
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [quantities, setQuantities] = useState({});

  // ⚡ প্রথমে ১২টি প্রোডাক্ট দেখানোর জন্য লিমিট (৩ ও ৪ কলামের জন্য পারফেক্ট গ্রিড)
  const [visibleLimit, setVisibleLimit] = useState(12);

  const cancelSourceRef = useRef(null);

  // =====================================================
  // COMPANIES
  // =====================================================
  const companies = [
    { name: "All Medicines", value: "" },
    { name: "Square", value: "Square" },
    { name: "Aci", value: "Aci" },
    { name: "Popular", value: "Popular" },
    { name: "Ibn-Sina", value: "Ibnsina" },
    { name: "Opsonin", value: "Opsonin" },
    { name: "SKF", value: "SKF" },
    { name: "Radiant", value: "Radiant" },
    { name: "Aristopharma", value: "Aristopharma" },
  ];

  // =====================================================
  // LOAD MEDICINES
  // =====================================================
  const loadMedicine = async (
    searchValue = "",
    companyValue = selectedCompany,
    isFirstLoad = false,
  ) => {
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

      let medicineData = [];
      if (Array.isArray(res.data?.medicines)) {
        medicineData = res.data.medicines;
      } else if (Array.isArray(res.data)) {
        medicineData = res.data;
      }

      setMedicines(medicineData);
      setQuantities({});
      // নতুন সার্চ বা কোম্পানি ফিল্টারে আবার ১২টিতে রিসেট
      setVisibleLimit(12);
    } catch (error) {
      if (axios.isCancel(error)) return;

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

    return () => clearTimeout(timer);
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

  const increaseQty = (medicine) => {
    const stock = Number(medicine.stock) || 0;
    if (stock <= 0) return;

    setQuantities((prev) => {
      const current = prev[medicine._id] || 1;
      if (current >= stock) return prev;
      return { ...prev, [medicine._id]: current + 1 };
    });
  };

  const decreaseQty = (medicine) => {
    setQuantities((prev) => {
      const current = prev[medicine._id] || 1;
      if (current <= 1) return prev;
      return { ...prev, [medicine._id]: current - 1 };
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
  // SEE MORE (সব প্রোডাক্ট লোড হবে)
  // =====================================================
  const handleSeeMore = () => {
    setVisibleLimit(medicines.length);
  };

  // দৃশ্যমান প্রোডাক্ট ফিল্টার (প্রথমে ১২টি)
  const displayedMedicines = medicines.slice(0, visibleLimit);

  // =====================================================
  // LOADING STATE
  // =====================================================
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
          <h2 className="mt-4 text-lg font-bold text-slate-700">
            Loading Medicines...
          </h2>
          <p className="mt-1 text-sm text-slate-400">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="mx-auto max-w-7xl px-2 py-4 sm:px-4 lg:px-6">
        {/* =================================================
            HEADER
        ================================================= */}
        <div className="mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                <FaCapsules className="text-base" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800 sm:text-2xl">
                  Medicines
                </h1>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Find genuine medicines from top pharmaceutical companies.
                </p>
              </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search medicine..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-xs text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:text-sm"
              />
              {searchLoading && (
                <div className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            COMPANY BUTTONS
        ================================================= */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <FaBuilding className="text-emerald-600 text-xs" />
            <h2 className="text-xs font-bold text-slate-700">Companies</h2>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {companies.map((company) => {
              const active = selectedCompany === company.value;
              return (
                <button
                  key={company.value || "all"}
                  type="button"
                  onClick={() => handleCompanyChange(company.value)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 sm:px-4 sm:py-2 sm:text-xs ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                  }`}
                >
                  {company.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================
            CURRENT FILTER & COUNT
        ================================================= */}
        <div className="mb-3 flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2">
          <p className="text-[11px] font-semibold text-emerald-800">
            {selectedCompany ? `Company: ${selectedCompany}` : "All Companies"}
          </p>
          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-xs">
            Showing {displayedMedicines.length} of {medicines.length}
          </span>
        </div>

        {/* =================================================
            NO MEDICINE
        ================================================= */}
        {medicines.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center">
              <FaCapsules className="mx-auto text-5xl text-slate-300" />
              <h2 className="mt-3 text-lg font-bold text-slate-700">Waiting</h2>
              <p className="mt-1 text-xs text-slate-500">
                {selectedCompany
                  ? `Wating ${selectedCompany}.`
                  : search
                    ? `Loading "${search}".`
                    : " medicines available."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* =================================================
                📱 MOBILE 3-COLUMN GRID (প্রথমে ১২টি প্রোডাক্ট)
            ================================================= */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:hidden">
              {displayedMedicines.map((medicine) => {
                const stock = Number(medicine.stock) || 0;
                const isOutOfStock = stock <= 0;
                const sellingPrice = Number(medicine.sellingPrice) || 0;
                const mrpPrice = Number(medicine.mrpePrice) || 0;
                const discount =
                  Number(medicine.bikriPercent) ||
                  (mrpPrice > sellingPrice && mrpPrice > 0
                    ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
                    : 0);

                return (
                  <div
                    key={medicine._id}
                    className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition hover:shadow-md"
                  >
                    <div>
                      {/* TOP BADGE & WISHLIST */}
                      <div className="relative mb-1 flex h-6 items-center justify-between">
                        {discount > 0 ? (
                          <span className="rounded bg-[#22c55e] px-1.5 py-0.5 text-[8px] font-extrabold text-white">
                            {discount}% OFF
                          </span>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          className="text-slate-400 hover:text-red-500"
                        >
                          <FaRegHeart className="text-[11px]" />
                        </button>
                      </div>

                      {/* IMAGE */}
                      <div className="relative mb-1.5 flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                        <img
                          src={medicine.image || medisin}
                          alt={medicine.medicineName || "Medicine"}
                          className="h-full w-full object-contain p-1 transition-transform duration-300 hover:scale-105"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <span className="rounded bg-red-600 px-1 py-0.5 text-[7px] font-black text-white">
                              STOCK OUT
                            </span>
                          </div>
                        )}
                      </div>

                      {/* TITLE (Max 2 lines) */}
                      <h3 className="line-clamp-2 min-h-[28px] text-[10px] font-bold leading-tight text-slate-800">
                        {medicine.medicineName || "Unknown Medicine"}
                      </h3>

                      {/* PRICE SECTION */}
                      <div className="mt-1 flex flex-wrap items-baseline gap-1">
                        <span className="text-[11px] font-black text-[#0d9488]">
                          ৳{sellingPrice.toFixed(2)}
                        </span>
                        {mrpPrice > sellingPrice && (
                          <span className="text-[9px] text-slate-400 line-through">
                            ৳{mrpPrice.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ADD TO CART BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(medicine)}
                      disabled={isOutOfStock}
                      className="mt-2 w-full rounded-lg bg-[#22c55e] py-1.5 text-[9px] font-bold text-white shadow-xs transition hover:bg-[#16a34a] active:scale-95 disabled:bg-slate-300"
                    >
                      {isOutOfStock ? "Stock Out" : "Add to Cart"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                💻 DESKTOP 4-COLUMN GRID (প্রথমে ১২টি প্রোডাক্ট)
            ================================================= */}
            <div className="hidden gap-5 lg:grid lg:grid-cols-4">
              {displayedMedicines.map((medicine) => {
                const stock = Number(medicine.stock) || 0;
                const quantity = getQuantity(medicine);
                const isOutOfStock = stock <= 0;
                const sellingPrice = Number(medicine.sellingPrice) || 0;
                const mrpPrice = Number(medicine.mrpePrice) || 0;
                const discount = Number(medicine.bikriPercent) || 0;

                return (
                  <div
                    key={medicine._id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* IMAGE */}
                    <div className="relative overflow-hidden">
                      <img
                        src={medicine.image || medisin}
                        alt={medicine.medicineName || "Medicine"}
                        className="h-52 w-full object-cover transition duration-500 hover:scale-110"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
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
                        <p className="mt-1 line-clamp-1 text-xs text-emerald-600">
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
                          <span className="text-xl font-black text-emerald-600">
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
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600 disabled:bg-slate-300"
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
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                        >
                          <FaPlus />
                        </button>
                      </div>

                      {/* CART */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(medicine)}
                        disabled={isOutOfStock}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg disabled:bg-slate-400"
                      >
                        {isOutOfStock ? "Out of Stock" : "Add To Cart"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                SEE MORE BUTTON (১২টির বেশি মেডিসিন থাকলে দেখাবে)
            ================================================= */}
            {visibleLimit < medicines.length && (
              <div className="mt-8 flex flex-col items-center justify-center pb-6">
                <button
                  type="button"
                  onClick={handleSeeMore}
                  className="
                    group
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-emerald-600
                    px-6
                    py-2.5
                    text-xs
                    font-bold
                    text-white
                    shadow-md
                    shadow-emerald-200
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:bg-emerald-700
                    hover:shadow-emerald-300
                    active:scale-95
                    sm:text-sm
                  "
                >
                  <span>See More</span>
                  <FaChevronDown className="transition-transform duration-300 group-hover:translate-y-0.5 text-xs" />
                </button>
                <p className="mt-1.5 text-[10px] text-slate-400 sm:text-xs">
                  Click to view all {medicines.length} medicines
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AllItemMedicine;
