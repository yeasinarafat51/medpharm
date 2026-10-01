import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

const API = "https://medpharm-server-3.onrender.com";

const companies = [
  { name: "All Medicines", value: "" },
  { name: "Square", value: "Square" },
  { name: "Unimed Unihealth", value: "Unimed Unihealth" },
  { name: "Aci", value: "Aci" },
  { name: "Opsonin", value: "Opsonin" },
  { name: "Popular", value: "Popular" },
  { name: "Ibn-Sina", value: "Ibnsina" },
  { name: "SKF", value: "SKF" },
  { name: "Radiant", value: "Radiant" },
  { name: "Aristopharma", value: "Aristopharma" },
];

// ইন-মেমোরি ও লোকাল ক্যাশ হেল্পার (যাতে ০ সেকেন্ডে ডাটা দেখায়)
const MEMORY_CACHE = new Map();

const getCachedData = (key) => {
  if (MEMORY_CACHE.has(key)) return MEMORY_CACHE.get(key);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      MEMORY_CACHE.set(key, parsed);
      return parsed;
    }
  } catch (e) {
    console.warn("Cache read error", e);
  }
  return null;
};

const setCachedData = (key, data) => {
  MEMORY_CACHE.set(key, data);
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Cache write error", e);
  }
};

const AllMedicine = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [company, setCompany] = useState("");
  const [sort, setSort] = useState("asc");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 8;
  const abortControllerRef = useRef(null);

  // =========================================================
  // ১. সার্ভারকে সজাগ রাখার অটো-পিং (Keep Server Awake)
  // =========================================================
  useEffect(() => {
    const keepAlive = setInterval(
      () => {
        axios.get(`${API}/api/medicines?limit=1`).catch(() => {});
      },
      4 * 60 * 1000,
    );

    return () => clearInterval(keepAlive);
  }, []);

  // =========================================================
  // ২. লেখার সাথে সাথে লাইভ সার্চ (Debounce: 250ms) - রিলোড ছাড়া
  // =========================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  // =========================================================
  // ৩. সুপার-ফাস্ট ডাটা লোড (Instant Cache + Background Fetch)
  // =========================================================
  const loadMedicine = async (forceRefresh = false) => {
    const cacheKey = `meds_v2_${debouncedSearch.trim()}_${company.trim()}_${page}_${sort}_${limit}`;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // স্টেপ ১: ক্যাশে ডাটা থাকলে ০ সেকেন্ডে সাথে সাথে স্ক্রিনে দেখিয়ে দিবে!
    const cached = getCachedData(cacheKey);
    if (cached && !forceRefresh) {
      setMedicines(cached.medicines || []);
      setTotalPages(cached.totalPages || 1);
      setLoading(false);
      setIsSyncing(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        search: debouncedSearch.trim(),
        company: company.trim(),
        page: String(page),
        limit: String(limit),
        sort,
      });

      const response = await axios.get(
        `${API}/api/medicines?${params.toString()}`,
        { signal: controller.signal },
      );

      if (response.data?.success) {
        const meds = response.data.medicines || [];
        const pages =
          Number(response.data.totalPages) > 0
            ? Number(response.data.totalPages)
            : 1;

        setMedicines(meds);
        setTotalPages(pages);

        // ক্যাশে সেভ করে রাখা
        setCachedData(cacheKey, { medicines: meds, totalPages: pages });

        // পরের পেজের ডাটা আগাম লোড করে রাখা (Prefetch Next Page)
        if (page < pages) {
          const nextParams = new URLSearchParams({
            search: debouncedSearch.trim(),
            company: company.trim(),
            page: String(page + 1),
            limit: String(limit),
            sort,
          });
          const nextKey = `meds_v2_${debouncedSearch.trim()}_${company.trim()}_${
            page + 1
          }_${sort}_${limit}`;

          if (!MEMORY_CACHE.has(nextKey)) {
            axios
              .get(`${API}/api/medicines?${nextParams.toString()}`)
              .then((res) => {
                if (res.data?.success) {
                  setCachedData(nextKey, {
                    medicines: res.data.medicines || [],
                    totalPages: pages,
                  });
                }
              })
              .catch(() => {});
          }
        }
      } else if (!cached) {
        setMedicines([]);
        setTotalPages(1);
      }
    } catch (error) {
      if (axios.isCancel(error) || error.name === "CanceledError") return;
      console.error("Medicine Load Error:", error);
      if (!cached) {
        setMedicines([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadMedicine();
  }, [debouncedSearch, company, sort, page]);

  // =========================
  // COMPANY FILTER
  // =========================
  const handleCompanyChange = (companyValue) => {
    setCompany(companyValue);
    setPage(1);
  };

  // =========================
  // DELETE MEDICINE (Optimistic Instant Delete)
  // =========================
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "এই medicine delete করলে আর ফিরে পাওয়া যাবে না!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    const previousMedicines = [...medicines];
    setMedicines((prev) => prev.filter((item) => item._id !== id));

    try {
      const response = await axios.delete(`${API}/api/medicines/${id}`);

      if (response.data?.success) {
        MEMORY_CACHE.clear();
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Medicine successfully deleted.",
          timer: 1200,
          showConfirmButton: false,
        });
        loadMedicine(true);
      } else {
        setMedicines(previousMedicines);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.data?.message || "Delete failed!",
        });
      }
    } catch (error) {
      console.error("Delete Medicine Error:", error);
      setMedicines(previousMedicines);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Medicine delete করা যায়নি!",
      });
    }
  };

  // =========================
  // PAGINATION HANDLERS
  // =========================
  const handlePrevious = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              All Medicines
            </h1>
            {isSyncing && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping"></span>
                Syncing...
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Exact MRP, Bikri Discount (%) & Selling Price overview.
          </p>
        </div>

        <Link
          to="/dashboard/add-medicine"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition"
        >
          <span>+ Add Medicine</span>
        </Link>
      </div>

      {/* COMPANY FILTER BUTTONS */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 mb-5">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Filter By Company
        </h2>
        <div className="flex flex-wrap gap-2">
          {companies.map((companyItem) => (
            <button
              key={companyItem.value || "all"}
              type="button"
              onClick={() => handleCompanyChange(companyItem.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                company === companyItem.value
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {companyItem.name}
            </button>
          ))}
        </div>
      </div>

      {/* LIVE SEARCH & SORT */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 mb-5">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col md:flex-row gap-3 items-center"
        >
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type medicine, company, or generic name to search instantly..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 text-xs">
              🔍
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 bg-slate-200/80 rounded-full h-5 w-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          <div className="w-full md:w-auto">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </div>
        </form>
      </div>

      {/* SELECTED COMPANY BADGE */}
      {company && (
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl w-fit">
          <span>Showing medicines from:</span>
          <b className="text-emerald-700 font-bold">
            {companies.find((item) => item.value === company)?.name || company}
          </b>
          <button
            type="button"
            onClick={() => setCompany("")}
            className="ml-1 text-emerald-800 hover:text-red-600 font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Purchase (৳)</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">
                  MRP (৳)
                </th>
                <th className="px-4 py-3 text-center font-bold text-rose-600">
                  Bikri Discount (%)
                </th>
                <th className="px-4 py-3 text-right font-black text-emerald-700">
                  Selling Price (৳)
                </th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && medicines.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-12">
                    <div className="flex flex-col justify-center items-center gap-2">
                      <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-slate-400">
                        Loading medicines...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-slate-400">
                    <p className="text-base font-bold text-slate-600">
                      No medicines found.
                    </p>
                    {company && (
                      <p className="text-xs text-slate-400 mt-1">
                        এই company-এর কোনো medicine পাওয়া যায়নি।
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                medicines.map((medicine, index) => {
                  const purchasePrice = Number(medicine.purchasePrice || 0);

                  // ১. আসল MRP (mrpePrice ফিল্ড থেকে নেওয়া হচ্ছে)
                  const rawMrp = Number(
                    medicine.mrpePrice ?? medicine.mrp ?? 0,
                  );
                  const rawSelling = Number(medicine.sellingPrice || 0);
                  const rawBikriPercent = Number(
                    medicine.bikriPercent ?? medicine.discount ?? 0,
                  );

                  // ২. MRP যদি সেভ করা থাকে সেটাই দেখাবে, না থাকলে sellingPrice ও bikriPercent থেকে বের করবে
                  const mrpPrice =
                    rawMrp > 0
                      ? rawMrp
                      : rawBikriPercent > 0 && rawSelling > 0
                        ? Number(
                            (rawSelling / (1 - rawBikriPercent / 100)).toFixed(
                              2,
                            ),
                          )
                        : rawSelling;

                  // ৩. কত পার্সেন্ট ডিসকাউন্টে সেল করা হচ্ছে (bikriPercent)
                  const discountVal =
                    rawBikriPercent > 0
                      ? Number(rawBikriPercent.toFixed(2))
                      : mrpPrice > rawSelling && mrpPrice > 0
                        ? Number(
                            (
                              ((mrpPrice - rawSelling) / mrpPrice) *
                              100
                            ).toFixed(2),
                          )
                        : 0;

                  // ৪. ফাইনাল Selling Price
                  const sellingPrice =
                    rawSelling > 0
                      ? rawSelling
                      : mrpPrice > 0 && discountVal > 0
                        ? Number(
                            (mrpPrice - (mrpPrice * discountVal) / 100).toFixed(
                              2,
                            ),
                          )
                        : mrpPrice;

                  return (
                    <tr
                      key={medicine._id}
                      className="hover:bg-slate-50/70 transition"
                    >
                      <td className="px-4 py-3.5 text-slate-400 font-medium">
                        {(page - 1) * limit + index + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              medicine.image ||
                              "https://placehold.co/60x60?text=Medicine"
                            }
                            alt={medicine.medicineName || "Medicine"}
                            loading="lazy"
                            className="w-10 h-10 rounded-xl object-contain border border-slate-100 bg-slate-50 p-1"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://placehold.co/60x60?text=Medicine";
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {medicine.medicineName || "N/A"}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {medicine.genericName || "No generic name"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {medicine.company || "N/A"}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px]">
                          {medicine.category || "General"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-medium text-slate-600">
                        ৳{purchasePrice.toFixed(2)}
                      </td>

                      {/* MRP PRICE (আসল MRP দেখাবে) */}
                      <td className="px-4 py-3.5 text-right font-bold text-slate-700">
                        {mrpPrice > sellingPrice ? (
                          <span className="line-through decoration-slate-400 text-slate-600">
                            ৳{mrpPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span>৳{mrpPrice.toFixed(2)}</span>
                        )}
                      </td>

                      {/* BIKRI PERCENTAGE (কত % ডিসকাউন্টে সেল হচ্ছে) */}
                      <td className="px-4 py-3.5 text-center">
                        {discountVal > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-black text-rose-600">
                            {discountVal}% OFF
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">0%</span>
                        )}
                      </td>

                      {/* SELLING PRICE (কত টাকায় বিক্রি হচ্ছে) */}
                      <td className="px-4 py-3.5 text-right font-black text-emerald-700 text-sm">
                        ৳{sellingPrice.toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            Number(medicine.stock || 0) > 10
                              ? "bg-emerald-100 text-emerald-800"
                              : Number(medicine.stock || 0) > 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {medicine.stock || 0} pcs
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <Link
                            to={`/dashboard/update-medicine/${medicine._id}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(medicine._id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {medicines.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Page <b className="text-slate-800">{page}</b> of{" "}
              <b className="text-slate-800">{totalPages}</b>
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={page === 1}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                  page === 1
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                Previous
              </button>

              <span className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black">
                {page}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={page >= totalPages}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                  page >= totalPages
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
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
