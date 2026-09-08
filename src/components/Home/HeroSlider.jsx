import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaArrowRight,
  FaShoppingBag,
  FaImages,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const API_URL = "https://medpharm-server-sgs6.vercel.app";

function HeroSlider() {
  const [sliders, setSliders] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD ACTIVE SLIDERS
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const loadSliders = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/sliders/active`, {
          timeout: 20000,
        });

        if (!mounted) return;

        const sliderData = Array.isArray(res.data?.sliders)
          ? res.data.sliders
          : [];

        setSliders(sliderData);
      } catch (error) {
        console.error("Slider Load Error:", error);

        if (mounted) {
          setSliders([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSliders();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // RESET CURRENT INDEX
  // =====================================================

  useEffect(() => {
    if (sliders.length === 0) {
      setCurrent(0);
      return;
    }

    if (current >= sliders.length) {
      setCurrent(0);
    }
  }, [sliders.length, current]);

  // =====================================================
  // AUTO SLIDE
  // =====================================================

  useEffect(() => {
    if (sliders.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrent((prev) => {
        return (prev + 1) % sliders.length;
      });
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [sliders.length]);

  // =====================================================
  // NEXT SLIDE
  // =====================================================

  const nextSlide = () => {
    if (sliders.length <= 1) {
      return;
    }

    setCurrent((prev) => {
      return (prev + 1) % sliders.length;
    });
  };

  // =====================================================
  // PREVIOUS SLIDE
  // =====================================================

  const previousSlide = () => {
    if (sliders.length <= 1) {
      return;
    }

    setCurrent((prev) => {
      return (prev - 1 + sliders.length) % sliders.length;
    });
  };

  // =====================================================
  // GO TO SLIDE
  // =====================================================

  const goToSlide = (index) => {
    setCurrent(index);
  };

  // =====================================================
  // IMAGE ERROR
  // =====================================================

  const handleImageError = (e) => {
    e.currentTarget.style.display = "none";

    const placeholder = e.currentTarget.nextElementSibling;

    if (placeholder) {
      placeholder.style.display = "flex";
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <section className="w-full bg-gray-50 py-3 sm:py-5">
        <div className="mx-auto max-w-7xl px-3 sm:px-5">
          <div className="h-[230px] animate-pulse rounded-2xl bg-gray-200 sm:h-[340px] sm:rounded-3xl lg:h-[460px]" />
        </div>
      </section>
    );
  }

  // =====================================================
  // NO SLIDER
  // =====================================================

  if (sliders.length === 0) {
    return null;
  }

  // =====================================================
  // CURRENT SLIDER
  // =====================================================

  const slider = sliders[current] || {};

  const image = typeof slider.image === "string" ? slider.image.trim() : "";

  const title = typeof slider.title === "string" ? slider.title : "";

  const description =
    typeof slider.description === "string" ? slider.description : "";

  const buttonText =
    typeof slider.buttonText === "string" ? slider.buttonText : "";

  const buttonLink =
    typeof slider.buttonLink === "string" && slider.buttonLink.trim()
      ? slider.buttonLink
      : "/all-medicines";

  return (
    <section className="w-full bg-gray-50 py-3 sm:py-5">
      <div className="mx-auto max-w-7xl px-3 sm:px-5">
        <div className="relative overflow-hidden rounded-2xl shadow-xl sm:rounded-3xl">
          {/* =================================================
              IMAGE
          ================================================= */}

          {image ? (
            <>
              <img
                src={image}
                alt={title || "NovaCare Slider"}
                onError={handleImageError}
                className="
                  h-[230px]
                  w-full
                  object-cover
                  sm:h-[340px]
                  lg:h-[460px]
                "
              />

              {/* IMAGE ERROR PLACEHOLDER */}

              <div
                className="
                  hidden
                  h-[230px]
                  w-full
                  items-center
                  justify-center
                  bg-gradient-to-br
                  from-blue-600
                  via-blue-500
                  to-cyan-500
                  sm:h-[340px]
                  lg:h-[460px]
                "
              >
                <div className="text-center text-white">
                  <FaImages className="mx-auto text-5xl opacity-70 sm:text-7xl" />

                  <p className="mt-3 text-sm font-semibold opacity-80 sm:text-base">
                    NovaCare
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* =================================================
                NO IMAGE PLACEHOLDER
            ================================================= */

            <div
              className="
                flex
                h-[230px]
                w-full
                items-center
                justify-center
                bg-gradient-to-br
                from-blue-600
                via-blue-500
                to-cyan-500
                sm:h-[340px]
                lg:h-[460px]
              "
            >
              <div className="text-center text-white">
                <FaImages className="mx-auto text-5xl opacity-70 sm:text-7xl" />

                <p className="mt-3 text-sm font-semibold opacity-80 sm:text-base">
                  
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              DARK OVERLAY
          ================================================= */}

          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10" />

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl px-6 text-white sm:px-10 lg:px-16">
              {/* BRAND */}

              <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-blue-200 sm:text-sm">
                
              </p>

              {/* TITLE */}

              {title && (
                <h1 className="text-2xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  {title}
                </h1>
              )}

              {/* DESCRIPTION */}

              {description && (
                <p className="mt-3 max-w-lg text-xs leading-5 text-gray-200 sm:text-base sm:leading-7">
                  {description}
                </p>
              )}

              {/* BUTTON */}

              {buttonText && (
                <Link
                  to={buttonLink}
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
                    hover:scale-105
                    hover:bg-blue-700
                    sm:px-6
                    sm:py-3
                    sm:text-sm
                  "
                >
                  <FaShoppingBag />

                  {buttonText}
                </Link>
              )}
            </div>
          </div>

          {/* =================================================
              NAVIGATION
          ================================================= */}

          {sliders.length > 1 && (
            <>
              {/* =================================================
                  PREVIOUS BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={previousSlide}
                aria-label="Previous slide"
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
                  NEXT BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next slide"
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
                    key={item._id || index}
                    type="button"
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
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
