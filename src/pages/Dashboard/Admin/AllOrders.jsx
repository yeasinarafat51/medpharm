import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import {
  FaUndo,
  FaTrashAlt,
  FaFileInvoice,
  FaBoxes,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";

const API_URL =
  import.meta.env.VITE_API_URL || "https://medpharm-server-3.onrender.com";

function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // =============================
  // Load Orders
  // =============================
  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/orders`);

      if (res.data.success) {
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

  // =============================
  // Update Order Status
  // =============================
  const updateStatus = async (id, orderStatus) => {
    try {
      const res = await axios.patch(`${API_URL}/api/orders/${id}`, {
        orderStatus,
      });

      if (res.data.success) {
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

  // =============================
  // Update Payment Status
  // =============================
  const updatePayment = async (id, paymentStatus) => {
    try {
      const res = await axios.patch(`${API_URL}/api/orders/payment/${id}`, {
        paymentStatus,
      });

      if (res.data.success) {
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

  // =========================================================================
  // RETURN PRODUCT / UPDATE INVOICE & RESTOCK
  // =========================================================================
  const handleReturnItem = async (order, item) => {
    const medId = item.medicineId || item._id;
    const currentQty = Number(item.quantity);

    // সুইট অ্যালার্ট দিয়ে কোয়ান্টিটি ইনপুট নেওয়া
    const { value: returnQty } = await Swal.fire({
      title: `Return Medicine`,
      html: `
        <div class="text-left text-sm space-y-2">
          <p class="font-bold text-slate-800">${item.medicineName}</p>
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
      confirmButtonText: "Confirm Return & Restock",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value || value <= 0) {
          return "Please enter a valid quantity!";
        }
        if (Number(value) > currentQty) {
          return `You cannot return more than ${currentQty} units!`;
        }
      },
    });

    if (!returnQty) return;

    const qtyToReturn = Number(returnQty);

    try {
      Swal.fire({
        title: "Processing Return...",
        text: "Updating invoice and restocking medicine...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // ব্যাকএন্ড API কল
      const res = await axios.put(
        `${API_URL}/api/orders/${order._id}/return-item`,
        {
          medicineId: medId,
          returnQuantity: qtyToReturn,
        },
      );

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Product Returned Successfully!",
          html: `
            <p><b>${qtyToReturn} pcs</b> of <i>${item.medicineName}</i> has been removed from this order.</p>
            <p class="text-xs text-green-600 mt-2">Inventory stock automatically updated!</p>
          `,
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
        text:
          error.response?.data?.message ||
          "Could not return product. Make sure the return API is active.",
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

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Customer Order Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage deliveries, payments, and product returns/refunds.
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
        >
          <span>Total Orders: {orders.length}</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <FaBoxes className="mx-auto text-5xl text-slate-300" />
          <h2 className="mt-4 text-xl font-bold text-slate-600">
            No Orders Found
          </h2>
          <p className="text-xs text-slate-400">
            New customer orders will appear here.
          </p>
        </div>
      ) : (
        orders.map((order, orderIndex) => (
          <div
            key={order._id}
            className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
          >
            {/* ORDER HEADER */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/80 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-600 px-2.5 py-0.5 text-xs font-black text-white">
                    Order #{orderIndex + 1}
                  </span>
                  <span className="text-xs text-slate-400">
                    ID: {order._id}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <FaCalendarAlt className="text-slate-400 text-xs" />
                  {new Date(order.orderDate).toLocaleString("en-BD", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Grand Total
                </span>
                <h2 className="text-2xl font-black text-emerald-700">
                  ৳{" "}
                  {Number(order.grandTotal || 0).toLocaleString("en-BD", {
                    minimumFractionDigits: 2,
                  })}
                </h2>
                <span className="text-[11px] text-slate-500">
                  {order.items?.length || 0} Products Included
                </span>
              </div>
            </div>

            {/* CUSTOMER & STATUS */}
            <div className="grid gap-6 border-b border-slate-100 p-5 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Customer Details
                </h3>
                <div className="space-y-1.5 text-sm text-slate-700">
                  <p className="font-bold text-slate-800">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {order.customerEmail}
                  </p>
                  <p className="flex items-center gap-2 text-xs">
                    <FaPhoneAlt className="text-slate-400" />
                    <span>{order.phone || "No phone provided"}</span>
                  </p>
                  <p className="flex items-start gap-2 text-xs">
                    <FaMapMarkerAlt className="text-slate-400 mt-0.5" />
                    <span>{order.address || "No delivery address"}</span>
                  </p>
                  {order.note && (
                    <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800 border border-amber-100">
                      <b>Note:</b> {order.note}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Order Management
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      Payment Status
                    </label>
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => updatePayment(order._id, e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      Delivery Status
                    </label>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* MEDICINES TABLE WITH RETURN ACTION */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Medicine</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3 text-center">Qty</th>
                    <th className="px-5 py-3 text-right">Unit Price</th>
                    <th className="px-5 py-3 text-right">Total Price</th>
                    <th className="px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {item.medicineName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {item.company || "N/A"}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                        <span className="rounded bg-slate-100 px-2 py-1">
                          {item.quantity} pcs
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-600">
                        ৳ {Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-emerald-700">
                        ৳ {Number(item.totalPrice).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {/* RETURN BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleReturnItem(order, item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
                          title="Return/Refund item & update invoice"
                        >
                          <FaUndo className="text-[10px]" />
                          <span>Return Item</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ORDER FOOTER */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 p-4 sm:px-6">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                    order.orderStatus === "Pending"
                      ? "bg-amber-500"
                      : order.orderStatus === "Processing"
                        ? "bg-blue-600"
                        : order.orderStatus === "Completed"
                          ? "bg-emerald-600"
                          : "bg-red-600"
                  }`}
                >
                  {order.orderStatus}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                    order.paymentStatus === "Paid"
                      ? "bg-emerald-600"
                      : "bg-red-500"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              <div>
                <Link
                  to={`/dashboard/invoice/${order._id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-900"
                >
                  <FaFileInvoice className="text-slate-400" />
                  <span>View Updated Invoice</span>
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default AllOrders;
