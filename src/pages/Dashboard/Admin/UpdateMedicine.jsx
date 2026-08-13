import axios from "axios";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function UpdateMedicine() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      medicineName: "",
      genericName: "",
      company: "",
      category: "",
      purchasePrice: "",
      profitPercent: "",
      mrpePrice: "",
      bikriPercent: "",
      stock: "",
      boxQuantity: "",
    },
  });

  // ==========================================
  // WATCH VALUES
  // ==========================================

  const mrpePrice = Number(watch("mrpePrice")) || 0;

  const bikriPercent = Number(watch("bikriPercent")) || 0;

  // ==========================================
  // SELLING PRICE CALCULATION
  // MRP - Bikri/Discount %
  // ==========================================

  const sellingPrice = mrpePrice - (mrpePrice * bikriPercent) / 100;

  // ==========================================
  // LOAD MEDICINE
  // ==========================================

  useEffect(() => {
    const loadMedicine = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `https://medpharm-server-sgs6.vercel.app/api/medicines/${id}`,
        );

        if (res.data) {
          reset({
            medicineName: res.data.medicineName || "",
            genericName: res.data.genericName || "",
            company: res.data.company || "",
            category: res.data.category || "",

            purchasePrice: res.data.purchasePrice || "",
            profitPercent: res.data.profitPercent || "",

            mrpePrice: res.data.mrpePrice || "",
            bikriPercent: res.data.bikriPercent || "",

            stock: res.data.stock || "",
            boxQuantity: res.data.boxQuantity || "",
          });
        }
      } catch (error) {
        console.error("Load Medicine Error:", error);

        Swal.fire({
          icon: "error",
          title: "Failed to Load Medicine",
          text:
            error.response?.data?.message ||
            "Medicine information could not be loaded.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadMedicine();
    }
  }, [id, reset]);

  // ==========================================
  // UPDATE MEDICINE
  // ==========================================

  const onSubmit = async (data) => {
    try {
      setUpdating(true);

      const updateData = {
        ...data,

        purchasePrice: Number(data.purchasePrice) || 0,

        profitPercent: Number(data.profitPercent) || 0,

        mrpePrice: Number(data.mrpePrice) || 0,

        bikriPercent: Number(data.bikriPercent) || 0,

        stock: Number(data.stock) || 0,

        boxQuantity: Number(data.boxQuantity) || 0,

        sellingPrice: Number(sellingPrice.toFixed(2)),
      };

      const res = await axios.put(
        `https://medpharm-server-sgs6.vercel.app/api/medicines/${id}`,
        updateData,
      );

      console.log("Update Response:", res.data);

      await Swal.fire({
        icon: "success",
        title: "Medicine Updated Successfully!",
        text: "Medicine information has been updated.",
        timer: 1800,
        showConfirmButton: false,
      });

      navigate("/dashboard/all-medicine");
    } catch (error) {
      console.error("Update Error:", error);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          error.response?.data?.message ||
          "Something went wrong while updating medicine.",
      });
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 font-semibold text-gray-600">
            Loading Medicine...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* =====================================
            HEADER
        ===================================== */}

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Update Medicine</h1>

          <p className="mt-1 text-gray-500">
            Update medicine information, pricing and stock.
          </p>
        </div>

        {/* =====================================
            FORM CARD
        ===================================== */}

        <div className="rounded-2xl bg-white p-5 shadow-lg md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* =================================
                BASIC INFORMATION
            ================================= */}

            <div>
              <div className="mb-5 border-b pb-3">
                <h2 className="text-xl font-bold text-gray-800">
                  Medicine Information
                </h2>

                <p className="text-sm text-gray-500">
                  Update the basic medicine details.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Medicine Name */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Medicine Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter medicine name"
                    {...register("medicineName", {
                      required: "Medicine name is required",
                    })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  {errors.medicineName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.medicineName.message}
                    </p>
                  )}
                </div>

                {/* Generic Name */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Generic Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter generic name"
                    {...register("genericName")}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Company */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Company
                  </label>

                  <input
                    type="text"
                    placeholder="Enter company name"
                    {...register("company")}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Category */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Category
                  </label>

                  <input
                    type="text"
                    placeholder="Enter category"
                    {...register("category")}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* =================================
                PURCHASE INFORMATION
            ================================= */}

            <div>
              <div className="mb-5 border-b pb-3">
                <h2 className="text-xl font-bold text-gray-800">
                  Purchase Information
                </h2>

                <p className="text-sm text-gray-500">
                  Manage purchase price and profit information.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Purchase Price */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Purchase Price
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                      ৳
                    </span>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register("purchasePrice")}
                      className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Profit Percent */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Profit Percent
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      {...register("profitPercent")}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================
                SELLING PRICE SECTION
            ================================= */}

            <div>
              <div className="mb-5 border-b pb-3">
                <h2 className="text-xl font-bold text-gray-800">
                  Selling Price
                </h2>

                <p className="text-sm text-gray-500">
                  Set MRP and discount to calculate selling price.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {/* MRP */}

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    MRP Price
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                      ৳
                    </span>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register("mrpePrice", {
                        required: "MRP price is required",
                      })}
                      className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-lg font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {errors.mrpePrice && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.mrpePrice.message}
                    </p>
                  )}
                </div>

                {/* BIKRI PERCENT */}

                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <label className="mb-2 block text-sm font-bold text-red-700">
                    Bikri / Discount %
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0"
                      {...register("bikriPercent", {
                        min: {
                          value: 0,
                          message: "Minimum 0%",
                        },
                        max: {
                          value: 100,
                          message: "Maximum 100%",
                        },
                      })}
                      className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 pr-10 text-lg font-bold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-red-600">
                      %
                    </span>
                  </div>

                  {errors.bikriPercent && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.bikriPercent.message}
                    </p>
                  )}
                </div>

                {/* SELLING PRICE */}

                <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
                  <label className="mb-2 block text-sm font-bold text-green-700">
                    Selling Price
                  </label>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-green-700">
                      ৳ {sellingPrice.toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-green-600">
                    MRP − Bikri/Discount
                  </p>
                </div>
              </div>
            </div>

            {/* =================================
                STOCK SECTION
            ================================= */}

            <div>
              <div className="mb-5 border-b pb-3">
                <h2 className="text-xl font-bold text-gray-800">
                  Stock Management
                </h2>

                <p className="text-sm text-gray-500">
                  Update available stock and box quantity.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* STOCK */}

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <label className="mb-2 block text-sm font-bold text-blue-800">
                    Available Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="Enter stock quantity"
                    {...register("stock", {
                      required: "Stock is required",
                      min: {
                        value: 0,
                        message: "Stock cannot be negative",
                      },
                    })}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-xl font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.stock.message}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-blue-600">
                    Current available medicine quantity
                  </p>
                </div>

                {/* BOX QUANTITY */}

                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
                  <label className="mb-2 block text-sm font-bold text-purple-800">
                    Box Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="Enter box quantity"
                    {...register("boxQuantity", {
                      min: {
                        value: 0,
                        message: "Box quantity cannot be negative",
                      },
                    })}
                    className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-xl font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />

                  {errors.boxQuantity && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.boxQuantity.message}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-purple-600">
                    Number of medicine boxes
                  </p>
                </div>
              </div>
            </div>

            {/* =================================
                SUMMARY
            ================================= */}

            <div className="rounded-2xl bg-gray-900 p-5 text-white">
              <h3 className="mb-4 text-lg font-bold">Price Summary</h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-400">MRP</p>

                  <p className="text-xl font-bold">৳ {mrpePrice.toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Discount</p>

                  <p className="text-xl font-bold text-red-400">
                    {bikriPercent}% OFF
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Final Selling Price</p>

                  <p className="text-xl font-black text-green-400">
                    ৳ {sellingPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================
                BUTTONS
            ================================= */}

            <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/dashboard/all-medicine")}
                disabled={updating}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updating}
                className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Updating...
                  </span>
                ) : (
                  "Update Medicine"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdateMedicine;
