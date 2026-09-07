import { useForm } from "react-hook-form";
import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  FaCapsules,
  FaBuilding,
  FaTags,
  FaMoneyBillWave,
  FaBoxes,
  FaCalendarAlt,
  FaImage,
} from "react-icons/fa";

function AddMedicine() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const image = watch("image");

  // =========================
  // PRICE STATES
  // =========================
  const [mrpePrice, setMrpePrice] = useState("");
  const [bikriPercent, setBikriPercent] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [profitPercent, setProfitPercent] = useState("");
  const [stock, setStock] = useState("");
  const [boxQuantity, setBoxQuantity] = useState("");

  const [loading, setLoading] = useState(false);

  // =========================
  // SELLING PRICE
  // =========================
  const mrpNumber = parseFloat(mrpePrice) || 0;
  const bikriNumber = parseFloat(bikriPercent) || 0;

  const sellingPrice = mrpNumber - (mrpNumber * bikriNumber) / 100;

  // =========================
  // DECIMAL INPUT HANDLER
  // =========================
  const handleDecimalChange = (value, setter) => {
    // Empty value allow
    if (value === "") {
      setter("");
      return;
    }

    // শুধু number এবং decimal point allow
    if (/^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  // =========================
  // SUBMIT
  // =========================
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const medicineData = {
        ...data,

        purchasePrice: parseFloat(purchasePrice) || 0,

        mrpePrice: parseFloat(mrpePrice) || 0,

        profitPercent: parseFloat(profitPercent) || 0,

        bikriPercent: parseFloat(bikriPercent) || 0,

        stock: parseInt(stock) || 0,

        boxQuantity: parseInt(boxQuantity) || 0,

        sellingPrice: Number(sellingPrice.toFixed(2)),
      };

      console.log("Medicine Data:", medicineData);

      await axios.post(
        "https://medpharm-server-sgs6.vercel.app/api/medicines",
        medicineData,
      );

      Swal.fire({
        icon: "success",
        title: "Medicine Added Successfully",
        text: "Medicine successfully added!",
        timer: 2000,
        showConfirmButton: false,
      });

      // Reset react-hook-form
      reset();

      // Reset custom states
      setPurchasePrice("");
      setMrpePrice("");
      setBikriPercent("");
      setProfitPercent("");
      setStock("");
      setBoxQuantity("");
    } catch (error) {
      console.error("Add Medicine Error:", error);

      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: error.response?.data?.message || "Medicine add করা যায়নি!",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
      {/* =========================
          HEADER
      ========================= */}
      <div className="mb-10 flex flex-col gap-3 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-bold text-slate-800">
          💊 Add New Medicine
        </h1>

        <p className="text-gray-500">
          Fill up all medicine information carefully before saving.
        </p>
      </div>

      {/* =========================
          FORM
      ========================= */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-7 lg:grid-cols-2"
      >
        {/* =========================
            MEDICINE NAME
        ========================= */}
        <div>
          <label className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaCapsules className="text-blue-600" />
            Medicine Name
          </label>

          <input
            type="text"
            placeholder="Paracetamol 500mg"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            {...register("medicineName", {
              required: "Medicine Name is required",
            })}
          />

          {errors.medicineName && (
            <p className="mt-2 text-sm text-red-500">
              {errors.medicineName.message}
            </p>
          )}
        </div>

        {/* =========================
            GENERIC NAME
        ========================= */}
        <div>
          <label className="mb-2 font-semibold text-gray-700">
            Generic Name
          </label>

          <input
            type="text"
            placeholder="Acetaminophen"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            {...register("genericName")}
          />
        </div>

        {/* =========================
            COMPANY
        ========================= */}
        <div>
          <label className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaBuilding className="text-blue-600" />
            Company
          </label>

          <input
            type="text"
            placeholder="Square Pharmaceuticals Ltd."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            {...register("company")}
          />
        </div>

        {/* =========================
            CATEGORY
        ========================= */}
        <div>
          <label className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaTags className="text-blue-600" />
            Category
          </label>

          <select
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            {...register("category")}
          >
            <option value="">Select Category</option>
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Syrup">Syrup</option>
            <option value="Injection">Injection</option>
            <option value="Drop">Drop</option>
            <option value="Ointment">Ointment</option>
          </select>
        </div>

        {/* =========================
            STRENGTH
        ========================= */}
        <div>
          <label className="mb-2 font-semibold text-gray-700">Strength</label>

          <input
            type="text"
            placeholder="500 mg"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            {...register("strength")}
          />
        </div>

        {/* =========================
            PURCHASE PRICE
        ========================= */}
        <div>
          <label className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaMoneyBillWave className="text-green-600" />
            Purchase Price
          </label>

          <input
            type="text"
            inputMode="decimal"
            value={purchasePrice}
            onChange={(e) =>
              handleDecimalChange(e.target.value, setPurchasePrice)
            }
            placeholder="100.50"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
          />
        </div>

        {/* =========================
            MRP PRICE
        ========================= */}
        <div>
          <label className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaMoneyBillWave className="text-green-600" />
            MRP Price
          </label>

          <input
            type="text"
            inputMode="decimal"
            value={mrpePrice}
            onChange={(e) => handleDecimalChange(e.target.value, setMrpePrice)}
            placeholder="100.50"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
          />

          <p className="mt-1 text-xs text-gray-400">Example: 100.50</p>
        </div>

        {/* =========================
            BIKRI PERCENTAGE
        ========================= */}
        <div>
          <label className="mb-2 font-semibold text-gray-700">
            Bikri Percentage (%)
          </label>

          <input
            type="text"
            inputMode="decimal"
            value={bikriPercent}
            onChange={(e) =>
              handleDecimalChange(e.target.value, setBikriPercent)
            }
            placeholder="10.5"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
          />

          <p className="mt-1 text-xs text-gray-400">Example: 10.5% / 12.75%</p>
        </div>

        {/* =========================
            PROFIT PERCENTAGE
        ========================= */}
        <div>
          <label className="mb-2 font-semibold text-gray-700">
            Profit Percentage (%)
          </label>

          <input
            type="text"
            inputMode="decimal"
            value={profitPercent}
            onChange={(e) =>
              handleDecimalChange(e.target.value, setProfitPercent)
            }
            placeholder="20.5"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
          />

          <p className="mt-1 text-xs text-gray-400">Example: 20.5%</p>
        </div>

        {/* =========================
            SELLING PRICE
        ========================= */}
        <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-6 shadow">
          <p className="text-gray-500">Selling Price</p>

          <h2 className="mt-3 text-5xl font-bold text-green-700">
            ৳ {sellingPrice.toFixed(2)}
          </h2>

          <p className="mt-2 text-sm text-green-600">Auto Calculated</p>

          <p className="mt-2 text-xs text-gray-500">MRP − Bikri Discount</p>
        </div>

        {/* =========================
            STOCK
        ========================= */}
        <div>
          <label className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaBoxes className="text-blue-600" />
            Stock
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={stock}
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                setStock(e.target.value);
              }
            }}
            placeholder="100"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* =========================
            BOX QUANTITY
        ========================= */}
        <div>
          <label className="mb-2 font-semibold text-gray-700">
            Box Quantity
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={boxQuantity}
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                setBoxQuantity(e.target.value);
              }
            }}
            placeholder="10"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* =========================
            EXPIRE DATE
        ========================= */}
        <div>
          <label className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaCalendarAlt className="text-red-500" />
            Expire Date
          </label>

          <input
            type="date"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
            {...register("expireDate")}
          />
        </div>

        {/* =========================
            IMAGE URL
        ========================= */}
        <div className="lg:col-span-2">
          <label className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaImage className="text-purple-600" />
            Image URL
          </label>

          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            {...register("image")}
          />
        </div>

        {/* =========================
            IMAGE PREVIEW
        ========================= */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="mb-5 text-xl font-semibold">Medicine Preview</h3>

          <div className="flex justify-center">
            <img
              src={image || "https://placehold.co/400x300?text=Medicine+Image"}
              alt="Medicine Preview"
              className="h-64 w-64 rounded-xl border bg-white object-contain p-4 shadow"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/400x300?text=Medicine+Image";
              }}
            />
          </div>
        </div>

        {/* =========================
            DESCRIPTION
        ========================= */}
        <div className="lg:col-span-2">
          <label className="mb-2 block font-semibold text-gray-700">
            Description
          </label>

          <textarea
            rows={5}
            placeholder="Write medicine description..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            {...register("description")}
          />
        </div>

        {/* =========================
            SUBMIT
        ========================= */}
        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving Medicine..." : "💊 Add Medicine"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddMedicine;
