import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useAuth from "../../../hooks/useAuth";
import useCart from "../../../hooks/useCart";

function AllItemMedicine() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [quantities, setQuantities] = useState({});

  const limit = 8;

  // ===============================
  // Load Medicines
  // ===============================

  const loadMedicine = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `https://medpharm-server-sgs6.vercel.app/api/medicines?search=${search}&page=${page}&limit=${limit}&sort=asc`,
      );

      setMedicines(res.data.medicines);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Failed to Load Medicines",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicine();
  }, [search, page]);

  // ===============================
  // Quantity
  // ===============================

  const increaseQty = (medicine) => {
    setQuantities((prev) => {
      const current = prev[medicine._id] || 1;

      if (current >= medicine.stock) return prev;

      return {
        ...prev,
        [medicine._id]: current + 1,
      };
    });
  };

  const decreaseQty = (medicine) => {
    setQuantities((prev) => {
      const current = prev[medicine._id] || 1;

      if (current <= 1) return prev;

      return {
        ...prev,
        [medicine._id]: current - 1,
      };
    });
  };

  // ===============================
  // Add To Cart
  // ===============================

  const handleAddToCart = (medicine) => {
    const qty = quantities[medicine._id] || 1;

    addToCart({
      ...medicine,
      quantity: qty,
    });

    Swal.fire({
      icon: "success",
      title: "Added To Cart",
      text: `${qty} item added successfully`,
      timer: 1200,
      showConfirmButton: false,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">All Medicines</h1>

          <p className="text-gray-500">
            Browse medicines and add them to your cart.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search medicine..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600 md:w-96"
        />
      </div>

      {loading ? (
        <div className="flex h-72 items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <>
          {/* Medicine Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
            {" "}
            {medicines.map((medicine) => (
              <div
                key={medicine._id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Mobile Layout */}
                <div className="flex p-3 lg:hidden">
                  {/* Image */}
                  <img
                    src={
                      medicine.image ||
                      "https://placehold.co/300x300?text=Medicine"
                    }
                    alt={medicine.medicineName}
                    className="h-24 w-24 rounded-xl object-cover"
                  />

                  {/* Content */}
                  <div className="ml-3 flex flex-1 flex-col justify-between">
                    <div className="  gap-4">
                      <div className=" items-center justify-between gap-2">
                        <h2 className="line-clamp-1 flex-1 text-base font-bold text-gray-800">
                          {medicine.medicineName}
                        </h2>

                        <div className="flex">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 whitespace-nowrap">
                            {medicine.category}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500">
                          {medicine.company}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Selling Price
                        </span>

                        <span className="text-xl font-bold text-green-600">
                          ৳ {medicine.sellingPrice}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
                          MRP ৳ {medicine.mrpePrice}
                        </span>

                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                          {medicine.bikriPercent}% OFF
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            medicine.stock > 10
                              ? "bg-green-100 text-green-700"
                              : medicine.stock > 0
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          Stock: {medicine.stock}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decreaseQty(medicine)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white"
                        >
                          -
                        </button>

                        <span className="w-6 text-center font-bold">
                          {quantities[medicine._id] || 1}
                        </span>

                        <button
                          onClick={() => increaseQty(medicine)}
                          disabled={
                            (quantities[medicine._id] || 1) >= medicine.stock
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white disabled:bg-gray-400"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleAddToCart(medicine)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:block">
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        medicine.image ||
                        "https://placehold.co/600x400?text=Medicine"
                      }
                      alt={medicine.medicineName}
                      className="h-56 w-full object-cover transition duration-500 hover:scale-110"
                    />

                    <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      {medicine.category}
                    </span>

                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${
                        medicine.stock > 10
                          ? "bg-green-600"
                          : medicine.stock > 0
                            ? "bg-yellow-500"
                            : "bg-red-600"
                      }`}
                    >
                      Stock {medicine.stock}
                    </span>
                  </div>

                  <div className="p-5">
                    <h2 className="line-clamp-1 text-xl font-bold">
                      {medicine.medicineName}
                    </h2>

                    <p className="text-gray-500">{medicine.company}</p>

                    <div className="mt-4 rounded-xl bg-gray-50 p-3">
                      <div className="flex justify-between">
                        <span>MRP</span>

                        <span className="line-through text-gray-400">
                          ৳ {medicine.mrpePrice}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between">
                        <span>Discount</span>

                        <span className="rounded-full bg-red-100 px-2 py-1 text-red-600">
                          {medicine.bikriPercent}% OFF
                        </span>
                      </div>

                      <div className="mt-3 flex justify-between">
                        <span>Selling Price</span>

                        <span className="text-2xl font-bold text-green-600">
                          ৳ {medicine.sellingPrice}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-4">
                      <button
                        onClick={() => decreaseQty(medicine)}
                        className="h-10 w-10 rounded-full bg-red-500 text-xl text-white"
                      >
                        -
                      </button>

                      <span className="w-10 text-center text-xl font-bold">
                        {quantities[medicine._id] || 1}
                      </span>

                      <button
                        onClick={() => increaseQty(medicine)}
                        disabled={
                          (quantities[medicine._id] || 1) >= medicine.stock
                        }
                        className="h-10 w-10 rounded-full bg-green-600 text-xl text-white disabled:bg-gray-400"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleAddToCart(medicine)}
                      className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                      🛒 Add To Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>{" "}
          {/* Pagination */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg bg-gray-200 px-5 py-2 font-semibold transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <div className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white">
              {page}
            </div>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AllItemMedicine;
