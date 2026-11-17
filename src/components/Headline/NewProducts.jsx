import React, { useRef, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FaPlus, FaMinus, FaHeart, FaRegHeart } from "react-icons/fa";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import useCart from "../../hooks/useCart";
import medisin from "../../imges/medpharm_pharmacy.jpg";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://medpharm-server-3.onrender.com"
).trim();

// আগের আসল মেডিসিন ও ইমেজসমূহ
const INITIAL_FALLBACK = [
  {
    _id: "med-new-1",
    medicineName: "Azithromax 500mg Tablet",
    genericName: "Azithromycin Dihydrate",
    company: "Square Pharmaceuticals Ltd.",
    category: "Antibiotic",
    sellingPrice: 35.0,
    mrpePrice: 40.0,
    bikriPercent: 12.5,
    stock: 120,
    dosageForm: "Tablet",
    strength: "500mg",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
    isNewProduct: true,
  },
  {
    _id: "med-new-2",
    medicineName: "Sergel 20mg Capsule",
    genericName: "Esomeprazole Magnesium Trihydrate",
    company: "Healthcare Pharmaceuticals",
    category: "Capsule",
    sellingPrice: 8.5,
    mrpePrice: 10.0,
    bikriPercent: 15.0,
    stock: 95,
    dosageForm: "Capsule",
    strength: "20mg",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=60",
    isNewProduct: true,
  },
  {
    _id: "med-new-3",
    medicineName: "Napa Extra Tablet",
    genericName: "Paracetamol + Caffeine",
    company: "Beximco Pharmaceuticals Ltd.",
    category: "Tablet",
    sellingPrice: 2.75,
    mrpePrice: 3.2,
    bikriPercent: 14.0,
    stock: 250,
    dosageForm: "Tablet",
    strength: "565mg",
    image:
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60",
    isNewProduct: true,
  },
  {
    _id: "med-new-4",
    medicineName: "Monas 10mg Chewable",
    genericName: "Montelukast Sodium",
    company: "Acme Laboratories Ltd.",
    category: "Tablet",
    sellingPrice: 16.0,
    mrpePrice: 18.5,
    bikriPercent: 13.5,
    stock: 75,
    dosageForm: "Tablet",
    strength: "10mg",
    image:
      "https://images.unsplash.com/photo-1579165466791-788226ab77b4?w=500&auto=format&fit=crop&q=60",
    isNewProduct: true,
  },
];

export function NewProducts({
  medicines: propMedicines,
  onAddToCart: propAddToCart,
  onProductClick,
}) {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const sliderRef = useRef(null);

  const [internalMedicines, setInternalMedicines] = useState([]);
  const [cartQuantities, setCartQuantities] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [wishlist, setWishlist] = useState({});

  // ১. ব্যাকএন্ড থেকে ফেচ করা
  useEffect(() => {
    if (!propMedicines || propMedicines.length === 0) {
      axios
        .get(`${API_URL}/api/medicines`, { timeout: 7000 })
        .then((res) => {
          let list = [];
          if (Array.isArray(res.data?.medicines)) list = res.data.medicines;
          else if (Array.isArray(res.data)) list = res.data;

          if (list.length > 0) {
            setInternalMedicines(list);
          }
        })
        .catch((err) => {
          console.warn("Using offline fallback:", err.message);
        });
    }
  }, [propMedicines]);

  // ২. কার্ট স্টেট সিঙ্ক্রোনাইজেশন
  useEffect(() => {
    if (Array.isArray(cart) && cart.length > 0) {
      const qMap = {};
      cart.forEach((item) => {
        if (item?._id) {
          qMap[item._id] = item.quantity || 1;
        }
      });
      setCartQuantities((prev) => ({ ...prev, ...qMap }));
    } else if (Array.isArray(cart) && cart.length === 0) {
      setCartQuantities({});
    }
  }, [cart]);

  // ৩. নতুন ওষুধ যুক্ত হলে সাথে সাথে স্লাইডারের শীর্ষে দেখানো
  useEffect(() => {
    const handleCustomMedicineAdd = (event) => {
      const newMed = event.detail;
      if (newMed && newMed._id) {
        setInternalMedicines((prev) => [
          newMed,
          ...prev.filter((m) => m._id !== newMed._id),
        ]);
        if (sliderRef.current) {
          sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("novacare_medicine_added", handleCustomMedicineAdd);
    return () => {
      window.removeEventListener(
        "novacare_medicine_added",
        handleCustomMedicineAdd,
      );
    };
  }, []);

  const sourceList =
    propMedicines && propMedicines.length > 0
      ? propMedicines
      : internalMedicines.length > 0
        ? internalMedicines
        : INITIAL_FALLBACK;

  // ৪. ইন-স্টক ওষুধ ফিল্টার করা
  const newProducts = useMemo(() => {
    const inStockList = sourceList.filter((med) => {
      const stock = Number(med.stock);
      return !isNaN(stock) && stock > 0;
    });

    const list = [...inStockList].sort((a, b) => {
      const aNew = a.isNewProduct ? 1 : 0;
      const bNew = b.isNewProduct ? 1 : 0;
      if (bNew !== aNew) return bNew - aNew;

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return list.slice(0, 16);
  }, [sourceList]);

  // অটো-স্ক্রোল (হভার করলে থামবে)
  useEffect(() => {
    if (isPaused || newProducts.length <= 3) return;

    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          sliderRef.current.scrollBy({ left: 200, behavior: "smooth" });
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, newProducts.length]);

  const toggleWishlist = (id, e) => {
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCartQuantity = (medicineId) => {
    return cartQuantities[medicineId] || 0;
  };

  // =====================================================
  // অ্যাকশন হ্যান্ডলার (কার্ট ও কোয়ান্টিটি)
  // =====================================================
  const handleAddToCart = (medicine, e) => {
    e.stopPropagation();

    const stock = Number(medicine.stock) || 0;
    if (stock <= 0) {
      Swal.fire({
        icon: "error",
        title: "Out of Stock",
        text: "This medicine is currently out of stock.",
      });
      return;
    }

    setCartQuantities((prev) => ({
      ...prev,
      [medicine._id]: 1,
    }));

    if (propAddToCart) {
      propAddToCart(medicine);
    } else if (typeof addToCart === "function") {
      addToCart({
        ...medicine,
        quantity: 1,
      });
    }

    Swal.fire({
      icon: "success",
      title: "Added To Cart",
      text: `${medicine.medicineName || "Medicine"} added to cart.`,
      timer: 800,
      showConfirmButton: false,
    });
  };

  const handleIncrease = (medicine, e) => {
    e.stopPropagation();
    const stock = Number(medicine.stock) || 0;
    const currentQty = cartQuantities[medicine._id] || 1;

    if (stock > 0 && currentQty >= stock) {
      Swal.fire({
        icon: "warning",
        title: "Max Stock Reached",
        text: `Only ${stock} items available in stock.`,
        timer: 1200,
        showConfirmButton: false,
      });
      return;
    }

    const newQty = currentQty + 1;
    setCartQuantities((prev) => ({
      ...prev,
      [medicine._id]: newQty,
    }));

    if (typeof updateQuantity === "function") {
      updateQuantity(medicine._id, newQty);
    } else if (typeof addToCart === "function") {
      addToCart({
        ...medicine,
        quantity: 1,
      });
    }
  };

  const handleDecrease = (medicine, e) => {
    e.stopPropagation();
    const currentQty = cartQuantities[medicine._id] || 1;

    if (currentQty > 1) {
      const newQty = currentQty - 1;
      setCartQuantities((prev) => ({
        ...prev,
        [medicine._id]: newQty,
      }));

      if (typeof updateQuantity === "function") {
        updateQuantity(medicine._id, newQty);
      }
    } else {
      setCartQuantities((prev) => {
        const next = { ...prev };
        delete next[medicine._id];
        return next;
      });

      if (typeof removeFromCart === "function") {
        removeFromCart(medicine._id);
      }

      Swal.fire({
        icon: "info",
        title: "Removed from Cart",
        text: `${medicine.medicineName || "Item"} removed from cart.`,
        timer: 800,
        showConfirmButton: false,
      });
    }
  };

  if (newProducts.length === 0) return null;

  return (
    <section className="mt-6 mb-7">
      {/* ========================================================
          ১. হেডার (সরাসরি পেজ ব্যাকগ্রাউন্ডের সাথে মেশানো)
      ======================================================== */}
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-800">
          New Arrivals
        </h2>
        <button
          type="button"
          onClick={() => navigate("/new-products")}
          className="text-xs font-semibold text-slate-400 hover:text-[#00897b] transition cursor-pointer"
        >
          See more
        </button>
      </div>

      {/* ========================================================
          ২. ফ্ল্যাট ও স্মুথ ১-রো স্লাইডার ট্র্যাক
      ======================================================== */}
      <div
        ref={sliderRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 scroll-smooth select-none [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {newProducts.map((med, idx) => {
          const sellingPrice = Number(med.sellingPrice || 0);
          const mrpPrice = Number(med.mrpePrice || 0);
          const hasDiscount = mrpPrice > sellingPrice && mrpPrice > 0;
          const discountPercent =
            Number(med.bikriPercent) ||
            (hasDiscount
              ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
              : 0);
          const isWish = !!wishlist[med._id];
          const currentQty = getCartQuantity(med._id);
          const stock = Number(med.stock) || 0;

          return (
            <div
              key={med._id || `slider-${idx}`}
              onClick={() => onProductClick?.(med)}
              className="group relative w-[156px] sm:w-[178px] md:w-[192px] shrink-0 overflow-hidden rounded-xl border border-slate-200/60 bg-white p-2.5 transition-colors duration-200 hover:border-[#00897b]/45 flex flex-col justify-between cursor-pointer"
              style={{ scrollSnapAlign: "start" }}
            >
              <div>
                {/* ডিসকাউন্ট ব্যাজ ও উইশলিস্ট */}
                <div className="flex items-center justify-between mb-1">
                  {discountPercent > 0 ? (
                    <span className="rounded-md bg-[#22c55e] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">
                      {discountPercent}% OFF
                    </span>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={(e) => toggleWishlist(med._id, e)}
                    className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                    title="Wishlist"
                  >
                    {isWish ? (
                      <FaHeart className="text-red-500 text-[11px]" />
                    ) : (
                      <FaRegHeart className="text-slate-400 text-[11px]" />
                    )}
                  </button>
                </div>

                {/* পরিচ্ছন্ন ও ফ্ল্যাট ইমেজ */}
                <div className="relative overflow-hidden bg-slate-50/40 rounded-lg flex items-center justify-center my-1">
                  <img
                    src={med.image || medisin}
                    alt={med.medicineName || "Medicine"}
                    className="h-24 sm:h-28 md:h-32 w-full object-contain p-1.5 sm:p-2 transition duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = medisin;
                    }}
                  />
                </div>

                {/* কমপ্যাক্ট প্রোডাক্ট তথ্য */}
                <div className="pt-1">
                  <h3 className="line-clamp-1 text-xs sm:text-[13px] font-bold text-slate-800 group-hover:text-[#00897b] transition leading-snug">
                    {med.medicineName || "Unknown Medicine"}
                  </h3>
                  <p className="mt-0.5 truncate text-[10px] sm:text-[11px] font-medium text-slate-400">
                    {med.company || "Medicine Store"}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-1 text-[9.5px] text-slate-400">
                    <span className="truncate">
                      {med.genericName || "Certified Formulation"}
                    </span>
                    {med.dosageForm && (
                      <span className="rounded bg-slate-100 px-1 py-0.5 text-[8.5px] font-semibold text-slate-500 shrink-0">
                        {med.dosageForm}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* মূল্য ও #00897b বাটন */}
              <div className="mt-2 flex items-end justify-between pt-1.5 border-t border-slate-100 gap-1">
                <div className="min-w-0">
                  {hasDiscount && (
                    <span className="block text-[9.5px] sm:text-[10px] text-slate-400 line-through leading-none mb-0.5 tabular-nums">
                      ৳ {mrpPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-black text-[#00897b] truncate block leading-tight tabular-nums">
                    ৳ {sellingPrice.toFixed(2)}
                  </span>
                </div>

                <div className="shrink-0">
                  {currentQty === 0 ? (
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(med, e)}
                      className="rounded-lg bg-[#00897b] hover:bg-[#00796b] px-2.5 py-1.5 text-[10px] sm:text-[11px] font-bold text-white transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <FaPlus className="text-[8px]" />
                      <span>Add</span>
                    </button>
                  ) : (
                    <div className="flex h-7 items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={(e) => handleDecrease(med, e)}
                        className="flex h-full w-6 items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-90 transition font-bold cursor-pointer"
                        title="Decrease"
                      >
                        <FaMinus className="text-[8px]" />
                      </button>
                      <span className="px-1.5 text-center text-[11px] font-black text-slate-800 tabular-nums">
                        {currentQty}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleIncrease(med, e)}
                        disabled={stock > 0 && currentQty >= stock}
                        className="flex h-full w-6 items-center justify-center bg-[#00897b] text-white hover:bg-[#00796b] active:scale-90 transition disabled:opacity-50 cursor-pointer"
                        title="Increase"
                      >
                        <FaPlus className="text-[8px]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default NewProducts;
