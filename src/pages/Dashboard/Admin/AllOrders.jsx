import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/orders");

      setOrders(res.data);
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Failed to load orders",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/orders/${id}`, { status });

      Swal.fire({
        icon: "success",
        title: "Status Updated",
        timer: 1200,
        showConfirmButton: false,
      });

      loadOrders();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-2xl font-bold">Loading...</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-700">All Orders</h1>

        <p className="text-gray-500 mt-2">Manage customer medicine orders.</p>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3">#</th>

              <th className="px-4 py-3">Customer</th>

              <th className="px-4 py-3">Medicine</th>

              <th className="px-4 py-3">Qty</th>

              <th className="px-4 py-3">Unit Price</th>

              <th className="px-4 py-3">Total</th>

              <th className="px-4 py-3">Status</th>

              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order, index) => (
              <tr key={order._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{index + 1}</td>

                <td className="px-4 py-3">
                  <h3 className="font-semibold">{order.customerName}</h3>

                  <p className="text-sm text-gray-500">{order.customerEmail}</p>
                </td>

                <td className="px-4 py-3">{order.medicineName}</td>

                <td className="px-4 py-3">{order.quantity}</td>

                <td className="px-4 py-3">৳ {order.unitPrice}</td>

                <td className="px-4 py-3 font-bold text-green-600">
                  ৳ {order.totalPrice}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm

                    ${
                      order.status === "Pending"
                        ? "bg-yellow-500"
                        : order.status === "Processing"
                          ? "bg-blue-600"
                          : "bg-green-600"
                    }

                    `}
                  >
                    {order.status}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option>Pending</option>

                    <option>Processing</option>

                    <option>Completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AllOrders;
