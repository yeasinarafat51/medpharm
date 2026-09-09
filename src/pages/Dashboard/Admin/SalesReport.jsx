import { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../../../hooks/useAuth";

const API_URL =
  import.meta.env.VITE_API_URL || "https://medpharm-server-sgs6.vercel.app";

function SalesReport() {
  const { user } = useAuth();

  const [report, setReport] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    totalOrders: 0,
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user) {
        setLoading(false);
        setError("Please login first.");
        return;
      }

      const token = await user.getIdToken();

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [reportRes, orderRes] = await Promise.all([
        axios.get(`${API_URL}/api/dashboard/sales-report`, config),
        axios.get(`${API_URL}/api/dashboard/recent-orders`, config),
      ]);

      if (reportRes.data?.success) {
        setReport({
          totalRevenue: Number(reportRes.data.totalRevenue || 0),
          todayRevenue: Number(reportRes.data.todayRevenue || 0),
          monthRevenue: Number(reportRes.data.monthRevenue || 0),
          totalOrders: Number(reportRes.data.totalOrders || 0),
        });
      }

      if (orderRes.data?.success) {
        setOrders(
          Array.isArray(orderRes.data.orders) ? orderRes.data.orders : [],
        );
      }
    } catch (error) {
      console.error("Sales Report Error:", error);

      if (error.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else if (error.response?.status === 403) {
        setError("You do not have permission to access the sales report.");
      } else {
        setError(
          error.response?.data?.message || "Failed to load sales report.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [user]);

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getOrderItems = (order) => {
    return Array.isArray(order.items) ? order.items : [];
  };

  const getMedicineNames = (order) => {
    const items = getOrderItems(order);

    if (items.length > 0) {
      return items
        .map((item) => item.medicineName || item.name || "Medicine")
        .join(", ");
    }

    return order.medicineName || "Medicine";
  };

  const getQuantity = (order) => {
    const items = getOrderItems(order);

    if (items.length > 0) {
      return items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      );
    }

    return Number(order.quantity || 0);
  };

  const getOrderTotal = (order) => {
    return Number(order.grandTotal || 0);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      case "Processing":
        return "bg-blue-100 text-blue-700";

      case "Shipped":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>

          <h2 className="text-2xl font-bold text-blue-600">
            Loading Sales Report...
          </h2>

          <p className="mt-2 text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-red-50 p-8 text-center shadow-lg">
          <h2 className="mb-3 text-2xl font-bold text-red-600">
            Sales Report Error
          </h2>

          <p className="mb-6 text-gray-600">{error}</p>

          <button
            onClick={loadReport}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-bold text-blue-700 sm:text-4xl">
          Sales Report
        </h1>

        <p className="mt-2 text-gray-500">MedPharm Sales Analytics</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-green-600 p-6 text-white shadow-lg">
          <p className="text-base font-medium">Total Sales</p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            ৳ {formatCurrency(report.totalRevenue)}
          </h2>

          <p className="mt-2 text-sm text-green-100">Total amount sold</p>
        </div>

        <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg">
          <p className="text-base font-medium">Today's Sales</p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            ৳ {formatCurrency(report.todayRevenue)}
          </h2>

          <p className="mt-2 text-sm text-blue-100">Today's total sales</p>
        </div>

        <div className="rounded-2xl bg-purple-600 p-6 text-white shadow-lg">
          <p className="text-base font-medium">Monthly Sales</p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            ৳ {formatCurrency(report.monthRevenue)}
          </h2>

          <p className="mt-2 text-sm text-purple-100">Current month's sales</p>
        </div>

        <div className="rounded-2xl bg-orange-500 p-6 text-white shadow-lg">
          <p className="text-base font-medium">Total Orders</p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            {report.totalOrders.toLocaleString()}
          </h2>

          <p className="mt-2 text-sm text-orange-100">
            Completed sales records
          </p>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl bg-white shadow-lg sm:mt-12">
        <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Recent Orders</h2>

            <p className="mt-1 text-sm text-gray-500">Latest 10 orders</p>
          </div>

          <button
            onClick={loadReport}
            className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-4 text-left">#</th>

                <th className="px-4 py-4 text-left">Medicine</th>

                <th className="px-4 py-4 text-left">Customer</th>

                <th className="px-4 py-4 text-left">Quantity</th>

                <th className="px-4 py-4 text-left">Total</th>

                <th className="px-4 py-4 text-left">Payment</th>

                <th className="px-4 py-4 text-left">Status</th>

                <th className="px-4 py-4 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No recent orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => {
                  const medicineNames = getMedicineNames(order);

                  const quantity = getQuantity(order);

                  const total = getOrderTotal(order);

                  const orderStatus = order.orderStatus || "Pending";

                  const paymentStatus = order.paymentStatus || "Unpaid";

                  return (
                    <tr
                      key={order._id}
                      className="border-b transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 font-medium text-gray-700">
                        {index + 1}
                      </td>

                      <td className="max-w-[250px] px-4 py-4">
                        <div className="truncate font-medium text-gray-800">
                          {medicineNames}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-800">
                          {order.customerName || "N/A"}
                        </div>

                        <div className="text-sm text-gray-500">
                          {order.customerEmail || "N/A"}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-medium">{quantity}</td>

                      <td className="px-4 py-4 font-semibold text-green-600">
                        ৳ {formatCurrency(total)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            paymentStatus === "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            orderStatus,
                          )}`}
                        >
                          {orderStatus}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {order.orderDate
                          ? new Date(order.orderDate).toLocaleDateString(
                              "en-BD",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "N/A"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalesReport;
