import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useAuth from "../../../hooks/useAuth";

function AllItemMedicine() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [quantity, setQuantity] = useState(1);

  const limit = 8;

  // ==========================
  // Load Medicines
  // ==========================

  const loadMedicine = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/api/medicines?search=${search}&page=${page}&limit=${limit}&sort=asc`,
      );

      setMedicines(res.data.medicines);

      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Failed to load medicines",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicine();
  }, [search, page]);

  // ==========================
  // Open Modal
  // ==========================

  const openOrderModal = (medicine) => {
    setSelectedMedicine(medicine);

    setQuantity(1);

    setShowModal(true);
  };

  // ==========================
  // Close Modal
  // ==========================

  const closeModal = () => {
    setShowModal(false);

    setSelectedMedicine(null);

    setQuantity(1);
  };

  // ==========================
  // Quantity
  // ==========================

  const increase = () => {
    setQuantity(quantity + 1);
  };

  const decrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // ==========================
  // Total Price
  // ==========================

  const totalPrice = selectedMedicine
    ? quantity * selectedMedicine.sellingPrice
    : 0; // ==========================
  // Place Order
  // ==========================

  const handleOrder = async () => {
    try {
      if (!user) {
        Swal.fire({
          icon: "warning",
          title: "Please Login First",
        });

        return;
      }

      if (quantity > Number(selectedMedicine.stock)) {
        Swal.fire({
          icon: "error",
          title: "Not enough stock",
        });

        return;
      }

      const order = {
        customerName: user.displayName || "Customer",

        customerEmail: user.email,

        uid: user.uid,

        medicineId: selectedMedicine._id,

        medicineName: selectedMedicine.medicineName,

        company: selectedMedicine.company,

        image: selectedMedicine.image,

        quantity: Number(quantity),

        unitPrice: Number(selectedMedicine.sellingPrice),

        totalPrice: Number(quantity) * Number(selectedMedicine.sellingPrice),
      };

      const res = await axios.post("http://localhost:5000/api/orders", order);

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Order Placed Successfully",
          timer: 1800,
          showConfirmButton: false,
        });

        closeModal();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Order Failed",
        text: error.message,
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-700">All Medicines</h1>

        <p className="mt-2 text-gray-500">
          Browse medicines and place your order.
        </p>
      </div>

      {/* Search */}

      <div className="mb-8">
        <input
          type="text"
          placeholder="Search medicine..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-xl border border-gray-300 px-5 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Loading */}

      {loading ? (
        <div className="py-20 text-center text-xl font-semibold text-blue-600">
          Loading...
        </div>
      ) : (
        <>
          {/* Medicine Grid */}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {medicines.map((medicine) => (
              <div
                key={medicine._id}
                className="overflow-hidden rounded-2xl border bg-white shadow transition hover:-translate-y-1 hover:shadow-xl"
              >
                <img
                  src={
                    medicine.image ||
                    "https://placehold.co/600x400?text=Medicine"
                  }
                  alt={medicine.medicineName}
                  className="h-48 w-full object-cover"
                />

                <div className="p-5">
                  <h2 className="text-xl font-bold">{medicine.medicineName}</h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {medicine.company}
                  </p>

                  <p className="mt-3 rounded bg-blue-100 px-3 py-1 text-center text-blue-700">
                    {medicine.category}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">
                      ৳ {medicine.sellingPrice}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                      Persent {medicine.bikriPercent}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                      MRP {medicine.mrpePrice}
                    </span>
                  </div>

                  <button
                    onClick={() => openOrderModal(medicine)}
                    className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}

          <div className="mt-10 flex justify-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg bg-gray-200 px-5 py-2 disabled:opacity-50"
            >
              Previous
            </button>

            <div className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white">
              {page}
            </div>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Order Modal */}

      {showModal && selectedMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-2xl font-bold">Place Order</h2>

            <img
              src={
                selectedMedicine.image ||
                "https://placehold.co/300x200?text=Medicine"
              }
              alt=""
              className="mb-4 h-48 w-full rounded-xl object-cover"
            />

            <h3 className="text-xl font-bold">
              {selectedMedicine.medicineName}
            </h3>

            <p className="text-gray-500">{selectedMedicine.company}</p>

            <div className="mt-5">
              <p className="font-semibold">
                Unit Price : ৳ {selectedMedicine.sellingPrice}
              </p>

              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={decrease}
                  className="h-10 w-10 rounded bg-red-500 text-white"
                >
                  -
                </button>

                <span className="text-xl font-bold">{quantity}</span>

                <button
                  onClick={increase}
                  className="h-10 w-10 rounded bg-green-600 text-white"
                >
                  +
                </button>
              </div>

              <div className="mt-6 rounded-xl bg-green-100 p-4 text-center">
                <p>Total Price</p>

                <h2 className="text-3xl font-bold text-green-700">
                  ৳ {totalPrice}
                </h2>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-xl bg-gray-300 py-3 font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={handleOrder}
                  className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white"
                >
                  Confirm Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllItemMedicine;
