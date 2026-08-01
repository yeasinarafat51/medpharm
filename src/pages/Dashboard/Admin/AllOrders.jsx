import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // =============================
  // Load Orders
  // =============================
  const loadOrders = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/orders");

      if (res.data.success) {
        setOrders(res.data.orders || []);
      } else {
        setOrders([]);
      }
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

  // =============================
  // Update Order Status
  // =============================
  const updateStatus = async (id, orderStatus) => {
    try {
      const res = await axios.patch(`http://localhost:5000/api/orders/${id}`, {
        orderStatus,
      });

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Order Updated",
          timer: 1200,
          showConfirmButton: false,
        });

        loadOrders();
      }
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
      });
    }
  };

  // =============================
  // Update Payment Status
  // =============================
  const updatePayment = async (id, paymentStatus) => {
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/orders/payment/${id}`,
        {
          paymentStatus,
        },
      );

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Payment Updated",
          timer: 1200,
          showConfirmButton: false,
        });

        loadOrders();
      }
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Payment Update Failed",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-3xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-8 text-4xl font-bold text-blue-700">
        All Customer Orders
      </h1>

      {orders.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow">
          <h2 className="text-2xl font-bold text-gray-500">No Orders Found</h2>
        </div>
      ) : (
        orders.map((order, orderIndex) => (
          <div
            key={order._id}
            className="mb-10 rounded-xl border bg-white shadow-lg"
          >
            {/* Header */}

            <div className="flex flex-wrap items-center justify-between border-b bg-blue-50 p-6">
              <div>
                <h2 className="text-xl font-bold text-blue-700">
                  Order #{orderIndex + 1}
                </h2>

                <p className="text-gray-600">
                  <strong>ID :</strong> {order._id}
                </p>

                <p className="text-gray-600">
                  <strong>Date :</strong>{" "}
                  {new Date(order.orderDate).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <h2 className="text-3xl font-bold text-green-600">
                  ৳ {order.grandTotal}
                </h2>

                <p className="text-gray-500">
                  Total {order.items?.length || 0} Medicine
                </p>
              </div>
            </div>

            {/* Customer */}

            <div className="grid gap-4 border-b p-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-lg font-bold">Customer Info</h3>

                <p>
                  <strong>Name :</strong> {order.customerName}
                </p>

                <p>
                  <strong>Email :</strong> {order.customerEmail}
                </p>

                <p>
                  <strong>Phone :</strong> {order.phone}
                </p>

                <p>
                  <strong>Address :</strong> {order.address}
                </p>

                <p>
                  <strong>Note :</strong> {order.note || "N/A"}
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-bold">Status</h3>

                <div className="space-y-4">
                  <div>
                    <label className="font-semibold">Payment Status</label>

                    <select
                      value={order.paymentStatus}
                      onChange={(e) => updatePayment(order._id, e.target.value)}
                      className="mt-2 w-full rounded border p-2"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold">Order Status</label>

                    <select
                      value={order.orderStatus}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="mt-2 w-full rounded border p-2"
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

            {/* Medicines */}

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Company</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {(order.items || []).map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>

                      <td>{item.medicineName}</td>

                      <td>{item.company}</td>

                      <td>{item.quantity}</td>

                      <td>৳ {item.unitPrice}</td>

                      <td className="font-bold text-green-600">
                        ৳ {item.totalPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}

            <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-6">
              <div>
                <span
                  className={`rounded-full px-4 py-2 text-white ${
                    order.orderStatus === "Pending"
                      ? "bg-yellow-500"
                      : order.orderStatus === "Processing"
                        ? "bg-blue-600"
                        : order.orderStatus === "Completed"
                          ? "bg-green-600"
                          : "bg-red-600"
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>

              <div>
                <span
                  className={`rounded-full px-4 py-2 text-white ${
                    order.paymentStatus === "Paid"
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              <td>
                <Link
                  to={`/dashboard/invoice/${order._id}`}
                  className="rounded bg-indigo-600 px-4 py-2 text-white"
                >
                  View Invoice
                </Link>
              </td>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default AllOrders;
