import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useAuth from "../../../hooks/useAuth";

function MyOrders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/api/orders/my-orders/${user.email}`,
      );

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
  }, [user]);

  if (loading) {
    return (
      <div className="py-20 text-center text-2xl font-bold">Loading...</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-700">My Orders</h1>

        <p className="mt-2 text-gray-500">
          Here are all of your medicine orders.
        </p>
      </div>{" "}
      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="min-w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3">#</th>

              <th className="px-4 py-3">Medicine</th>

              <th className="px-4 py-3">Company</th>

              <th className="px-4 py-3">Quantity</th>

              <th className="px-4 py-3">Unit Price</th>

              <th className="px-4 py-3">Total Price</th>

              <th className="px-4 py-3">Status</th>

              <th className="px-4 py-3">Order Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-gray-500">
                  No Orders Found
                </td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <tr key={order._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          order.image ||
                          "https://placehold.co/60x60?text=Medicine"
                        }
                        alt={order.medicineName}
                        className="h-14 w-14 rounded-lg object-cover border"
                      />

                      <div>
                        <h3 className="font-semibold">{order.medicineName}</h3>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">{order.company}</td>

                  <td className="px-4 py-3 font-semibold">{order.quantity}</td>

                  <td className="px-4 py-3">৳ {order.unitPrice}</td>

                  <td className="px-4 py-3 font-bold text-green-600">
                    ৳ {order.totalPrice}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-4 py-1 text-sm font-semibold text-white
                      ${
                        order.status === "Pending"
                          ? "bg-yellow-500"
                          : order.status === "Processing"
                            ? "bg-blue-600"
                            : "bg-green-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyOrders;
