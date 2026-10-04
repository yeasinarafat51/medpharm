import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaCalendarDay,
  FaCalendarAlt,
  FaShoppingBag,
  FaSyncAlt,
  FaPrint,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaFileInvoice,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaBoxes,
  FaPhoneAlt,
} from "react-icons/fa";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://medpharm-server-3.onrender.com"
).trim();

const ORDERS_CACHE_KEY = "novacare_orders_cache_v1";

function TotalOrders() {
  // ১. ক্যাশ থেকে ০ সেকেন্ডে লোড + ব্যাকগ্রাউন্ড সিঙ্ক
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_CACHE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem(ORDERS_CACHE_KEY);
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // ট্যাব: "daily" (প্রতিদিনের মোট অর্ডার) | "monthly" (প্রতি মাসের মোট অর্ডার)
  const [viewTab, setViewTab] = useState("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");

  const [expandedDayKey, setExpandedDayKey] = useState(null);
  const [expandedMonthKey, setExpandedMonthKey] = useState(null);

  const loadOrders = async () => {
    try {
      if (orders.length === 0) {
        setLoading(true);
      } else {
        setIsSyncing(true);
      }

      const res = await axios.get(`${API_URL}/api/orders`);

      if (res.data?.success && Array.isArray(res.data.orders)) {
        const fetched = res.data.orders;
        setOrders(fetched);
        try {
          localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(fetched));
        } catch {
          // ignore
        }
      } else if (Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error("Failed to load total orders:", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // =========================================================================
  // হেল্পার: অর্ডারের আইটেম, মোট পিস এবং মোট টাকা বের করা
  // =========================================================================
  const getOrderItems = (order) => {
    return Array.isArray(order?.items)
      ? order.items.filter((it) => Number(it.quantity || 0) > 0)
      : [];
  };

  const getOrderUnits = (order) => {
    const items = getOrderItems(order);
    if (items.length > 0) {
      return items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    }
    return Number(order?.quantity || 0);
  };

  const getOrderAmount = (order) => {
    const grand = Number(order?.grandTotal || 0);
    if (grand > 0) return grand;
    return getOrderItems(order).reduce((sum, it) => {
      const unit = Number(it.unitPrice || it.sellingPrice || 0);
      const qty = Number(it.quantity || 0);
      return sum + (Number(it.totalPrice) || unit * qty);
    }, 0);
  };

  // =========================================================================
  // ২:০০ PM -> ২:০০ PM কাস্টম বিজনেস ডে সাইকেল
  // =========================================================================
  const getDayAndMonthInfo = (dateString) => {
    const d = new Date(dateString || Date.now());
    const cycleStart = new Date(d);
    if (d.getHours() < 14) {
      cycleStart.setDate(cycleStart.getDate() - 1);
    }
    cycleStart.setHours(14, 0, 0, 0);

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + 1);

    const dayKey = cycleStart.toISOString().split("T")[0];
    const monthKey = `${cycleStart.getFullYear()}-${String(
      cycleStart.getMonth() + 1,
    ).padStart(2, "0")}`;

    const formatShortDate = (dt) =>
      dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    const dayTitle = formatShortDate(cycleStart);
    const cycleLabel = `${formatShortDate(
      cycleStart,
    )} 2:00 PM → ${formatShortDate(cycleEnd)} 2:00 PM`;

    const monthLabel = cycleStart.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return {
      dayKey,
      dayTitle,
      cycleLabel,
      cycleStartMs: cycleStart.getTime(),
      monthKey,
      monthLabel,
      monthStartMs: new Date(
        cycleStart.getFullYear(),
        cycleStart.getMonth(),
        1,
      ).getTime(),
    };
  };

  // =========================================================================
  // প্রতিদিনের মোট অর্ডার ও প্রতি মাসের মোট অর্ডার প্রসেসিং
  // =========================================================================
  const { dailyReports, monthlyReports, overallStats } = useMemo(() => {
    // শুধুমাত্র ভ্যালিড অর্ডার (Cancelled ও সম্পূর্ণ রিটার্ন হওয়া অর্ডার বাদে)
    const validOrders = orders.filter((o) => {
      const items = getOrderItems(o);
      const total = getOrderAmount(o);
      const isCancelled =
        String(o.orderStatus || "").toLowerCase() === "cancelled";
      return !isCancelled && items.length > 0 && total > 0;
    });

    const daysMap = {};
    const monthsMap = {};
    const allCustomersSet = new Set();

    let allTimeOrders = 0;
    let allTimeRevenue = 0;
    let allTimeUnits = 0;
    let allTimeCompleted = 0;
    let allTimePending = 0;

    validOrders.forEach((order) => {
      const {
        dayKey,
        dayTitle,
        cycleLabel,
        cycleStartMs,
        monthKey,
        monthLabel,
        monthStartMs,
      } = getDayAndMonthInfo(order.orderDate || order.createdAt);

      const amount = getOrderAmount(order);
      const units = getOrderUnits(order);
      const status = String(order.orderStatus || "Pending").toLowerCase();
      const isCompleted = status === "completed" || status === "delivered";
      const customerKey = (
        order.phone ||
        order.customerEmail ||
        order.customerName ||
        order._id
      )
        .toString()
        .toLowerCase()
        .trim();

      allTimeOrders += 1;
      allTimeRevenue += amount;
      allTimeUnits += units;
      allCustomersSet.add(customerKey);

      if (isCompleted) {
        allTimeCompleted += 1;
      } else {
        allTimePending += 1;
      }

      // ১. প্রতিদিনের গ্রুপ (Daily Report)
      if (!daysMap[dayKey]) {
        daysMap[dayKey] = {
          dayKey,
          dayTitle,
          cycleLabel,
          startTime: cycleStartMs,
          monthKey,
          monthLabel,
          totalOrders: 0,
          totalAmount: 0,
          totalUnits: 0,
          completedCount: 0,
          pendingCount: 0,
          customerSet: new Set(),
          ordersList: [],
        };
      }

      daysMap[dayKey].totalOrders += 1;
      daysMap[dayKey].totalAmount += amount;
      daysMap[dayKey].totalUnits += units;
      daysMap[dayKey].customerSet.add(customerKey);
      if (isCompleted) {
        daysMap[dayKey].completedCount += 1;
      } else {
        daysMap[dayKey].pendingCount += 1;
      }
      daysMap[dayKey].ordersList.push(order);

      // ২. প্রতি মাসের গ্রুপ (Monthly Report)
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = {
          monthKey,
          monthLabel,
          startTime: monthStartMs,
          totalOrders: 0,
          totalAmount: 0,
          totalUnits: 0,
          completedCount: 0,
          pendingCount: 0,
          activeDaysSet: new Set(),
          customerSet: new Set(),
          dailyMap: {},
        };
      }

      monthsMap[monthKey].totalOrders += 1;
      monthsMap[monthKey].totalAmount += amount;
      monthsMap[monthKey].totalUnits += units;
      monthsMap[monthKey].activeDaysSet.add(dayKey);
      monthsMap[monthKey].customerSet.add(customerKey);
      if (isCompleted) {
        monthsMap[monthKey].completedCount += 1;
      } else {
        monthsMap[monthKey].pendingCount += 1;
      }

      if (!monthsMap[monthKey].dailyMap[dayKey]) {
        monthsMap[monthKey].dailyMap[dayKey] = {
          dayKey,
          dayTitle,
          cycleLabel,
          startTime: cycleStartMs,
          totalOrders: 0,
          totalAmount: 0,
          totalUnits: 0,
          uniqueCustomers: 0,
          customerSet: new Set(),
        };
      }
      monthsMap[monthKey].dailyMap[dayKey].totalOrders += 1;
      monthsMap[monthKey].dailyMap[dayKey].totalAmount += amount;
      monthsMap[monthKey].dailyMap[dayKey].totalUnits += units;
      monthsMap[monthKey].dailyMap[dayKey].customerSet.add(customerKey);
    });

    const sortedDays = Object.values(daysMap)
      .map((d) => ({
        ...d,
        uniqueCustomers: d.customerSet.size,
        ordersList: d.ordersList.sort(
          (a, b) =>
            new Date(b.orderDate || b.createdAt || 0) -
            new Date(a.orderDate || a.createdAt || 0),
        ),
      }))
      .sort((a, b) => b.startTime - a.startTime);

    const sortedMonths = Object.values(monthsMap)
      .map((m) => ({
        ...m,
        activeDaysCount: m.activeDaysSet.size,
        uniqueCustomers: m.customerSet.size,
        daysBreakdown: Object.values(m.dailyMap)
          .map((d) => ({
            ...d,
            uniqueCustomers: d.customerSet.size,
          }))
          .sort((a, b) => b.startTime - a.startTime),
      }))
      .sort((a, b) => b.startTime - a.startTime);

    // আজকের এবং চলতি মাসের ইনফো
    const todayInfo = getDayAndMonthInfo(new Date().toISOString());
    const todayReport = daysMap[todayInfo.dayKey] || {
      totalOrders: 0,
      totalAmount: 0,
      totalUnits: 0,
      uniqueCustomers: 0,
    };
    const currentMonthReport = monthsMap[todayInfo.monthKey] || {
      monthLabel: todayInfo.monthLabel,
      totalOrders: 0,
      totalAmount: 0,
      totalUnits: 0,
      activeDaysCount: 0,
    };

    return {
      dailyReports: sortedDays,
      monthlyReports: sortedMonths,
      overallStats: {
        allTimeOrders,
        allTimeRevenue,
        allTimeUnits,
        allTimeCustomers: allCustomersSet.size,
        allTimeCompleted,
        allTimePending,
        todayOrders: todayReport.totalOrders || 0,
        todayRevenue: todayReport.totalAmount || 0,
        todayUnits: todayReport.totalUnits || 0,
        thisMonthLabel: currentMonthReport.monthLabel || todayInfo.monthLabel,
        thisMonthOrders: currentMonthReport.totalOrders || 0,
        thisMonthRevenue: currentMonthReport.totalAmount || 0,
        thisMonthDays: currentMonthReport.activeDaysSet
          ? currentMonthReport.activeDaysSet.size
          : 0,
      },
    };
  }, [orders]);

  // ফিল্টার করা প্রতিদিনের রিপোর্ট
  const filteredDailyReports = useMemo(() => {
    return dailyReports.filter((day) => {
      if (
        selectedMonthFilter !== "all" &&
        day.monthKey !== selectedMonthFilter
      ) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const dateMatch =
        day.dayTitle.toLowerCase().includes(q) ||
        day.cycleLabel.toLowerCase().includes(q) ||
        day.monthLabel.toLowerCase().includes(q);
      const custMatch = day.ordersList.some(
        (o) =>
          (o.customerName || "").toLowerCase().includes(q) ||
          (o.phone || "").toLowerCase().includes(q),
      );
      return dateMatch || custMatch;
    });
  }, [dailyReports, selectedMonthFilter, searchQuery]);

  const formatMoney = (val) =>
    Number(val || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (loading && orders.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"></div>
          <h2 className="text-xl font-black text-slate-800">
            Loading Daily & Monthly Orders...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-2 sm:p-5">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-800">
              Daily & Monthly Order Tracker
            </span>
            {isSyncing && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200">
                <FaSyncAlt className="animate-spin" size={9} />
                Syncing...
              </span>
            )}
          </div>
          <h1 className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Total Order Report (প্রতিদিন ও প্রতি মাস)
          </h1>
          <p className="text-xs text-slate-500">
            প্রতিদিনের মোট অর্ডার সংখ্যা এবং প্রতি মাসের মোট অর্ডার ও বিক্রির
            পূর্ণাঙ্গ হিসাব
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <FaSyncAlt
              className={isSyncing ? "animate-spin text-emerald-600" : ""}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            <FaPrint className="text-emerald-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* =====================================================
          4 PREMIUM SUMMARY CARDS (TODAY, THIS MONTH, ALL-TIME)
      ===================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* 1. TODAY'S TOTAL ORDERS */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              আজকের মোট অর্ডার (Today)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-lg">
              <FaCalendarDay />
            </div>
          </div>
          <h2 className="mt-3 text-3xl font-black">
            {overallStats.todayOrders} টি অর্ডার
          </h2>
          <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2.5 text-xs text-emerald-100">
            <span>মোট টাকা: ৳{formatMoney(overallStats.todayRevenue)}</span>
            <span className="font-bold">{overallStats.todayUnits} pcs</span>
          </div>
        </div>

        {/* 2. THIS MONTH'S TOTAL ORDERS */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
              চলতি মাসের অর্ডার ({overallStats.thisMonthLabel})
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-lg">
              <FaCalendarAlt />
            </div>
          </div>
          <h2 className="mt-3 text-3xl font-black">
            {overallStats.thisMonthOrders} টি অর্ডার
          </h2>
          <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2.5 text-xs text-blue-100">
            <span>মোট টাকা: ৳{formatMoney(overallStats.thisMonthRevenue)}</span>
            <span className="font-bold">{overallStats.thisMonthDays} দিন</span>
          </div>
        </div>

        {/* 3. ALL-TIME TOTAL ORDERS */}
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-800 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-100">
              সর্বমোট অর্ডার (All Time)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-lg">
              <FaShoppingBag />
            </div>
          </div>
          <h2 className="mt-3 text-3xl font-black">
            {overallStats.allTimeOrders} টি অর্ডার
          </h2>
          <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2.5 text-xs text-purple-100">
            <span>সর্বমোট: ৳{formatMoney(overallStats.allTimeRevenue)}</span>
            <span className="font-bold">{dailyReports.length} দিন</span>
          </div>
        </div>

        {/* 4. DELIVERY & UNITS STATS */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              ডেলিভারি ও মোট ওষুধ
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-lg text-emerald-400">
              <FaBoxes />
            </div>
          </div>
          <h2 className="mt-3 text-3xl font-black text-emerald-400">
            {overallStats.allTimeUnits.toLocaleString()} Pcs
          </h2>
          <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2.5 text-[11px]">
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <FaCheckCircle size={10} /> Completed:{" "}
              {overallStats.allTimeCompleted}
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-400">
              <FaClock size={10} /> Pending: {overallStats.allTimePending}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          VIEW SWITCHER: DAILY TOTAL ORDERS vs MONTHLY TOTAL ORDERS
      ===================================================== */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewTab("daily")}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-black transition ${
                viewTab === "daily"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <FaCalendarDay />
              <span>প্রতিদিনের মোট অর্ডার ({dailyReports.length} দিন)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab("monthly")}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-black transition ${
                viewTab === "monthly"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <FaCalendarAlt />
              <span>প্রতি মাসের মোট অর্ডার ({monthlyReports.length} মাস)</span>
            </button>
          </div>

          {/* FILTER BY MONTH & SEARCH (FOR DAILY VIEW) */}
          {viewTab === "daily" && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="all">সকল মাস (All Months)</option>
                {monthlyReports.map((m) => (
                  <option key={m.monthKey} value={m.monthKey}>
                    {m.monthLabel} ({m.totalOrders} Orders)
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-60">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="তারিখ বা কাস্টমার খুঁজুন..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          TAB 1: প্রতিদিনের মোট অর্ডার (DAILY TOTAL ORDERS TABLE)
      ===================================================== */}
      {viewTab === "daily" ? (
        <div className="mt-5 space-y-3">
          {filteredDailyReports.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-base font-bold text-slate-600">
                কোনো দিনের অর্ডার পাওয়া যায়নি।
              </p>
            </div>
          ) : (
            filteredDailyReports.map((day, idx) => {
              const isExpanded = expandedDayKey === day.dayKey;

              return (
                <div
                  key={day.dayKey}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs transition hover:shadow-md"
                >
                  {/* DAY SUMMARY ROW */}
                  <div
                    onClick={() =>
                      setExpandedDayKey(isExpanded ? null : day.dayKey)
                    }
                    className="cursor-pointer p-4 sm:p-5 transition hover:bg-slate-50/80"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* LEFT: DATE & CYCLE */}
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                          <span className="text-[9px] font-bold uppercase">
                            DAY
                          </span>
                          <span className="text-sm font-black leading-none">
                            #{filteredDailyReports.length - idx}
                          </span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black text-slate-900">
                              {day.dayTitle}
                            </h3>
                            <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                              {day.monthLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">
                            Cycle: {day.cycleLabel}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT: METRICS (TOTAL ORDERS, CUSTOMERS, UNITS, AMOUNT) */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-center lg:gap-6 border-t border-slate-100 pt-3 lg:border-0 lg:pt-0">
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-center">
                          <span className="block text-[10px] font-bold uppercase text-emerald-700">
                            দিনের মোট অর্ডার
                          </span>
                          <span className="text-base sm:text-lg font-black text-emerald-900">
                            {day.totalOrders} টি অর্ডার
                          </span>
                        </div>

                        <div className="rounded-2xl bg-blue-50 border border-blue-200 px-3.5 py-2 text-center">
                          <span className="block text-[10px] font-bold uppercase text-blue-700">
                            কাস্টমার সংখ্যা
                          </span>
                          <span className="text-base sm:text-lg font-black text-blue-900">
                            {day.uniqueCustomers} জন
                          </span>
                        </div>

                        <div className="rounded-2xl bg-purple-50 border border-purple-200 px-3.5 py-2 text-center">
                          <span className="block text-[10px] font-bold uppercase text-purple-700">
                            মোট ওষুধ (Qty)
                          </span>
                          <span className="text-base sm:text-lg font-black text-purple-900">
                            {day.totalUnits} pcs
                          </span>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="block text-[10px] font-bold uppercase text-slate-400">
                            দিনের মোট বিক্রি
                          </span>
                          <span className="text-lg sm:text-xl font-black text-emerald-700">
                            ৳ {formatMoney(day.totalAmount)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="hidden lg:flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                        >
                          {isExpanded ? (
                            <FaChevronUp size={13} />
                          ) : (
                            <FaChevronDown size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED ORDERS OF THIS DAY */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                          {day.dayTitle}-এর সকল অর্ডারের তালিকা (
                          {day.ordersList.length} টি অর্ডার)
                        </h4>
                        <div className="flex items-center gap-3 text-xs font-bold">
                          <span className="text-emerald-700">
                            ✓ Completed: {day.completedCount}
                          </span>
                          <span className="text-amber-700">
                            ⏳ Pending: {day.pendingCount}
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                              <th className="px-4 py-3">#</th>
                              <th className="px-4 py-3">Time</th>
                              <th className="px-4 py-3">Customer</th>
                              <th className="px-4 py-3">Phone</th>
                              <th className="px-4 py-3 text-center">
                                Items / Units
                              </th>
                              <th className="px-4 py-3 text-right">Amount</th>
                              <th className="px-4 py-3 text-center">Status</th>
                              <th className="px-4 py-3 text-center">Invoice</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {day.ordersList.map((ord, oIdx) => (
                              <tr
                                key={ord._id || oIdx}
                                className="hover:bg-slate-50"
                              >
                                <td className="px-4 py-3 font-bold text-slate-400">
                                  {oIdx + 1}
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">
                                  {new Date(
                                    ord.orderDate || ord.createdAt,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
                                <td className="px-4 py-3 font-black text-slate-900">
                                  {ord.customerName || "Walk-in"}
                                </td>
                                <td className="px-4 py-3 text-slate-600 font-semibold">
                                  <span className="inline-flex items-center gap-1">
                                    <FaPhoneAlt className="text-[9px] text-emerald-600" />
                                    {ord.phone || "N/A"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-slate-700">
                                  {getOrderItems(ord).length} items (
                                  {getOrderUnits(ord)} pcs)
                                </td>
                                <td className="px-4 py-3 text-right font-black text-emerald-700">
                                  ৳ {formatMoney(getOrderAmount(ord))}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                                      String(
                                        ord.orderStatus || "",
                                      ).toLowerCase() === "completed"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {ord.orderStatus || "Pending"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Link
                                    to={`/dashboard/invoice/${ord._id}`}
                                    state={{ combinedOrder: ord }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-600"
                                  >
                                    <FaFileInvoice size={10} />
                                    <span>Invoice</span>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* =====================================================
            TAB 2: প্রতি মাসের মোট অর্ডার (MONTHLY TOTAL ORDERS)
        ===================================================== */
        <div className="mt-5 space-y-4">
          {monthlyReports.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-base font-bold text-slate-600">
                কোনো মাসের অর্ডার পাওয়া যায়নি।
              </p>
            </div>
          ) : (
            monthlyReports.map((month, mIdx) => {
              const isMonthExpanded = expandedMonthKey === month.monthKey;

              return (
                <div
                  key={month.monthKey}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
                >
                  {/* MONTH SUMMARY BANNER */}
                  <div
                    onClick={() =>
                      setExpandedMonthKey(
                        isMonthExpanded ? null : month.monthKey,
                      )
                    }
                    className="cursor-pointer bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white transition hover:opacity-95"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          <FaCalendarAlt size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-blue-500 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">
                              Month #{monthlyReports.length - mIdx}
                            </span>
                            <span className="text-xs text-slate-300">
                              {month.activeDaysCount} Active Order Days
                            </span>
                          </div>
                          <h2 className="mt-0.5 text-xl font-black tracking-wide">
                            {month.monthLabel}
                          </h2>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-center lg:gap-6">
                        <div className="rounded-2xl bg-white/10 px-4 py-2 text-center border border-white/10">
                          <span className="block text-[10px] font-bold uppercase text-blue-200">
                            মাসের মোট অর্ডার
                          </span>
                          <span className="text-lg font-black text-white">
                            {month.totalOrders} টি অর্ডার
                          </span>
                        </div>

                        <div className="rounded-2xl bg-white/10 px-4 py-2 text-center border border-white/10">
                          <span className="block text-[10px] font-bold uppercase text-emerald-200">
                            মোট কাস্টমার
                          </span>
                          <span className="text-lg font-black text-white">
                            {month.uniqueCustomers} জন
                          </span>
                        </div>

                        <div className="rounded-2xl bg-white/10 px-4 py-2 text-center border border-white/10">
                          <span className="block text-[10px] font-bold uppercase text-purple-200">
                            মোট ওষুধ বিক্রি
                          </span>
                          <span className="text-lg font-black text-white">
                            {month.totalUnits} pcs
                          </span>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="block text-[10px] font-bold uppercase text-emerald-400">
                            মাসের মোট বিক্রি
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-emerald-400">
                            ৳ {formatMoney(month.totalAmount)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="hidden lg:flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
                        >
                          {isMonthExpanded ? (
                            <FaChevronUp size={14} />
                          ) : (
                            <FaChevronDown size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED DAILY BREAKDOWN INSIDE THIS MONTH */}
                  {isMonthExpanded && (
                    <div className="p-4 sm:p-5 bg-slate-50">
                      <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-700">
                        {month.monthLabel} মাসের প্রতিদিনের অর্ডার হিসাব (
                        {month.daysBreakdown.length} দিন)
                      </h4>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Date / Cycle</th>
                              <th className="px-4 py-3 text-center">
                                দিনের মোট অর্ডার
                              </th>
                              <th className="px-4 py-3 text-center">
                                কাস্টমার সংখ্যা
                              </th>
                              <th className="px-4 py-3 text-center">
                                মোট ওষুধ (Pcs)
                              </th>
                              <th className="px-4 py-3 text-right">
                                দিনের মোট টাকা (৳)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {month.daysBreakdown.map((d) => (
                              <tr
                                key={d.dayKey}
                                className="hover:bg-slate-50/80"
                              >
                                <td className="px-4 py-3">
                                  <div className="font-black text-slate-900">
                                    {d.dayTitle}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {d.cycleLabel}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 font-black text-emerald-800">
                                    {d.totalOrders} টি অর্ডার
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-slate-700">
                                  <span className="inline-flex items-center gap-1">
                                    <FaUsers className="text-blue-500 text-[10px]" />
                                    {d.uniqueCustomers} জন
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-purple-700">
                                  {d.totalUnits} pcs
                                </td>
                                <td className="px-4 py-3 text-right font-black text-emerald-700 text-sm">
                                  ৳ {formatMoney(d.totalAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default TotalOrders;
