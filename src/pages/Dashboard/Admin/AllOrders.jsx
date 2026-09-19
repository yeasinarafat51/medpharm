import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import {
  FaUndo,
  FaFileInvoice,
  FaBoxes,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaReceipt,
  FaLayerGroup,
  FaPrint,
} from "react-icons/fa";

const API_URL =
  import.meta.env.VITE_API_URL || "https://medpharm-server-3.onrender.com";

function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // দিন ভিত্তিক সেকশন টগল
  const [expandedDays, setExpandedDays] = useState({});
  // কার্ডে ট্যাপ দিলে ফুল ভিউ দেখানোর জন্য
  const [expandedOrders, setExpandedOrders] = useState({});

  // =============================
  // Load Orders
  // =============================
  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/orders`);

      if (res.data?.success) {
        setOrders(res.data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to load orders",
        text: error.response?.data?.message || "Server connection error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // =========================================================================
  // লজিক ১: দুপুর ২:০০ টা (14:00) থেকে পরের দিন দুপুর ২:০০ টা বিজনেস সাইকেল
  // =========================================================================
  const getCustomDayCycle = (dateString) => {
    const d = new Date(dateString);
    const cycleStart = new Date(d);
    if (d.getHours() < 14) {
      cycleStart.setDate(cycleStart.getDate() - 1);
    }
    cycleStart.setHours(14, 0, 0, 0);

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + 1);

    const key = cycleStart.toISOString().split("T")[0];

    const formatTimeDate = (date) =>
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    const label = `${formatTimeDate(cycleStart)} 02:00 PM  →  ${formatTimeDate(
      cycleEnd,
    )} 02:00 PM`;

    return {
      key,
      cycleStart,
      cycleEnd,
      label,
    };
  };

  // =========================================================================
  // লজিক ২: একই দিনে একই কাস্টমারের একাধিক অর্ডার রাখা + আলাদা লিস্ট সংরক্ষণ
  // =========================================================================
  const groupedOrders = useMemo(() => {
    const dayGroups = {};

    orders.forEach((order) => {
      const { key, label, cycleStart } = getCustomDayCycle(order.orderDate);

      if (!dayGroups[key]) {
        dayGroups[key] = {
          cycleKey: key,
          label,
          startTime: cycleStart.getTime(),
          customerMap: {},
          totalValue: 0,
        };
      }

      // কাস্টমার চিহ্নিত করার কি
      const customerKey = (
        order.customerEmail ||
        order.phone ||
        order.customerName ||
        "walk-in-customer"
      )
        .toLowerCase()
        .trim();

      if (!dayGroups[key].customerMap[customerKey]) {
        // নতুন কাস্টমার এন্ট্রি
        dayGroups[key].customerMap[customerKey] = {
          ...order,
          originalOrderIds: [order._id],
          orderCount: 1,
          items: (order.items || []).map((it) => ({ ...it })),
          notes: order.note ? [order.note] : [],
          grandTotal: Number(order.grandTotal || 0),
          individualOrders: [{ ...order }], // প্রতিটি একক অর্ডার সংরক্ষণ
        };
      } else {
        // একই কাস্টমার আবার অর্ডার করেছে
        const existing = dayGroups[key].customerMap[customerKey];
        existing.originalOrderIds.push(order._id);
        existing.orderCount += 1;
        existing.grandTotal += Number(order.grandTotal || 0);
        existing.individualOrders.push({ ...order }); // আলাদা একক অর্ডার হিসেবে যুক্ত

        // মার্জড আইটেম লিস্ট আপডেট
        (order.items || []).forEach((newItem) => {
          const found = existing.items.find(
            (it) =>
              (it.medicineId || it._id || it.name) ===
              (newItem.medicineId || newItem._id || newItem.name),
          );
          if (found) {
            found.quantity =
              Number(found.quantity || 0) + Number(newItem.quantity || 0);
            found.totalPrice =
              Number(found.totalPrice || 0) + Number(newItem.totalPrice || 0);
          } else {
            existing.items.push({ ...newItem });
          }
        });

        if (order.note && !existing.notes.includes(order.note)) {
          existing.notes.push(order.note);
        }

        if (order.address) existing.address = order.address;
        if (order.phone) existing.phone = order.phone;
      }

      dayGroups[key].totalValue += Number(order.grandTotal || 0);
    });

    return Object.values(dayGroups)
      .map((day) => ({
        ...day,
        mergedOrders: Object.values(day.customerMap).sort(
          (a, b) => new Date(b.orderDate) - new Date(a.orderDate),
        ),
      }))
      .sort((a, b) => b.startTime - a.startTime);
  }, [orders]);

  const toggleDay = (key) => {
    setExpandedDays((prev) => ({
      ...prev,
      [key]: prev[key] === false ? true : false,
    }));
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const updateStatus = async (id, orderStatus) => {
    try {
      const res = await axios.patch(`${API_URL}/api/orders/${id}`, {
        orderStatus,
      });

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Order Status Updated",
          timer: 1200,
          showConfirmButton: false,
        });
        loadOrders();
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "Update Failed" });
    }
  };

  const updatePayment = async (id, paymentStatus) => {
    try {
      const res = await axios.patch(`${API_URL}/api/orders/payment/${id}`, {
        paymentStatus,
      });

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Payment Status Updated",
          timer: 1200,
          showConfirmButton: false,
        });
        loadOrders();
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "Payment Update Failed" });
    }
  };

  const handleReturnItem = async (order, item) => {
    const medId = item.medicineId || item._id;
    const currentQty = Number(item.quantity);

    const { value: returnQty } = await Swal.fire({
      title: `Return Medicine`,
      html: `
        <div class="text-left text-sm space-y-2">
          <p class="font-bold text-slate-800">${item.medicineName || item.name}</p>
          <p class="text-slate-500">Ordered Quantity: <b>${currentQty} pcs</b></p>
          <p class="text-slate-500">Unit Price: <b>৳${item.unitPrice}</b></p>
          <hr class="my-2"/>
          <label class="block text-xs font-bold text-slate-700">How many units to return?</label>
        </div>
      `,
      input: "number",
      inputValue: 1,
      inputAttributes: {
        min: 1,
        max: currentQty,
        step: 1,
      },
      showCancelButton: true,
      confirmButtonText: "Confirm Return",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value || value <= 0) return "Please enter a valid quantity!";
        if (Number(value) > currentQty)
          return `You cannot return more than ${currentQty} units!`;
      },
    });

    if (!returnQty) return;

    try {
      Swal.fire({
        title: "Processing Return...",
        text: "Updating invoice and inventory...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.put(
        `${API_URL}/api/orders/${order._id}/return-item`,
        {
          medicineId: medId,
          returnQuantity: Number(returnQty),
        },
      );

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Product Returned Successfully!",
        });
        loadOrders();
      } else {
        Swal.fire({
          icon: "error",
          title: "Return Failed",
          text: res.data?.message || "Could not process return.",
        });
      }
    } catch (error) {
      console.error("Return error:", error);
      Swal.fire({
        icon: "error",
        title: "Return Error",
        text: error.response?.data?.message || "Could not process return.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div>
          <h2 className="text-xl font-bold text-slate-700">
            Loading Orders...
          </h2>
        </div>
      </div>
    );
  }

  const allTimeTotal = orders.reduce(
    (sum, o) => sum + Number(o.grandTotal || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                2 PM - 2 PM Business Cycle
              </span>
              <span className="text-xs text-slate-400">
                Single & Combined Invoices
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              Orders Management
            </h1>
            <p className="text-xs text-slate-500">
              Tap any order card to expand. You can print individual order
              invoices OR the combined daily invoice!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Placed
              </span>
              <span className="text-lg font-black text-slate-800">
                {orders.length} Orders
              </span>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 shadow-2xs text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                Total Revenue
              </span>
              <span className="text-lg font-black text-emerald-800">
                ৳{" "}
                {allTimeTotal.toLocaleString("en-BD", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {groupedOrders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <FaBoxes className="mx-auto text-5xl text-slate-300" />
            <h2 className="mt-4 text-xl font-bold text-slate-700">
              No Orders Found
            </h2>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedOrders.map((dayGroup, groupIdx) => {
              const isCollapsed = expandedDays[dayGroup.cycleKey] === false;

              return (
                <div
                  key={dayGroup.cycleKey}
                  className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden"
                >
                  {/* DAY BANNER */}
                  <div
                    onClick={() => toggleDay(dayGroup.cycleKey)}
                    className="cursor-pointer bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white transition hover:opacity-95"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <FaClock size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">
                              Day #{groupedOrders.length - groupIdx}
                            </span>
                            <span className="text-xs text-slate-400">
                              24-Hr Cycle (2:00 PM - 2:00 PM)
                            </span>
                          </div>
                          <h2 className="text-base font-black tracking-wide sm:text-lg">
                            {dayGroup.label}
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-right">
                          <span className="block text-[10px] font-bold uppercase text-slate-400">
                            Unique Invoices
                          </span>
                          <span className="text-base font-black text-white">
                            {dayGroup.mergedOrders.length} Invoices
                          </span>
                        </div>

                        <div className="text-right border-l border-slate-700 pl-4 sm:pl-6">
                          <span className="block text-[10px] font-bold uppercase text-emerald-400">
                            Day's Total Value
                          </span>
                          <span className="text-xl font-black text-emerald-400 sm:text-2xl">
                            ৳{" "}
                            {dayGroup.totalValue.toLocaleString("en-BD", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400"
                        >
                          {isCollapsed ? (
                            <FaChevronDown size={14} />
                          ) : (
                            <FaChevronUp size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ORDERS LIST IN THIS CYCLE */}
                  {!isCollapsed && (
                    <div className="p-5 sm:p-6 space-y-4 bg-slate-50/50">
                      {dayGroup.mergedOrders.map((order) => {
                        const isExpanded = !!expandedOrders[order._id];
                        const isMultiOrder = order.orderCount > 1;

                        const totalQuantity = (order.items || []).reduce(
                          (sum, it) => sum + Number(it.quantity || 0),
                          0,
                        );

                        return (
                          <div
                            key={order._id}
                            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition duration-200 hover:shadow-md"
                          >
                            {/* CLICKABLE CARD HEADER (ট্যাপ দিলে ফুল ভিউ দেখাবে) */}
                            <div
                              onClick={() => toggleOrderDetails(order._id)}
                              className="cursor-pointer p-4 sm:p-5 transition hover:bg-slate-50/70"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                {/* Left Side: Customer & Invoice Info */}
                                <div className="flex items-start gap-3.5">
                                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <FaReceipt size={18} />
                                  </div>

                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="text-base font-black text-slate-900">
                                        {order.customerName}
                                      </h3>

                                      {isMultiOrder ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black text-purple-800 border border-purple-200 animate-pulse">
                                          <FaLayerGroup size={10} />
                                          {order.orderCount} Orders Today
                                        </span>
                                      ) : (
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                          1 Single Order
                                        </span>
                                      )}
                                    </div>

                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                                        <FaPhoneAlt className="text-slate-400 text-[10px]" />
                                        {order.phone || "No phone"}
                                      </span>
                                      <span>•</span>
                                      <span>
                                        {order.items?.length || 0} medicines (
                                        {totalQuantity} units)
                                      </span>
                                      <span>•</span>
                                      <span>
                                        {new Date(
                                          order.orderDate,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Side: Total Amount & Expand Trigger */}
                                <div className="flex items-center justify-between sm:justify-end gap-5 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                                  <div className="text-left sm:text-right">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                                      Total Invoice Payable
                                    </span>
                                    <span className="text-xl font-black text-emerald-700">
                                      ৳{" "}
                                      {Number(order.grandTotal).toLocaleString(
                                        "en-BD",
                                        { minimumFractionDigits: 2 },
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                                      {isExpanded
                                        ? "Hide Details"
                                        : "Tap for Full View"}
                                    </span>
                                    <button
                                      type="button"
                                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                                    >
                                      {isExpanded ? (
                                        <FaChevronUp size={12} />
                                      ) : (
                                        <FaChevronDown size={12} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* FULL DETAILS VIEW (ট্যাপ করলে প্রদর্শিত হবে) */}
                            {isExpanded && (
                              <div className="border-t border-slate-100 bg-slate-50/80 p-5 space-y-5">
                                {/* CUSTOMER ADDRESS & STATUS CONTROLS */}
                                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                                  <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                      Delivery Address & Info
                                    </h4>
                                    <div className="space-y-1.5 text-xs text-slate-700">
                                      <p className="flex items-start gap-2">
                                        <FaMapMarkerAlt className="mt-0.5 text-slate-400 shrink-0" />
                                        <span>
                                          <b>Address:</b>{" "}
                                          {order.address ||
                                            "No delivery address"}
                                        </span>
                                      </p>
                                      <p className="text-slate-500">
                                        <b>Email:</b> {order.customerEmail}
                                      </p>
                                      {order.notes?.length > 0 && (
                                        <div className="mt-2 rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-900 border border-amber-200">
                                          <b>Customer Instructions / Notes:</b>
                                          <ul className="list-disc list-inside mt-0.5">
                                            {order.notes.map((n, i) => (
                                              <li key={i}>{n}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick Status Modifiers */}
                                  <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                      Update Order Status
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-500">
                                          Payment Status
                                        </label>
                                        <select
                                          value={order.paymentStatus}
                                          onChange={(e) =>
                                            updatePayment(
                                              order._id,
                                              e.target.value,
                                            )
                                          }
                                          className={`mt-1 w-full rounded-xl border p-2 text-xs font-bold outline-none ${
                                            order.paymentStatus === "Paid"
                                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                              : "border-red-200 bg-red-50 text-red-600"
                                          }`}
                                        >
                                          <option value="Unpaid">Unpaid</option>
                                          <option value="Paid">Paid</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="text-[10px] font-bold text-slate-500">
                                          Delivery Status
                                        </label>
                                        <select
                                          value={order.orderStatus}
                                          onChange={(e) =>
                                            updateStatus(
                                              order._id,
                                              e.target.value,
                                            )
                                          }
                                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white"
                                        >
                                          <option value="Pending">
                                            Pending
                                          </option>
                                          <option value="Processing">
                                            Processing
                                          </option>
                                          <option value="Completed">
                                            Completed
                                          </option>
                                          <option value="Cancelled">
                                            Cancelled
                                          </option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* =========================================================================
                                    ★ প্রতি অর্ডারের আলাদা আলাদা ইনভয়েস বাটন
                                ========================================================================= */}
                                {isMultiOrder && (
                                  <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4">
                                    <h4 className="text-xs font-black uppercase text-purple-950 mb-2.5 flex items-center gap-1.5">
                                      <FaPrint className="text-purple-700" />
                                      Print Individual Order Invoices (
                                      {order.individualOrders?.length} Orders)
                                    </h4>
                                    <p className="text-[11px] text-purple-800 mb-3">
                                      নিচে এই কাস্টমারের প্রতিটি আলাদা অর্ডারের
                                      তালিকা দেওয়া হলো। আপনি চাইলে যেকোনো
                                      অর্ডারের একক মেমো প্রিন্ট করতে পারেন:
                                    </p>

                                    <div className="grid gap-2.5 sm:grid-cols-2">
                                      {order.individualOrders?.map(
                                        (singleOrd, sIdx) => (
                                          <div
                                            key={singleOrd._id || sIdx}
                                            className="flex items-center justify-between rounded-xl border border-purple-200 bg-white p-3 shadow-2xs"
                                          >
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-black text-purple-800">
                                                  #{sIdx + 1}
                                                </span>
                                                <span className="text-xs font-bold text-slate-800">
                                                  {singleOrd.items?.length || 0}{" "}
                                                  Products
                                                </span>
                                              </div>
                                              <span className="text-[10px] text-slate-400 mt-0.5 block">
                                                Time:{" "}
                                                {new Date(
                                                  singleOrd.orderDate,
                                                ).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}{" "}
                                                • Total: ৳{singleOrd.grandTotal}
                                              </span>
                                            </div>

                                            {/* আলাদা সিঙ্গেল অর্ডারের ইনভয়েস লিংক */}
                                            <Link
                                              to={`/dashboard/invoice/${singleOrd._id}`}
                                              state={{
                                                combinedOrder: singleOrd,
                                              }}
                                              className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-purple-700"
                                              title="Print only this single order invoice"
                                            >
                                              <FaFileInvoice size={11} />
                                              <span>Single Invoice</span>
                                            </Link>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* COMBINED MEDICINE ITEMS LIST */}
                                <div>
                                  <div className="mb-2 flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                                      Medicines in this Combined Invoice (
                                      {order.items?.length || 0})
                                    </h4>
                                    <span className="text-xs font-bold text-emerald-700">
                                      Total Units: {totalQuantity} pcs
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                    <table className="w-full text-left text-xs">
                                      <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase text-slate-400">
                                        <tr>
                                          <th className="px-4 py-3">
                                            Medicine Name
                                          </th>
                                          <th className="px-4 py-3">Company</th>
                                          <th className="px-4 py-3 text-center">
                                            Total Quantity
                                          </th>
                                          <th className="px-4 py-3 text-right">
                                            Unit Price
                                          </th>
                                          <th className="px-4 py-3 text-right">
                                            Subtotal
                                          </th>
                                          <th className="px-4 py-3 text-center">
                                            Action
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody className="divide-y divide-slate-100">
                                        {(order.items || []).map(
                                          (item, itemIdx) => (
                                            <tr
                                              key={itemIdx}
                                              className="hover:bg-slate-50/60"
                                            >
                                              <td className="px-4 py-3 font-bold text-slate-800">
                                                {item.medicineName || item.name}
                                              </td>
                                              <td className="px-4 py-3 text-slate-400">
                                                {item.company ||
                                                  "Certified Generic"}
                                              </td>
                                              <td className="px-4 py-3 text-center font-bold text-slate-700">
                                                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800 border border-emerald-100">
                                                  {item.quantity} pcs
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 text-right text-slate-600">
                                                ৳{" "}
                                                {Number(item.unitPrice).toFixed(
                                                  2,
                                                )}
                                              </td>
                                              <td className="px-4 py-3 text-right font-black text-emerald-700">
                                                ৳{" "}
                                                {Number(
                                                  item.totalPrice,
                                                ).toFixed(2)}
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleReturnItem(
                                                      order,
                                                      item,
                                                    )
                                                  }
                                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
                                                  title="Return/Refund item"
                                                >
                                                  <FaUndo size={9} />
                                                  <span>Return</span>
                                                </button>
                                              </td>
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* COMBINED INVOICE FOOTER */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
                                  <div className="text-xs text-slate-500">
                                    {isMultiOrder ? (
                                      <span>
                                        Merged Database Order IDs:{" "}
                                        <b>
                                          {order.originalOrderIds.join(", ")}
                                        </b>
                                      </span>
                                    ) : (
                                      <span>
                                        Order ID: <b>{order._id}</b>
                                      </span>
                                    )}
                                  </div>

                                  {/* সব অর্ডার একত্র করে ১টি ইনভয়েস প্রিন্ট করার বাটন */}
                                  <Link
                                    to={`/dashboard/invoice/${order._id}`}
                                    state={{ combinedOrder: order }}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white shadow-xs transition hover:bg-slate-800"
                                  >
                                    <FaFileInvoice className="text-emerald-400" />
                                    <span>
                                      {isMultiOrder
                                        ? "Print Combined 1 Invoice"
                                        : "Print Invoice"}
                                    </span>
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AllOrders;
