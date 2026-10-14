import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

// ইন-মেমোরি ও লোকাল ক্যাশ হেল্পার
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
  const location = useLocation();
  const navigate = useNavigate();

  // =========================================================================
  // ১. আগের সার্চ, কোম্পানি, পেজ ও লাস্ট এডিট আইডি রিকভার (State & Session)
  // =========================================================================
  const savedSearch =
    location.state?.search ??
    sessionStorage.getItem("novacare_admin_med_search") ??
    "";
  const savedCompany =
    location.state?.company ??
    sessionStorage.getItem("novacare_admin_med_company") ??
    "";
  const savedSort =
    location.state?.sort ??
    sessionStorage.getItem("novacare_admin_med_sort") ??
    "asc";
  const savedPage =
    Number(
      location.state?.page ??
        sessionStorage.getItem("novacare_admin_med_page") ??
        1,
    ) || 1;

  // কোন মেডিসিনটি এইমাত্র এডিট করা হয়েছে
  const [lastEditedId, setLastEditedId] = useState(
    location.state?.lastEditedId ??
      sessionStorage.getItem("novacare_admin_last_edited_id") ??
      null,
  );

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // সার্চ স্টেট (আগের সার্চ অক্ষুণ্ণ থাকবে)
  const [search, setSearch] = useState(savedSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(savedSearch);
  const [company, setCompany] = useState(savedCompany);
  const [sort, setSort] = useState(savedSort);

  const [page, setPage] = useState(savedPage);
  const [totalPages, setTotalPages] = useState(1);

  // কুইক এডিট মোডাল স্টেট (পেইজ না ছেড়ে সরাসরি টেবিল থেকে এডিটের সুবিধা)
  const [quickEditMed, setQuickEditMed] = useState(null);
  const [quickEditForm, setQuickEditForm] = useState({
    medicineName: "",
    genericName: "",
    company: "",
    purchasePrice: 0,
    mrpePrice: 0,
    bikriPercent: 0,
    sellingPrice: 0,
    stock: 0,
  });
  const [isUpdatingQuick, setIsUpdatingQuick] = useState(false);

  const limit = 8;
  const abortControllerRef = useRef(null);

  // =========================================================================
  // ২. সার্চ ও ফিল্টার পরিবর্তন হলেই সেশন স্টোরেজে সংরক্ষণ (যাতে ফিরে এলে ঠিক থাকে)
  // =========================================================================
  useEffect(() => {
    sessionStorage.setItem("novacare_admin_med_search", debouncedSearch);
    sessionStorage.setItem("novacare_admin_med_company", company);
    sessionStorage.setItem("novacare_admin_med_page", String(page));
    sessionStorage.setItem("novacare_admin_med_sort", sort);
  }, [debouncedSearch, company, page, sort]);

  // =========================================================================
  // ৩. সার্ভারকে সজাগ রাখার অটো-পিং (Keep Server Awake)
  // =========================================================================
  useEffect(() => {
    const keepAlive = setInterval(
      () => {
        axios.get(API + "/api/medicines?limit=1").catch(() => {});
      },
      4 * 60 * 1000,
    );

    return () => clearInterval(keepAlive);
  }, []);

  // =========================================================================
  // ৪. লেখার সাথে সাথে লাইভ সার্চ (Debounce: 250ms)
  // =========================================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== debouncedSearch) {
        setDebouncedSearch(search);
        setPage(1);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  // =========================================================================
  // ৫. সুপার-ফাস্ট ডাটা লোড (Instant Cache + Background Fetch)
  // =========================================================================
  const loadMedicine = async (forceRefresh = false) => {
    const cacheKey =
      "meds_v2_" +
      debouncedSearch.trim() +
      "_" +
      company.trim() +
      "_" +
      page +
      "_" +
      sort +
      "_" +
      limit;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const cached = getCachedData(cacheKey);
    // যদি এডিট হয়ে ফিরে আসে, তবে ক্যাশ এড়িয়ে সরাসরি ফ্রেশ ডাটা আনা হবে
    if (cached && !forceRefresh && !lastEditedId) {
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
        API + "/api/medicines?" + params.toString(),
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

        // পরের পেজের ডাটা আগাম লোড করে রাখা (Prefetch)
        if (page < pages) {
          const nextParams = new URLSearchParams({
            search: debouncedSearch.trim(),
            company: company.trim(),
            page: String(page + 1),
            limit: String(limit),
            sort,
          });
          const nextKey =
            "meds_v2_" +
            debouncedSearch.trim() +
            "_" +
            company.trim() +
            "_" +
            (page + 1) +
            "_" +
            sort +
            "_" +
            limit;

          if (!MEMORY_CACHE.has(nextKey)) {
            axios
              .get(API + "/api/medicines?" + nextParams.toString())
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
    const isReturningFromEdit = Boolean(lastEditedId);
    loadMedicine(isReturningFromEdit);
  }, [debouncedSearch, company, sort, page]);

  // =========================================================================
  // ৬. এডিট করার পর স্বয়ংক্রিয়ভাবে সেই ওষুধে স্ক্রল ও হাইলাইট (Auto-Scroll & Glow)
  // =========================================================================
  useEffect(() => {
    if (!lastEditedId || medicines.length === 0) return;

    const timer = setTimeout(() => {
      const targetElement = document.getElementById(
        "medicine-row-" + lastEditedId,
      );
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // ৫ সেকেন্ড পর হাইলাইট আস্তে আস্তে মুছে দেওয়া
        const clearTimer = setTimeout(() => {
          setLastEditedId(null);
          sessionStorage.removeItem("novacare_admin_last_edited_id");
        }, 5000);

        return () => clearTimeout(clearTimer);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [medicines, lastEditedId]);

  // =========================
  // COMPANY FILTER
  // =========================
  const handleCompanyChange = (companyValue) => {
    setCompany(companyValue);
    setPage(1);
  };

  // সার্চ ও ফিল্টার ক্লিয়ার বাটন
  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCompany("");
    setPage(1);
    sessionStorage.removeItem("novacare_admin_med_search");
    sessionStorage.removeItem("novacare_admin_med_company");
    sessionStorage.removeItem("novacare_admin_med_page");
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
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    const previousMedicines = [...medicines];
    setMedicines((prev) => prev.filter((item) => item._id !== id));

    try {
      const response = await axios.delete(API + "/api/medicines/" + id);

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

  // =========================================================================
  // ৭. কুইক এডিট মোডাল ওপেন ও সেভ (পেজ ত্যাগ না করেই দ্রুত এডিট)
  // =========================================================================
  const handleOpenQuickEdit = (med) => {
    setQuickEditMed(med);
    const purchase = Number(med.purchasePrice || 0);
    const mrp = Number(med.mrpePrice ?? med.mrp ?? 0);
    const bikri = Number(med.bikriPercent ?? med.discount ?? 0);
    const selling = Number(
      med.sellingPrice || (mrp > 0 ? mrp - (mrp * bikri) / 100 : 0),
    );

    setQuickEditForm({
      medicineName: med.medicineName || "",
      genericName: med.genericName || "",
      company: med.company || "",
      purchasePrice: purchase,
      mrpePrice: mrp,
      bikriPercent: bikri,
      sellingPrice: selling,
      stock: Number(med.stock || 0),
    });
  };

  const handleQuickEditChange = (field, value) => {
    setQuickEditForm((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "mrpePrice" || field === "bikriPercent") {
        const mrp =
          parseFloat(field === "mrpePrice" ? value : updated.mrpePrice) || 0;
        const bikri =
          parseFloat(field === "bikriPercent" ? value : updated.bikriPercent) ||
          0;
        if (mrp > 0) {
          updated.sellingPrice = parseFloat(
            (mrp - (mrp * bikri) / 100).toFixed(2),
          );
        }
      }
      return updated;
    });
  };

  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    if (!quickEditMed) return;

    try {
      setIsUpdatingQuick(true);
      const payload = {
        medicineName: quickEditForm.medicineName,
        genericName: quickEditForm.genericName,
        company: quickEditForm.company,
        purchasePrice: Number(quickEditForm.purchasePrice) || 0,
        mrpePrice: Number(quickEditForm.mrpePrice) || 0,
        bikriPercent: Number(quickEditForm.bikriPercent) || 0,
        sellingPrice: Number(quickEditForm.sellingPrice) || 0,
        stock: Number(quickEditForm.stock) || 0,
      };

      const res = await axios.put(
        API + "/api/medicines/" + quickEditMed._id,
        payload,
      );

      if (res.data?.success || res.status === 200) {
        setMedicines((prev) =>
          prev.map((item) =>
            item._id === quickEditMed._id ? { ...item, ...payload } : item,
          ),
        );

        MEMORY_CACHE.clear();

        // এডিট হওয়া ওষুধে আইডি সেট করা
        setLastEditedId(quickEditMed._id);
        sessionStorage.setItem(
          "novacare_admin_last_edited_id",
          quickEditMed._id,
        );

        setQuickEditMed(null);

        Swal.fire({
          icon: "success",
          title: "আপডেট সফল হয়েছে!",
          text: payload.medicineName + " এর তথ্য সেভ হয়েছে।",
          timer: 1600,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "আপডেট হয়নি",
          text: res.data?.message || "সার্ভার এরর",
        });
      }
    } catch (err) {
      console.error("Quick edit save error:", err);
      Swal.fire({
        icon: "error",
        title: "আপডেট ব্যর্থ",
        text: err.response?.data?.message || err.message,
      });
    } finally {
      setIsUpdatingQuick(false);
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
              className={
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all " +
                (company === companyItem.value
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
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

          <div className="w-full md:w-auto flex items-center gap-2">
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

            {(search || company) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="whitespace-nowrap px-3 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition"
              >
                Reset Search
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ACTIVE SEARCH / FILTER BADGES */}
      {(search || company || lastEditedId) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          {search && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-xl font-bold">
              <span>
                সার্চ কিওয়ার্ড: <b>&quot;{search}&quot;</b>
              </span>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="hover:text-red-600 font-black ml-1"
              >
                ✕
              </button>
            </div>
          )}

          {company && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-xl font-bold">
              <span>
                কোম্পানি:{" "}
                <b>
                  {companies.find((c) => c.value === company)?.name || company}
                </b>
              </span>
              <button
                type="button"
                onClick={() => setCompany("")}
                className="hover:text-red-600 font-black ml-1"
              >
                ✕
              </button>
            </div>
          )}

          {lastEditedId && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-800 px-3 py-1 rounded-xl font-bold animate-pulse">
              <span>✨ এডিট করা মেডিসিন হাইলাইট করা হয়েছে</span>
            </div>
          )}
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

                  const rawMrp = Number(
                    medicine.mrpePrice ?? medicine.mrp ?? 0,
                  );
                  const rawSelling = Number(medicine.sellingPrice || 0);
                  const rawBikriPercent = Number(
                    medicine.bikriPercent ?? medicine.discount ?? 0,
                  );

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

                  // এডিট করা মেডিসিন কিনা চেক
                  const isJustEdited = medicine._id === lastEditedId;

                  return (
                    <tr
                      key={medicine._id}
                      id={"medicine-row-" + medicine._id}
                      className={
                        "transition-all duration-300 " +
                        (isJustEdited
                          ? "bg-emerald-50/90 ring-2 ring-emerald-500 shadow-md font-semibold"
                          : "hover:bg-slate-50/70")
                      }
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
                            className="w-10 h-10 rounded-xl object-contain border border-slate-100 bg-slate-50 p-1 shrink-0"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://placehold.co/60x60?text=Medicine";
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 leading-tight">
                                {medicine.medicineName || "N/A"}
                              </p>
                              {isJustEdited && (
                                <span className="inline-flex items-center rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                                  ✨ Updated
                                </span>
                              )}
                            </div>
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

                      <td className="px-4 py-3.5 text-right font-bold text-slate-700">
                        {mrpPrice > sellingPrice ? (
                          <span className="line-through decoration-slate-400 text-slate-600">
                            ৳{mrpPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span>৳{mrpPrice.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {discountVal > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-black text-rose-600">
                            {discountVal}% OFF
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">0%</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-emerald-700 text-sm">
                        ৳{sellingPrice.toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black " +
                            (Number(medicine.stock || 0) > 10
                              ? "bg-emerald-100 text-emerald-800"
                              : Number(medicine.stock || 0) > 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800")
                          }
                        >
                          {medicine.stock || 0} pcs
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          {/* ১. কুইক এডিট বাটন */}
                          <button
                            type="button"
                            onClick={() => handleOpenQuickEdit(medicine)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition"
                            title="পেজ না ছেড়ে দ্রুত এডিট করুন"
                          >
                            Quick Edit
                          </button>

                          {/* ২. ফুল পেজ এডিট লিংক (বর্তমান সার্চ ও পেজ সহ যাবে) */}
                          <Link
                            to={"/dashboard/update-medicine/" + medicine._id}
                            state={{
                              search,
                              company,
                              page,
                              sort,
                              lastEditedId: medicine._id,
                            }}
                            onClick={() => {
                              sessionStorage.setItem(
                                "novacare_admin_med_search",
                                search,
                              );
                              sessionStorage.setItem(
                                "novacare_admin_med_company",
                                company,
                              );
                              sessionStorage.setItem(
                                "novacare_admin_med_page",
                                String(page),
                              );
                              sessionStorage.setItem(
                                "novacare_admin_med_sort",
                                sort,
                              );
                              sessionStorage.setItem(
                                "novacare_admin_last_edited_id",
                                medicine._id,
                              );
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                          >
                            Full Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(medicine._id)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition"
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
                className={
                  "px-3 py-1.5 rounded-xl border text-xs font-bold transition " +
                  (page === 1
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100")
                }
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
                className={
                  "px-3 py-1.5 rounded-xl border text-xs font-bold transition " +
                  (page >= totalPages
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100")
                }
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK EDIT MODAL */}
      {quickEditMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Quick Edit: {quickEditMed.medicineName}
                </h3>
                <p className="text-xs text-slate-400">
                  সরাসরি MRP, Bikri %, Selling Price ও Stock পরিবর্তন করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditMed(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medicine Name
                </label>
                <input
                  type="text"
                  required
                  value={quickEditForm.medicineName}
                  onChange={(e) =>
                    handleQuickEditChange("medicineName", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={quickEditForm.company}
                    onChange={(e) =>
                      handleQuickEditChange("company", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock (Pcs)
                  </label>
                  <input
                    type="number"
                    value={quickEditForm.stock}
                    onChange={(e) =>
                      handleQuickEditChange("stock", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    MRP (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickEditForm.mrpePrice}
                    onChange={(e) =>
                      handleQuickEditChange("mrpePrice", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-600 mb-1">
                    Bikri % OFF
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={quickEditForm.bikriPercent}
                    onChange={(e) =>
                      handleQuickEditChange("bikriPercent", e.target.value)
                    }
                    className="w-full rounded-xl border border-rose-300 p-2 text-xs font-mono font-bold text-rose-700 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                    Selling (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickEditForm.sellingPrice}
                    onChange={(e) =>
                      handleQuickEditChange("sellingPrice", e.target.value)
                    }
                    className="w-full rounded-xl border border-emerald-300 p-2 text-xs font-mono font-black text-emerald-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickEditMed(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingQuick}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white hover:bg-emerald-700 shadow-sm"
                >
                  {isUpdatingQuick ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllMedicine;
