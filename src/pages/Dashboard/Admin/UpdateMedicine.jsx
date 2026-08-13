import axios from "axios";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://medpharm-server-sgs6.vercel.app";

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

  const watchedMrp = watch("mrpePrice");
  const watchedBikriPercent = watch("bikriPercent");

  // ==========================================
  // CONVERT TO NUMBER SAFELY
  // ==========================================

  const mrpePrice = useMemo(() => {
    const value = parseFloat(watchedMrp);
    return Number.isFinite(value) ? value : 0;
  }, [watchedMrp]);

  const bikriPercent = useMemo(() => {
    const value = parseFloat(watchedBikriPercent);
    return Number.isFinite(value) ? value : 0;
  }, [watchedBikriPercent]);

  // ==========================================
  // SELLING PRICE
  //
  // MRP - Discount
  //
  // Example:
  // MRP = 100
  // Discount = 10%
  // Selling Price = 90
  // ==========================================

  const sellingPrice = useMemo(() => {
    if (mrpePrice <= 0) {
      return 0;
    }

    const discountAmount = (mrpePrice * bikriPercent) / 100;

    const finalPrice = mrpePrice - discountAmount;

    return Math.max(0, Number(finalPrice.toFixed(2)));
  }, [mrpePrice, bikriPercent]);

  // ==========================================
  // LOAD MEDICINE
  // ==========================================

  useEffect(() => {
    let mounted = true;

    const loadMedicine = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`${API_URL}/api/medicines/${id}`, {
          timeout: 20000,
        });

        console.log("Medicine Load Response:", res.data);

        // --------------------------------------
        // HANDLE DIFFERENT RESPONSE STRUCTURES
        // --------------------------------------

        const medicine = res.data?.medicine || res.data?.data || res.data;

        if (!medicine || !medicine._id) {
          throw new Error("Medicine data not found");
        }

        if (!mounted) return;

        reset({
          medicineName: medicine.medicineName ?? "",
          genericName: medicine.genericName ?? "",
          company: medicine.company ?? "",
          category: medicine.category ?? "",

          purchasePrice:
            medicine.purchasePrice !== undefined &&
            medicine.purchasePrice !== null
              ? medicine.purchasePrice
              : "",

          profitPercent:
            medicine.profitPercent !== undefined &&
            medicine.profitPercent !== null
              ? medicine.profitPercent
              : "",

          mrpePrice:
            medicine.mrpePrice !== undefined && medicine.mrpePrice !== null
              ? medicine.mrpePrice
              : "",

          bikriPercent:
            medicine.bikriPercent !== undefined &&
            medicine.bikriPercent !== null
              ? medicine.bikriPercent
              : "",

          stock:
            medicine.stock !== undefined && medicine.stock !== null
              ? medicine.stock
              : "",

          boxQuantity:
            medicine.boxQuantity !== undefined && medicine.boxQuantity !== null
              ? medicine.boxQuantity
              : "",
        });

        console.log("Loaded MRP:", medicine.mrpePrice);
        console.log("Loaded Discount:", medicine.bikriPercent);
        console.log("Loaded Selling Price:", medicine.sellingPrice);
      } catch (error) {
        console.error("Load Medicine Error:", error);

        if (!mounted) return;

        Swal.fire({
          icon: "error",
          title: "Failed to Load Medicine",
          text:
            error?.response?.data?.message ||
            error?.message ||
            "Medicine information could not be loaded.",
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadMedicine();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [id, reset]);

  // ==========================================
  // UPDATE MEDICINE
  // ==========================================

  const onSubmit = async (data) => {
    try {
      setUpdating(true);

      // --------------------------------------
      // CONVERT ALL NUMERIC VALUES
      // --------------------------------------

      const purchasePrice = parseFloat(data.purchasePrice) || 0;

      const profitPercent = parseFloat(data.profitPercent) || 0;

      const mrp = parseFloat(data.mrpePrice) || 0;

      const discountPercent = parseFloat(data.bikriPercent) || 0;

      const stock = parseInt(data.stock, 10) || 0;

      const boxQuantity = parseInt(data.boxQuantity, 10) || 0;

      // --------------------------------------
      // CALCULATE SELLING PRICE AGAIN
      //
      // Do NOT depend only on React state.
      // This makes sure backend always receives
      // the correct calculated value.
      // --------------------------------------

      const calculatedSellingPrice = mrp - (mrp * discountPercent) / 100;

      const finalSellingPrice = Math.max(
        0,
        Number(calculatedSellingPrice.toFixed(2)),
      );

      // --------------------------------------
      // FINAL UPDATE DATA
      // --------------------------------------

      const updateData = {
        medicineName: data.medicineName?.trim() || "",
        genericName: data.genericName?.trim() || "",
        company: data.company?.trim() || "",
        category: data.category?.trim() || "",

        purchasePrice,
        profitPercent,

        mrpePrice: mrp,
        bikriPercent: discountPercent,

        sellingPrice: finalSellingPrice,

        stock,
        boxQuantity,
      };

      console.log("=================================");
      console.log("UPDATE MEDICINE DATA");
      console.log("=================================");
      console.log(updateData);
      console.log("MRP:", mrp);
      console.log("Discount:", discountPercent);
      console.log("Selling Price:", finalSellingPrice);
      console.log("=================================");

      // --------------------------------------
      // VALIDATION
      // --------------------------------------

      if (!data.medicineName?.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Medicine Name Required",
          text: "Please enter medicine name.",
        });

        setUpdating(false);
        return;
      }

      if (mrp <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid MRP",
          text: "MRP price must be greater than 0.",
        });

        setUpdating(false);
        return;
      }

      if (discountPercent < 0 || discountPercent > 100) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Discount",
          text: "Discount must be between 0% and 100%.",
        });

        setUpdating(false);
        return;
      }

      // --------------------------------------
      // API REQUEST
      // --------------------------------------

      const res = await axios.put(
        `${API_URL}/api/medicines/${id}`,
        updateData,
        {
          timeout: 20000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Update API Response:", res.data);

      // --------------------------------------
      // SUCCESS
      // --------------------------------------

      await Swal.fire({
        icon: "success",
        title: "Medicine Updated!",
        html: `
          <div style="text-align:left">
            <p><strong>Medicine:</strong> ${data.medicineName}</p>
            <p><strong>MRP:</strong> ৳ ${mrp.toFixed(2)}</p>
            <p><strong>Discount:</strong> ${discountPercent}%</p>
            <p><strong>Selling Price:</strong> ৳ ${finalSellingPrice.toFixed(2)}</p>
            <p><strong>Stock:</strong> ${stock}</p>
          </div>
        `,
        confirmButtonText: "OK",
      });

      navigate("/dashboard/all-medicine");
    } catch (error) {
      console.error("Update Medicine Error:", error);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong while updating medicine.",
      });
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-100">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-5 text-lg font-bold text-gray-700">
            Loading Medicine...
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Please wait while medicine information is loading.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* =====================================
            HEADER
        ===================================== */}

        <div className="mb-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-800">
                Update Medicine
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Update medicine information, pricing and stock.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard/all-medicine")}
              disabled={updating}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
            >
              ← All Medicines
            </button>
          </div>
        </div>

        {/* =====================================
            FORM CARD
        ===================================== */}

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* =================================
                BASIC INFORMATION
            ================================= */}

            <div className="p-5 md:p-8">
              <div className="mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-black text-gray-800">
                  💊 Medicine Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update the basic medicine details.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Medicine Name */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Medicine Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter medicine name"
                    {...register("medicineName", {
                      required: "Medicine name is required",
                    })}
                    className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 ${
                      errors.medicineName
                        ? "border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  {errors.medicineName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.medicineName.message}
                    </p>
                  )}
                </div>

                {/* Generic Name */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
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
                  <label className="mb-2 block text-sm font-bold text-gray-700">
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
                  <label className="mb-2 block text-sm font-bold text-gray-700">
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

            <div className="border-t border-gray-200 bg-gray-50/70 p-5 md:p-8">
              <div className="mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-black text-gray-800">
                  💰 Purchase Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage purchase price and profit information.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Purchase Price */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Purchase Price
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
                      {...register("purchasePrice")}
                      className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Profit */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Profit Percent
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      {...register("profitPercent")}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================
                SELLING PRICE
            ================================= */}

            <div className="p-5 md:p-8">
              <div className="mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-black text-gray-800">
                  🏷️ Selling Price
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Set MRP and discount. Selling price will be calculated
                  automatically.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {/* MRP */}

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <label className="mb-2 block text-sm font-bold text-blue-800">
                    MRP Price *
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
                        min: {
                          value: 0,
                          message: "MRP cannot be negative",
                        },
                      })}
                      className="w-full rounded-xl border border-blue-200 bg-white py-3 pl-10 pr-4 text-lg font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {errors.mrpePrice && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.mrpePrice.message}
                    </p>
                  )}
                </div>

                {/* DISCOUNT */}

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

                <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-5">
                  <label className="mb-2 block text-sm font-bold text-green-700">
                    Selling Price
                  </label>

                  <div className="text-3xl font-black text-green-700">
                    ৳ {sellingPrice.toFixed(2)}
                  </div>

                  <p className="mt-2 text-xs font-semibold text-green-600">
                    MRP − {bikriPercent}% discount
                  </p>
                </div>
              </div>
            </div>

            {/* =================================
                STOCK
            ================================= */}

            <div className="border-t border-gray-200 bg-gray-50/70 p-5 md:p-8">
              <div className="mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-black text-gray-800">
                  📦 Stock Management
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update available stock and box quantity.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* STOCK */}

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <label className="mb-2 block text-sm font-bold text-blue-800">
                    Available Stock *
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
                </div>

                {/* BOX */}

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
                </div>
              </div>
            </div>

            {/* =================================
                PRICE SUMMARY
            ================================= */}

            <div className="mx-5 mb-8 overflow-hidden rounded-2xl bg-slate-900 p-5 text-white md:mx-8">
              <h3 className="mb-5 text-lg font-black">📊 Price Summary</h3>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-400">MRP</p>

                  <p className="mt-1 text-2xl font-bold">
                    ৳ {mrpePrice.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Discount</p>

                  <p className="mt-1 text-2xl font-bold text-red-400">
                    {bikriPercent}%
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Final Selling Price</p>

                  <p className="mt-1 text-2xl font-black text-green-400">
                    ৳ {sellingPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================
                BUTTONS
            ================================= */}

            <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-5 sm:flex-row md:p-8">
              <button
                type="button"
                onClick={() => navigate("/dashboard/all-medicine")}
                disabled={updating}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-bold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updating}
                className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Updating...
                  </span>
                ) : (
                  "✓ Update Medicine"
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
