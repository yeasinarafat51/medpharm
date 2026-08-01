import { useEffect, useState } from "react";
import axios from "axios";

function SalesReport() {
  const [report, setReport] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    totalOrders: 0,
  });

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const loadReport = async () => {
    try {
      setLoading(true);

      // Sales Report
      const res = await axios.get(
        "https://medpharm-server-sgs6.vercel.app/api/dashboard/sales-report",
      );

      setReport(res.data);

      // Recent Orders
      const orderRes = await axios.get(
        "https://medpharm-server-sgs6.vercel.app/api/dashboard/recent-orders",
      );

      setOrders(orderRes.data.orders);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <h2 className="text-3xl font-bold text-blue-600">
          Loading Sales Report...
        </h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-blue-700">Sales Report</h1>

        <p className="mt-2 text-gray-500">MedPharm Sales Analytics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-green-600 p-6 text-white shadow-lg">
          <h3 className="text-lg">Total Revenue</h3>

          <h2 className="mt-3 text-4xl font-bold">৳ {report.totalRevenue}</h2>
        </div>

        <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg">
          <h3 className="text-lg">Today's Revenue</h3>

          <h2 className="mt-3 text-4xl font-bold">৳ {report.todayRevenue}</h2>
        </div>

        <div className="rounded-2xl bg-purple-600 p-6 text-white shadow-lg">
          <h3 className="text-lg">Monthly Revenue</h3>

          <h2 className="mt-3 text-4xl font-bold">৳ {report.monthRevenue}</h2>
        </div>

        <div className="rounded-2xl bg-orange-500 p-6 text-white shadow-lg">
          <h3 className="text-lg">Total Orders</h3>

          <h2 className="mt-3 text-4xl font-bold">{report.totalOrders}</h2>
        </div>
      </div>
      <div className="mt-12 overflow-x-auto rounded-xl bg-white shadow">
        <div className="border-b p-5">
          <h2 className="text-2xl font-bold">Recent Orders</h2>
        </div>

        <table className="min-w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Medicine</th>

              <th className="px-4 py-3 text-left">Customer</th>

              <th className="px-4 py-3 text-left">Quantity</th>

              <th className="px-4 py-3 text-left">Price</th>

              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{order.medicineName}</td>

                <td className="px-4 py-3">{order.customerName}</td>

                <td className="px-4 py-3">{order.quantity}</td>

                <td className="px-4 py-3">৳ {order.totalPrice}</td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold
              ${
                order.status === "Delivered"
                  ? "bg-green-100 text-green-700"
                  : order.status === "Cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SalesReport;
