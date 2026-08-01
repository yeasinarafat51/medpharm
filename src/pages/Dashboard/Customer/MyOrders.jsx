import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";

function MyOrders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const loadOrders = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `https://medpharm-server-sgs6.vercel.app/api/orders/my-orders/${user.email}`,
        );

        console.log(res.data);

        if (res.data.success) {
          setOrders(res.data.orders || []);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.log(error);

        Swal.fire({
          icon: "error",
          title: "Failed to Load Orders",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <h2 className="text-3xl font-bold text-blue-600">Loading Orders...</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-8 text-4xl font-bold text-blue-700">My Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow">
          <h2 className="text-2xl font-bold text-gray-500">No Orders Found</h2>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="mb-8 rounded-xl bg-white shadow-lg">
            {/* Header */}

            <div className="flex flex-wrap items-center justify-between border-b bg-blue-50 p-6">
              <div>
                <h2 className="text-xl font-bold text-blue-700">Order ID</h2>

                <p className="break-all text-gray-500">{order._id}</p>

                <p className="mt-2 text-sm text-gray-500">
                  {new Date(order.orderDate).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <h2 className="text-3xl font-bold text-green-600">
                  ৳ {Number(order.grandTotal).toFixed(2)}
                </h2>

                <div className="mt-4 space-y-2">
                  <span
                    className={`inline-block rounded-full px-4 py-1 text-white ${
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

                  <br />

                  <span
                    className={`inline-block rounded-full px-4 py-1 text-white ${
                      order.paymentStatus === "Paid"
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Medicine List */}

            <div className="divide-y">
              {(order.items || []).map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        item.image ||
                        "https://placehold.co/100x100?text=Medicine"
                      }
                      alt={item.medicineName}
                      className="h-24 w-24 rounded-lg border object-cover"
                    />

                    <div>
                      <h3 className="text-xl font-bold">{item.medicineName}</h3>

                      <p className="text-gray-500">{item.company}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8 text-center">
                    <div>
                      <p className="text-gray-500">Quantity</p>

                      <h3 className="font-bold">{item.quantity}</h3>
                    </div>

                    <div>
                      <p className="text-gray-500">Unit Price</p>

                      <h3 className="font-bold">
                        ৳ {Number(item.unitPrice).toFixed(2)}
                      </h3>
                    </div>

                    <div>
                      <p className="text-gray-500">Total</p>

                      <h3 className="font-bold text-green-600">
                        ৳ {Number(item.totalPrice).toFixed(2)}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t p-6">
              <div className="space-y-2">
                <p>
                  <strong>Customer :</strong> {order.customerName}
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

                {order.note && (
                  <p>
                    <strong>Note :</strong> {order.note}
                  </p>
                )}
              </div>

              {order.invoiceNo ? (
                <Link
                  to={`/invoice/${order.invoiceNo}`}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                >
                  View Invoice
                </Link>
              ) : (
                <button
                  disabled
                  className="cursor-not-allowed rounded-lg bg-gray-400 px-6 py-3 text-white"
                >
                  Invoice Not Available
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MyOrders;
