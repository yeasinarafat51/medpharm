import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaArrowRight,
  FaShoppingBag,
  FaCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const API_URL = "https://medpharm-server-sgs6.vercel.app";

function HeroSlider() {
  const [sliders, setSliders] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD SLIDERS
  // =====================================================

  useEffect(() => {
    const loadSliders = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/sliders/active`, {
          timeout: 20000,
        });

        if (Array.isArray(res.data?.sliders)) {
          setSliders(res.data.sliders);
        }
      } catch (error) {
        console.error("Slider Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSliders();
  }, []);

  // =====================================================
  // AUTO SLIDE
  // =====================================================

  useEffect(() => {
    if (sliders.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % sliders.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [sliders.length]);

  // =====================================================
  // NEXT
  // =====================================================

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % sliders.length);
  };

  // =====================================================
  // PREVIOUS
  // =====================================================

  const previousSlide = () => {
    setCurrent((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-3 py-4">
        <div className="h-[220px] animate-pulse rounded-3xl bg-gray-200 sm:h-[320px] lg:h-[450px]" />
      </section>
    );
  }

  // =====================================================
  // NO SLIDER
  // =====================================================

  if (!sliders.length) {
    return null;
  }

  const slider = sliders[current];

  return (
    <section className="w-full bg-gray-50 py-3 sm:py-5">
      <div className="mx-auto max-w-7xl px-3 sm:px-5">
        <div className="relative overflow-hidden rounded-2xl shadow-xl sm:rounded-3xl">
          {/* =================================================
              IMAGE
          ================================================= */}

          <img
            src={slider.image}
            alt={slider.title}
            className="
              h-[230px]
              w-full
              object-cover
              sm:h-[340px]
              lg:h-[460px]
            "
          />

          {/* =================================================
              DARK OVERLAY
          ================================================= */}

          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10" />

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl px-6 text-white sm:px-10 lg:px-16">
              <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-blue-200 sm:text-sm">
                NovaCare
              </p>

              <h1 className="text-2xl font-black leading-tight sm:text-4xl lg:text-5xl">
                {slider.title}
              </h1>

              {slider.description && (
                <p className="mt-3 max-w-lg text-xs leading-5 text-gray-200 sm:text-base sm:leading-7">
                  {slider.description}
                </p>
              )}

              {slider.buttonText && (
                <Link
                  to={slider.buttonLink || "/all-medicines"}
                  className="
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-4
                    py-2.5
                    text-xs
                    font-bold
                    text-white
                    shadow-lg
                    transition
                    hover:bg-blue-700
                    hover:scale-105
                    sm:px-6
                    sm:py-3
                    sm:text-sm
                  "
                >
                  <FaShoppingBag />

                  {slider.buttonText}
                </Link>
              )}
            </div>
          </div>

          {/* =================================================
              PREVIOUS
          ================================================= */}

          {sliders.length > 1 && (
            <>
              <button
                type="button"
                onClick={previousSlide}
                className="
                  absolute
                  left-3
                  top-1/2
                  flex
                  h-9
                  w-9
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-white/20
                  text-white
                  backdrop-blur-md
                  transition
                  hover:bg-white
                  hover:text-blue-600
                  sm:left-5
                  sm:h-11
                  sm:w-11
                "
              >
                <FaArrowLeft />
              </button>

              {/* =================================================
                  NEXT
              ================================================= */}

              <button
                type="button"
                onClick={nextSlide}
                className="
                  absolute
                  right-3
                  top-1/2
                  flex
                  h-9
                  w-9
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-white/20
                  text-white
                  backdrop-blur-md
                  transition
                  hover:bg-white
                  hover:text-blue-600
                  sm:right-5
                  sm:h-11
                  sm:w-11
                "
              >
                <FaArrowRight />
              </button>

              {/* =================================================
                  DOTS
              ================================================= */}

              <div
                className="
                  absolute
                  bottom-4
                  left-1/2
                  flex
                  -translate-x-1/2
                  items-center
                  gap-2
                "
              >
                {sliders.map((item, index) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setCurrent(index)}
                    className={`
                      h-2
                      rounded-full
                      transition-all
                      duration-300
                      ${current === index ? "w-7 bg-white" : "w-2 bg-white/50"}
                    `}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default HeroSlider;
