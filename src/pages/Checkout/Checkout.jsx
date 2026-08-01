import { useState, useEffect } from "react";
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

  // Load Address & Phone from Database
  useEffect(() => {
    const loadUser = async () => {
      if (!user?.email) return;

      try {
        const res = await axios.get(
          `https://medpharm-server-sgs6.vercel.app/api/users/email/${user.email}`,
        );

        if (res.data.success) {
          setAddress(res.data.user.address || "");
          setPhone(res.data.user.phone || "");
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadUser();
  }, [user]);

  const grandTotal = cart.reduce(
    (sum, item) => sum + Number(item.sellingPrice) * Number(item.quantity),
    0,
  );

  const handleOrder = async () => {
    if (cart.length === 0) {
      return Swal.fire({
        icon: "warning",
        title: "Cart is Empty",
      });
    }

    if (!address.trim() || !phone.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "Address & Phone Required",
      });
    }

    try {
      setLoading(true);

      // Update latest Address & Phone
      await axios.put(
        `https://medpharm-server-sgs6.vercel.app/api/users/email/${user.email}`,
        {
          address,
          phone,
        },
      );

      const orderData = {
        customerName: user.displayName,
        customerEmail: user.email,
        uid: user.uid,

        address,
        phone,
        note,

        items: cart.map((item) => ({
          medicineId: item._id,
          medicineName: item.medicineName,
          company: item.company,

          quantity: Number(item.quantity),

          // MRP
          mrp: Number(item.mrpePrice),

          // Discount %
          discount: Number(item.bikriPercent),

          // Selling Price
          unitPrice: Number(item.sellingPrice),

          // Total
          totalPrice: Number(item.sellingPrice) * Number(item.quantity),
        })),

        grandTotal,

        paymentStatus: "Unpaid",
        orderStatus: "Pending",
        orderDate: new Date(),
      };

      console.log(orderData);

      const res = await axios.post(
        "https://medpharm-server-sgs6.vercel.app/api/orders",
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
            rows={4}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-2 w-full rounded border p-3"
          />

          <label className="mt-6 block font-semibold">Phone Number</label>

          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded border p-3"
          />

          <label className="mt-6 block font-semibold">Note</label>

          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 w-full rounded border p-3"
          />
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-2xl font-bold">Order Summary</h2>

          {cart.map((item) => (
            <div
              key={item._id}
              className="mb-4 rounded-lg border p-3 shadow-sm"
            >
              <h3 className="font-bold text-lg">{item.medicineName}</h3>

              <div className="mt-2 flex justify-between">
                <span>MRP</span>
                <span>৳ {item.mrpePrice}</span>
              </div>

              <div className="flex justify-between">
                <span>Discount</span>
                <span>{item.bikriPercent}%</span>
              </div>

              <div className="flex justify-between">
                <span>Selling Price</span>
                <span>৳ {item.sellingPrice}</span>
              </div>

              <div className="flex justify-between">
                <span>Quantity</span>
                <span>{item.quantity}</span>
              </div>

              <div className="flex justify-between font-bold text-green-600">
                <span>Total</span>
                <span>৳ {(item.quantity * item.sellingPrice).toFixed(2)}</span>
              </div>
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
            className="mt-8 w-full rounded bg-blue-600 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
