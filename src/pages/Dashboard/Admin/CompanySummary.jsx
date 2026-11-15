import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaBuilding,
  FaSearch,
  FaSyncAlt,
  FaPrint,
  FaDownload,
  FaChevronRight,
  FaTimes,
  FaTable,
  FaThLarge,
  FaEdit,
  FaSave,
  FaBoxes,
} from "react-icons/fa";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://medpharm-server-3.onrender.com"
).trim();

const normalizeCompanyKey = (name) => {
  const raw = (name || "অন্যান্য কোম্পানি").trim();
  if (!raw) return "unspecified";
  return raw.toLowerCase().replace(/\s+/g, " ");
};

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function CompanySummary() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // কন্ট্রোল ও ফিল্টার স্টেট
  const [search, setSearch] = useState("");
  const [valuationMode, setValuationMode] = useState("stock"); // 'stock' | 'unit'
  const [stockFilter, setStockFilter] = useState("in-stock"); // 'in-stock' | 'all'
  const [sortBy, setSortBy] = useState("mrp-desc");
  const [layoutMode, setLayoutMode] = useState("cards"); // 'cards' | 'table'

  // বিস্তারিত মডাল ও এডিট স্টেট
  const [selectedCompanyKey, setSelectedCompanyKey] = useState(null);
  const [detailSearch, setDetailSearch] = useState("");
  const [editingMed, setEditingMed] = useState(null);
  const [editPurchase, setEditPurchase] = useState("");
  const [editMrp, setEditMrp] = useState("");
  const [editBikri, setEditBikri] = useState("");
  const [editStock, setEditStock] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const loadMedicines = async (showFullLoader = true) => {
    try {
      if (showFullLoader) setLoading(true);
      else setRefreshing(true);

      const res = await axios.get(`${API_URL}/api/medicines`, {
        timeout: 12000,
      });

      const list = Array.isArray(res.data?.medicines)
        ? res.data.medicines
        : Array.isArray(res.data)
          ? res.data
          : [];

      setMedicines(list);
    } catch (err) {
      console.error("Failed to fetch medicines:", err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMedicines(true);
  }, []);

  // কোম্পানি অনুযায়ী MRP, কেনা দাম, বিক্রয় মূল্য এবং লাভ হিসাব
  const { companyStats, grandTotals } = useMemo(() => {
    const map = new Map();

    medicines.forEach((med) => {
      const rawCompany = (med.company || "অন্যান্য কোম্পানি").trim();
      const key = normalizeCompanyKey(rawCompany);

      const stock = Math.max(0, Number(med.stock) || 0);
      if (stockFilter === "in-stock" && stock <= 0) {
        return;
      }

      const unitMrp = Number(med.mrpePrice) || 0;
      const bikriPercent = Number(med.bikriPercent) || 0;
      const rawSelling = Number(med.sellingPrice) || 0;
      const unitSelling =
        rawSelling > 0
          ? rawSelling
          : unitMrp > 0
            ? Number((unitMrp - (unitMrp * bikriPercent) / 100).toFixed(2))
            : 0;

      const rawPurchase = Number(med.purchasePrice) || 0;
      const profitPercentField = Number(med.profitPercent) || 0;
      const hasPurchasePrice = rawPurchase > 0 || profitPercentField > 0;
      const unitPurchase =
        rawPurchase > 0
          ? rawPurchase
          : profitPercentField > 0 && unitSelling > 0
            ? Number((unitSelling / (1 + profitPercentField / 100)).toFixed(2))
            : 0;

      const multiplier = valuationMode === "stock" ? stock : 1;

      const totalMrp = unitMrp * multiplier;
      const totalPurchase = unitPurchase * multiplier;
      const totalSelling = unitSelling * multiplier;
      const totalProfit =
        unitPurchase > 0 ? Math.max(0, totalSelling - totalPurchase) : 0;

      if (!map.has(key)) {
        map.set(key, {
          key,
          companyName: rawCompany,
          totalProducts: 0,
          totalStockUnits: 0,
          totalMrp: 0,
          totalPurchase: 0,
          totalSelling: 0,
          totalProfit: 0,
          profitMarginPercent: 0,
          missingPurchaseCount: 0,
          rows: [],
        });
      }

      const stat = map.get(key);
      stat.totalProducts += 1;
      stat.totalStockUnits += stock;
      stat.totalMrp += totalMrp;
      stat.totalPurchase += totalPurchase;
      stat.totalSelling += totalSelling;
      stat.totalProfit += totalProfit;
      if (!hasPurchasePrice) {
        stat.missingPurchaseCount += 1;
      }

      stat.rows.push({
        medicine: med,
        stock,
        unitMrp,
        unitPurchase,
        unitSelling,
        totalMrp,
        totalPurchase,
        totalSelling,
        totalProfit,
        hasPurchasePrice,
      });
    });

    const statsArray = Array.from(map.values()).map((stat) => {
      const margin =
        stat.totalPurchase > 0
          ? (stat.totalProfit / stat.totalPurchase) * 100
          : 0;
      stat.rows.sort((a, b) => b.totalMrp - a.totalMrp);
      return {
        ...stat,
        profitMarginPercent: margin,
      };
    });

    const totals = statsArray.reduce(
      (acc, c) => {
        acc.totalCompanies += 1;
        acc.totalProducts += c.totalProducts;
        acc.totalStockUnits += c.totalStockUnits;
        acc.totalMrp += c.totalMrp;
        acc.totalPurchase += c.totalPurchase;
        acc.totalSelling += c.totalSelling;
        acc.totalProfit += c.totalProfit;
        acc.missingPurchaseCount += c.missingPurchaseCount;
        return acc;
      },
      {
        totalCompanies: 0,
        totalProducts: 0,
        totalStockUnits: 0,
        totalMrp: 0,
        totalPurchase: 0,
        totalSelling: 0,
        totalProfit: 0,
        missingPurchaseCount: 0,
      },
    );

    return {
      companyStats: statsArray,
      grandTotals: totals,
    };
  }, [medicines, valuationMode, stockFilter]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? companyStats.filter(
          (c) =>
            c.companyName.toLowerCase().includes(q) ||
            c.rows.some((r) =>
              (r.medicine.medicineName || "").toLowerCase().includes(q),
            ),
        )
      : [...companyStats];

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "mrp-desc":
          return b.totalMrp - a.totalMrp;
        case "profit-desc":
          return b.totalProfit - a.totalProfit;
        case "purchase-desc":
          return b.totalPurchase - a.totalPurchase;
        case "qty-desc":
          return b.totalStockUnits - a.totalStockUnits;
        case "name-asc":
          return a.companyName.localeCompare(b.companyName);
        default:
          return b.totalMrp - a.totalMrp;
      }
    });

    return filtered;
  }, [companyStats, search, sortBy]);

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyKey) return null;
    return companyStats.find((c) => c.key === selectedCompanyKey) || null;
  }, [companyStats, selectedCompanyKey]);

  const filteredDetailRows = useMemo(() => {
    if (!selectedCompany) return [];
    const q = detailSearch.trim().toLowerCase();
    if (!q) return selectedCompany.rows;
    return selectedCompany.rows.filter(
      (r) =>
        (r.medicine.medicineName || "").toLowerCase().includes(q) ||
        (r.medicine.genericName || "").toLowerCase().includes(q),
    );
  }, [selectedCompany, detailSearch]);

  const handleExportCsv = () => {
    if (filteredCompanies.length === 0) return;

    const headers = [
      "Company",
      "Products Count",
      "Total Stock Units",
      "Total MRP (BDT)",
      "Total Purchase Price (BDT)",
      "Total Selling Price (BDT)",
      "Total Profit (BDT)",
      "Profit Margin (%)",
    ];

    const csvRows = [
      headers.join(","),
      ...filteredCompanies.map((c) =>
        [
          `"${c.companyName.replace(/"/g, '""')}"`,
          c.totalProducts,
          c.totalStockUnits,
          c.totalMrp.toFixed(2),
          c.totalPurchase.toFixed(2),
          c.totalSelling.toFixed(2),
          c.totalProfit.toFixed(2),
          c.profitMarginPercent.toFixed(2),
        ].join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `novacare-company-summary-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openEditModal = (med) => {
    setEditingMed(med);
    setEditPurchase(med.purchasePrice ? String(med.purchasePrice) : "");
    setEditMrp(med.mrpePrice ? String(med.mrpePrice) : "");
    setEditBikri(
      med.bikriPercent !== undefined ? String(med.bikriPercent) : "",
    );
    setEditStock(med.stock !== undefined ? String(med.stock) : "0");
  };

  const handleSaveMedicineEdit = async (e) => {
    e.preventDefault();
    if (!editingMed) return;

    const purchaseVal = Number(editPurchase) || 0;
    const mrpVal = Number(editMrp) || 0;
    const bikriVal = Number(editBikri) || 0;
    const stockVal = Math.max(0, parseInt(editStock, 10) || 0);
    const sellingVal = Number((mrpVal - (mrpVal * bikriVal) / 100).toFixed(2));

    const updatedMed = {
      ...editingMed,
      purchasePrice: purchaseVal,
      mrpePrice: mrpVal,
      bikriPercent: bikriVal,
      sellingPrice: sellingVal,
      stock: stockVal,
    };

    try {
      setSavingEdit(true);
      await axios.put(`${API_URL}/api/medicines/${editingMed._id}`, updatedMed);

      setMedicines((prev) =>
        prev.map((m) => (m._id === editingMed._id ? updatedMed : m)),
      );

      setEditingMed(null);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `${updatedMed.medicineName} আপডেট হয়েছে!`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "আপডেট করা যায়নি",
        text: err?.message || "সার্ভার কানেকশন চেক করুন।",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-3 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ১. হেডার ও অ্যাকশন বাটন */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold text-[#00897b] tracking-wide">
              NovaCare Pharmacy Ledger · কোম্পানি অনুযায়ী আর্থিক হিসাব
            </p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              কোম্পানি ভিত্তিক ঔষধের MRP, ক্রয় মূল্য ও লাভের হিসাব
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm max-w-2xl">
              প্রতিটি ফার্মাসিউটিক্যাল কোম্পানির মোট কত টাকার MRP মূল্যের ঔষধ
              আছে, মোট ক্রয় খরচ (Purchase Price) এবং নিট প্রফিট এক নজরে দেখুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadMedicines(false)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <FaSyncAlt
                className={refreshing ? "animate-spin text-[#00897b]" : ""}
              />
              <span>রিফ্রেশ</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <FaDownload className="text-[#00897b]" />
              <span>CSV এক্সপোর্ট</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00897b] px-4 py-2 text-xs font-bold text-white hover:bg-[#00796b] transition cursor-pointer"
            >
              <FaPrint />
              <span>প্রিন্ট রিপোর্ট</span>
            </button>
          </div>
        </div>

        {/* ২. সর্বমোট হিসাব (All Companies Total) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">
              মোট কোম্পানি ও স্টক
            </p>
            <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-slate-900">
              {grandTotals.totalCompanies} টি কোম্পানি
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {grandTotals.totalProducts} ধরনের ঔষধ ·{" "}
              {grandTotals.totalStockUnits.toLocaleString()} পিস স্টক
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">
              সর্বমোট MRP মূল্য (Total MRP)
            </p>
            <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-slate-900">
              ৳ {formatCurrency(grandTotals.totalMrp)}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {valuationMode === "stock"
                ? "স্টকে থাকা সকল ঔষধের মোট MRP দাম"
                : "প্রতি ইউনিট MRP মূল্যের যোগফল"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">
              সর্বমোট কেনা দাম (Purchase Price)
            </p>
            <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-slate-900">
              ৳ {formatCurrency(grandTotals.totalPurchase)}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {grandTotals.missingPurchaseCount > 0
                ? `${grandTotals.missingPurchaseCount}টি ঔষধে ক্রয় মূল্য সেট করা নেই`
                : "সকল ঔষধের ক্রয় মূল্য যুক্ত আছে"}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
            <p className="text-xs font-semibold text-emerald-800">
              সর্বমোট নিট লাভ (Total Profit)
            </p>
            <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-[#00897b]">
              ৳ {formatCurrency(grandTotals.totalProfit)}
            </p>
            <p className="mt-1 text-xs text-emerald-700 tabular-nums">
              বিক্রয় মূল্য: ৳ {formatCurrency(grandTotals.totalSelling)}
              {grandTotals.totalPurchase > 0 && (
                <span>
                  {" "}
                  · লাভ{" "}
                  {(
                    (grandTotals.totalProfit / grandTotals.totalPurchase) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ৩. সার্চ, ভ্যালুয়েশন মোড এবং সর্টিং কন্ট্রোল */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="কোম্পানি বা ঔষধের নাম খুঁজুন (যেমন: Square, ACI)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#00897b] focus:bg-white focus:outline-none sm:text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setValuationMode("stock")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  valuationMode === "stock"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                মোট স্টক ভ্যালু (Stock × দাম)
              </button>
              <button
                type="button"
                onClick={() => setValuationMode("unit")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  valuationMode === "unit"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ১ ইউনিট দামের যোগফল
              </button>
            </div>

            <div className="flex items-center rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setStockFilter("in-stock")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  stockFilter === "in-stock"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                স্টকে আছে
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  stockFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                সকল ঔষধ
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:border-[#00897b] focus:outline-none cursor-pointer"
            >
              <option value="mrp-desc">মোট MRP বেশি থেকে কম</option>
              <option value="profit-desc">মোট লাভ বেশি থেকে কম</option>
              <option value="purchase-desc">মোট কেনা দাম বেশি থেকে কম</option>
              <option value="qty-desc">মোট স্টক বেশি থেকে কম</option>
              <option value="name-asc">কোম্পানির নাম (A-Z)</option>
            </select>

            <div className="flex items-center rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setLayoutMode("cards")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  layoutMode === "cards"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FaThLarge />
                <span>কার্ড</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  layoutMode === "table"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FaTable />
                <span>টেবিল</span>
              </button>
            </div>
          </div>
        </div>

        {/* ৪. কোম্পানি তালিকা (কার্ড বা টেবিল ভিউ) */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <p className="text-sm font-bold text-slate-600">
              কোম্পানির হিসাব লোড হচ্ছে...
            </p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center">
            <FaBoxes className="mx-auto text-3xl text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              কোনো কোম্পানির তথ্য পাওয়া যায়নি
            </h3>
          </div>
        ) : layoutMode === "cards" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => {
              const mrpShare =
                grandTotals.totalMrp > 0
                  ? (company.totalMrp / grandTotals.totalMrp) * 100
                  : 0;

              return (
                <div
                  key={company.key}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FaBuilding className="shrink-0 text-sm text-[#00897b]" />
                          <h2 className="truncate text-base font-extrabold text-slate-900">
                            {company.companyName}
                          </h2>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 tabular-nums">
                          {company.totalProducts} টি আইটেম ·{" "}
                          {company.totalStockUnits.toLocaleString()} পিস স্টক
                        </p>
                      </div>

                      <span className="shrink-0 font-mono text-xs font-bold text-slate-500 tabular-nums">
                        {mrpShare.toFixed(1)}% অংশ
                      </span>
                    </div>

                    <div className="mt-4 space-y-2.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          মোট MRP মূল্য
                        </span>
                        <span className="font-mono text-base font-extrabold tabular-nums text-slate-900">
                          ৳ {formatCurrency(company.totalMrp)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          মোট কেনা দাম (Purchase)
                        </span>
                        <span className="font-mono text-sm font-bold tabular-nums text-slate-700">
                          ৳ {formatCurrency(company.totalPurchase)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          মোট বিক্রয় মূল্য (Selling)
                        </span>
                        <span className="font-mono text-sm font-bold tabular-nums text-slate-700">
                          ৳ {formatCurrency(company.totalSelling)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <span className="text-xs font-bold text-slate-700">
                          মোট লাভ (Profit)
                        </span>
                        <div className="text-right">
                          <span className="font-mono text-base font-extrabold tabular-nums text-[#00897b]">
                            ৳ {formatCurrency(company.totalProfit)}
                          </span>
                          {company.totalPurchase > 0 && (
                            <span className="ml-1.5 font-mono text-[11px] font-bold text-emerald-700 tabular-nums">
                              ({company.profitMarginPercent.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#00897b] transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(2, mrpShare))}%`,
                          }}
                        />
                      </div>
                      {company.missingPurchaseCount > 0 && (
                        <p className="mt-2 text-[11px] text-amber-700">
                          {company.missingPurchaseCount}টি ঔষধে ক্রয় মূল্য সেট
                          করা নেই
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompanyKey(company.key);
                        setDetailSearch("");
                      }}
                      className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-teal-50 hover:text-[#00897b] transition cursor-pointer"
                    >
                      <span>ঔষধ অনুযায়ী বিস্তারিত হিসাব দেখুন</span>
                      <FaChevronRight className="text-[10px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5">কোম্পানির নাম</th>
                    <th className="px-4 py-3.5 text-right">আইটেম</th>
                    <th className="px-4 py-3.5 text-right">মোট স্টক</th>
                    <th className="px-4 py-3.5 text-right">মোট MRP (৳)</th>
                    <th className="px-4 py-3.5 text-right">কেনা দাম (৳)</th>
                    <th className="px-4 py-3.5 text-right">বিক্রয় মূল্য (৳)</th>
                    <th className="px-4 py-3.5 text-right">মোট লাভ (৳)</th>
                    <th className="px-4 py-3.5 text-right">বিস্তারিত</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanies.map((company) => (
                    <tr
                      key={company.key}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {company.companyName}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {company.totalProducts}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {company.totalStockUnits.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                        ৳ {formatCurrency(company.totalMrp)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-700">
                        ৳ {formatCurrency(company.totalPurchase)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-700">
                        ৳ {formatCurrency(company.totalSelling)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-extrabold tabular-nums text-[#00897b]">
                        ৳ {formatCurrency(company.totalProfit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCompanyKey(company.key);
                            setDetailSearch("");
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#00897b] hover:text-[#00897b] transition cursor-pointer"
                        >
                          দেখুন
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ৫. বিস্তারিত ঔষধ হিসাব মডাল */}
        {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-6 backdrop-blur-xs">
            <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold text-[#00897b]">
                    কোম্পানি ভিত্তিক বিস্তারিত হিসাব
                  </p>
                  <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                    {selectedCompany.companyName}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                    {selectedCompany.totalProducts}টি ঔষধ · মোট স্টক{" "}
                    {selectedCompany.totalStockUnits.toLocaleString()} পিস
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCompanyKey(null)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="border-b border-slate-100 px-5 py-3 bg-white">
                <div className="relative max-w-md">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                  <input
                    type="text"
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                    placeholder={`${selectedCompany.companyName} এর ভেতরে ঔষধ খুঁজুন...`}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-8 text-xs font-medium text-slate-900 focus:border-[#00897b] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">ঔষধের নাম</th>
                      <th className="px-3 py-3 text-right">স্টক</th>
                      <th className="px-3 py-3 text-right">একক MRP</th>
                      <th className="px-3 py-3 text-right">মোট MRP</th>
                      <th className="px-3 py-3 text-right">একক কেনা দাম</th>
                      <th className="px-3 py-3 text-right">মোট কেনা দাম</th>
                      <th className="px-3 py-3 text-right">মোট বিক্রয়</th>
                      <th className="px-3 py-3 text-right">মোট লাভ</th>
                      <th className="px-3 py-3 text-right">এডিট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDetailRows.map((row) => (
                      <tr key={row.medicine._id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          {row.medicine.medicineName}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums">
                          {row.stock}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          ৳{row.unitMrp.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums">
                          ৳{formatCurrency(row.totalMrp)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          {row.hasPurchasePrice
                            ? `৳${row.unitPurchase.toFixed(2)}`
                            : "সেট নেই"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          ৳{formatCurrency(row.totalPurchase)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          ৳{formatCurrency(row.totalSelling)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-[#00897b]">
                          ৳{formatCurrency(row.totalProfit)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => openEditModal(row.medicine)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:border-[#00897b] cursor-pointer"
                          >
                            <FaEdit />
                            <span>এডিট</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ৬. দ্রুত ক্রয় মূল্য / MRP এডিট মডাল */}
        {editingMed && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <form
              onSubmit={handleSaveMedicineEdit}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#00897b]">
                    {editingMed.company}
                  </p>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingMed.medicineName} — মূল্য ও স্টক আপডেট
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    MRP মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editMrp}
                    onChange={(e) => setEditMrp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    কেনা দাম (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPurchase}
                    onChange={(e) => setEditPurchase(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    বিক্রি ছাড় (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="99"
                    value={editBikri}
                    onChange={(e) => setEditBikri(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    স্টক (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00897b] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <FaSave />
                  <span>{savingEdit ? "সেভ হচ্ছে..." : "সেভ করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
