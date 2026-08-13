import useCart from "../../hooks/useCart";
import {
  FaPlus,
  FaMinus,
  FaTrash,
  FaArrowLeft,
  FaShoppingCart,
  FaCreditCard,
} from "react-icons/fa";
import { Link } from "react-router-dom";

function Cart() {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart } =
    useCart();

  // ==========================================
  // GRAND TOTAL
  // ==========================================

  const grandTotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.sellingPrice || 0) * Number(item.quantity || 0),
    0,
  );

  // ==========================================
  // TOTAL ITEMS
  // ==========================================

  const totalItems = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  // ==========================================
  // EMPTY CART
  // ==========================================

  if (cart.length === 0) {
    return (
      <div className="min-h-[75vh] bg-gray-50 px-4 py-10">
        <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-3xl bg-white p-8 text-center shadow-lg md:p-12">
            {/* Icon */}

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
              <FaShoppingCart className="text-5xl text-blue-600" />
            </div>

            {/* Title */}

            <h2 className="mt-6 text-3xl font-bold text-gray-800 md:text-4xl">
              Your Cart is Empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-gray-500">
              You haven't added any medicines to your cart yet. Browse our
              medicines and add your required items.
            </p>

            {/* Home Button */}

            <Link
              to="/"
              className="
                mt-7
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-blue-600
                px-7
                py-3
                font-semibold
                text-white
                shadow-md
                transition
                duration-300
                hover:bg-blue-700
                hover:shadow-lg
              "
            >
              <FaArrowLeft />
              Browse Medicines
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN CART
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        {/* ======================================
            HEADER
        ====================================== */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <FaShoppingCart className="text-xl text-blue-600" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
                  Shopping Cart
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {totalItems} {totalItems === 1 ? "item" : "items"} in your
                  cart
                </p>
              </div>
            </div>
          </div>

          {/* Continue Shopping */}

          <Link
            to="/"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-blue-600
              bg-white
              px-5
              py-3
              font-semibold
              text-blue-600
              transition
              duration-300
              hover:bg-blue-600
              hover:text-white
            "
          >
            <FaArrowLeft />
            Continue Shopping
          </Link>
        </div>

        {/* ======================================
            DESKTOP CART TABLE
        ====================================== */}

        <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}

              <thead>
                <tr className="bg-blue-600 text-left text-white">
                  <th className="px-6 py-5 font-semibold">Medicine</th>

                  <th className="px-6 py-5 font-semibold">Price</th>

                  <th className="px-6 py-5 text-center font-semibold">
                    Quantity
                  </th>

                  <th className="px-6 py-5 font-semibold">Total</th>

                  <th className="px-6 py-5 text-center font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              {/* Table Body */}

              <tbody>
                {cart.map((item) => {
                  const itemTotal =
                    Number(item.sellingPrice || 0) * Number(item.quantity || 0);

                  return (
                    <tr
                      key={item._id}
                      className="border-b border-gray-100 transition hover:bg-blue-50/40"
                    >
                      {/* Medicine */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          {/* Image */}

                          <div className="h-16 w-16 overflow-hidden rounded-xl bg-gray-100">
                            <img
                              src={item.image}
                              alt={item.medicineName}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>

                          <div>
                            <h3 className="font-bold text-gray-800">
                              {item.medicineName}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              {item.company || "Medicine"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Price */}

                      <td className="px-6 py-5">
                        <span className="font-semibold text-green-600">
                          ৳ {Number(item.sellingPrice || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Quantity */}

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => decreaseQuantity(item._id)}
                            disabled={item.quantity <= 1}
                            className="
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-full
                              bg-red-500
                              text-white
                              transition
                              hover:bg-red-600
                              disabled:cursor-not-allowed
                              disabled:bg-gray-300
                            "
                          >
                            <FaMinus size={12} />
                          </button>

                          <span className="flex h-9 min-w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 font-bold text-gray-800">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => increaseQuantity(item._id)}
                            className="
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-full
                              bg-green-600
                              text-white
                              transition
                              hover:bg-green-700
                            "
                          >
                            <FaPlus size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Total */}

                      <td className="px-6 py-5">
                        <span className="font-bold text-gray-800">
                          ৳ {itemTotal.toFixed(2)}
                        </span>
                      </td>

                      {/* Delete */}

                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="
                            inline-flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-lg
                            bg-red-100
                            text-red-600
                            transition
                            hover:bg-red-600
                            hover:text-white
                          "
                          title="Remove"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================
            MOBILE CART
        ====================================== */}

        <div className="space-y-4 md:hidden">
          {cart.map((item) => {
            const itemTotal =
              Number(item.sellingPrice || 0) * Number(item.quantity || 0);

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                {/* Medicine Info */}

                <div className="flex gap-3">
                  {/* Image */}

                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.medicineName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  {/* Name */}

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-gray-800">
                      {item.medicineName}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {item.company || "Medicine"}
                    </p>

                    <p className="mt-2 font-bold text-green-600">
                      ৳ {Number(item.sellingPrice || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* Delete */}

                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="
                      flex
                      h-9
                      w-9
                      flex-shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-red-100
                      text-red-600
                      transition
                      hover:bg-red-600
                      hover:text-white
                    "
                  >
                    <FaTrash size={14} />
                  </button>
                </div>

                {/* Bottom Section */}

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  {/* Quantity */}

                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-500">
                      Quantity
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decreaseQuantity(item._id)}
                        disabled={item.quantity <= 1}
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-full
                          bg-red-500
                          text-white
                          disabled:bg-gray-300
                        "
                      >
                        <FaMinus size={11} />
                      </button>

                      <span className="flex h-9 min-w-10 items-center justify-center rounded-lg border bg-gray-50 px-3 font-bold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => increaseQuantity(item._id)}
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-full
                          bg-green-600
                          text-white
                        "
                      >
                        <FaPlus size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}

                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500">
                      Item Total
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-800">
                      ৳ {itemTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ======================================
            BOTTOM SECTION
        ====================================== */}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Continue Shopping */}

          <div className="hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:block">
            <h3 className="text-xl font-bold text-gray-800">
              Need something else?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Continue browsing our medicine collection and add more items to
              your cart.
            </p>

            <Link
              to="/"
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-gray-100
                px-5
                py-3
                font-semibold
                text-gray-700
                transition
                hover:bg-blue-600
                hover:text-white
              "
            >
              <FaArrowLeft />
              Back to Home
            </Link>
          </div>

          {/* ==================================
              ORDER SUMMARY
          ================================== */}

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-7">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Order Summary
                </h2>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-600">
                  {totalItems} Items
                </span>
              </div>

              {/* Subtotal */}

              <div className="flex justify-between border-b border-gray-100 py-3 text-gray-600">
                <span>Subtotal</span>

                <span className="font-semibold text-gray-800">
                  ৳ {grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Delivery */}

              <div className="flex justify-between border-b border-gray-100 py-3 text-gray-600">
                <span>Delivery Charge</span>

                <span className="font-semibold text-green-600">Free</span>
              </div>

              {/* Grand Total */}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-gray-800">
                  Grand Total
                </span>

                <span className="text-3xl font-bold text-blue-600">
                  ৳ {grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Checkout */}

              <Link
                to="/checkout"
                className="
                  mt-6
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  py-4
                  font-bold
                  text-white
                  shadow-md
                  transition
                  duration-300
                  hover:bg-blue-700
                  hover:shadow-lg
                "
              >
                <FaCreditCard />
                Proceed to Checkout
              </Link>

              {/* Mobile Home */}

              <Link
                to="/"
                className="
                  mt-3
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  py-3
                  font-semibold
                  text-gray-700
                  transition
                  hover:border-blue-600
                  hover:text-blue-600
                  lg:hidden
                "
              >
                <FaArrowLeft />
                Continue Shopping
              </Link>

              <p className="mt-4 text-center text-xs text-gray-400">
                Secure checkout • Fast delivery • Quality medicines
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
