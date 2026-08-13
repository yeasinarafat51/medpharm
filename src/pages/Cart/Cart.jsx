import useCart from "../../hooks/useCart";
import { FaPlus, FaMinus, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";

function Cart() {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart } =
    useCart();

  const grandTotal = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0,
  );

  if (cart.length === 0) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center">
        <h2 className="text-4xl font-bold text-gray-600">Your Cart is Empty</h2>

        <Link to="/" className="mt-6 rounded bg-blue-600 px-6 py-3 text-white">
          Browse Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-8 text-4xl font-bold text-blue-700">Shopping Cart</h1>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="table w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th>Medicine</th>

              <th>Price</th>

              <th>Qty</th>

              <th>Total</th>

              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {cart.map((item) => (
              <tr key={item._id}>
                <td>{item.medicineName}</td>

                <td>৳ {item.sellingPrice}</td>

                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decreaseQuantity(item._id)}
                      className="rounded bg-red-500 p-2 text-white"
                    >
                      <FaMinus />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => increaseQuantity(item._id)}
                      className="rounded bg-green-600 p-2 text-white"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </td>

                <td>৳ {(item.sellingPrice * item.quantity).toFixed(2)}</td>

                <td>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="rounded bg-red-600 p-2 text-white"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 flex justify-end">
        <div className="w-80 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">Order Summary</h2>

          <div className="mb-6 flex justify-between text-xl">
            <span>Grand Total</span>

            <span>৳ {grandTotal.toFixed(2)}</span>
          </div>

          <Link
            to="/checkout"
            className="block rounded bg-blue-600 py-3 text-center text-white"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;
