import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import useCart from "../../hooks/useCart";
import useAuth from "../../hooks/useAuth";

function Checkout() {
  const { cart, clearCart } = useCart();

  const { user } = useAuth();

  const navigate = useNavigate();

  const [address, setAddress] = useState("");

  const [phone, setPhone] = useState("");

  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  const grandTotal = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0,
  );
  console.log("Cart:", cart);
  const handleOrder = async () => {
    if (cart.length === 0) {
      return Swal.fire({
        icon: "warning",
        title: "Cart is Empty",
      });
    }

    if (!address || !phone) {
      return Swal.fire({
        icon: "warning",
        title: "Address & Phone Required",
      });
    }

    try {
      setLoading(true);

      const orderData = {
        customerName: user.displayName,
        customerEmail: user.email,

        address,
        phone,
        note,

        items: cart.map((item) => ({
          medicineId: item._id,
          medicineName: item.medicineName,
          company: item.company,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          totalPrice: item.sellingPrice * item.quantity,
        })),

        grandTotal,

        paymentStatus: "Unpaid",

        orderStatus: "Pending",

        orderDate: new Date(),
      };
      console.log("Order Data:", orderData);
      const res = await axios.post(
        "http://localhost:5000/api/orders",
        orderData,
      );

      if (res.data.success) {
        clearCart();

        Swal.fire({
          icon: "success",
          title: "Order Placed Successfully",
        });

        navigate("/my-orders");
      }
    } catch (error) {
      console.log(error);
      console.log(error.response?.data);

      Swal.fire({
        icon: "error",
        title: error.response?.data?.message || "Order Failed",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-8 text-4xl font-bold text-blue-700">Checkout</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <label className="font-semibold">Address</label>

          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-2 w-full rounded border p-3"
            rows={4}
          />

          <label className="mt-6 block font-semibold">Phone</label>

          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded border p-3"
          />

          <label className="mt-6 block font-semibold">Note</label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 w-full rounded border p-3"
            rows={3}
          />
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-2xl font-bold">Order Summary</h2>

          {cart.map((item) => (
            <div key={item._id} className="mb-3 flex justify-between">
              <span>
                {item.medicineName} × {item.quantity}
              </span>

              <span>৳ {(item.quantity * item.sellingPrice).toFixed(2)}</span>
            </div>
          ))}

          <hr className="my-5" />

          <div className="flex justify-between text-xl font-bold">
            <span>Grand Total</span>

            <span>৳ {grandTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={handleOrder}
            disabled={loading}
            className="mt-8 w-full rounded bg-blue-600 py-3 text-white hover:bg-blue-700"
          >
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
