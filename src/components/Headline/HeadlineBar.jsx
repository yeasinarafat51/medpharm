import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaBullhorn,
  FaPause,
  FaPlay,
  FaExternalLinkAlt,
  FaFire,
  FaListUl,
  FaTimes,
} from "react-icons/fa";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://medpharm-server-3.onrender.com"
).trim();

// সার্ভার লোড হওয়ার আগ পর্যন্ত ফলব্যাক ডিফল্ট নোটিশ
const FALLBACK_HEADLINES = [];

function HeadlineBar() {
  const [headlines, setHeadlines] = useState(FALLBACK_HEADLINES);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState("normal"); // "slow" (ধীর) | "normal" (স্বাভাবিক) | "fast" (দ্রুত)
  const [isExpanded, setIsExpanded] = useState(false);

  // ব্যাকএন্ড API থেকে সক্রিয় শিরোনাম লোড
  useEffect(() => {
    let isMounted = true;
    axios
      .get(`${API_URL}/api/headlines/active`)
      .then((res) => {
        if (
          isMounted &&
          Array.isArray(res.data?.headlines) &&
          res.data.headlines.length > 0
        ) {
          setHeadlines(res.data.headlines);
        }
      })
      .catch((err) => {
        console.warn("Using offline fallback headlines:", err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeHeadlines = headlines.filter((h) => h.isActive !== false);

  if (activeHeadlines.length === 0) return null;

  // নির্বিঘ্ন একটানা (Unbroken 100% Seamless) লুপের জন্য অ্যারে একাধিকবার রিপিট
  const tickerItems = [
    ...activeHeadlines,
    ...activeHeadlines,
    ...activeHeadlines,
  ];

  const getBadgeStyle = (color) => {
    switch (color) {
      case "rose":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "amber":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "sky":
        return "bg-sky-500/20 text-sky-300 border-sky-500/30";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    }
  };

  const cycleSpeed = () => {
    if (speed === "normal") setSpeed("slow");
    else if (speed === "slow") setSpeed("fast");
    else setSpeed("normal");
  };

  const speedClass =
    speed === "slow"
      ? "ticker-slow"
      : speed === "fast"
        ? "ticker-fast"
        : "ticker-normal";

  return (
    <div className="relative z-40 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white border-b border-emerald-500/20 py-1.5 sm:py-2 px-3 sm:px-6 shadow-md transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* বাম পাশের টিভি নিউজ স্টাইল লাইভ ব্যাজ */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center gap-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 px-2.5 py-1 text-[10px] sm:text-[11px] font-black tracking-wide text-rose-300 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <FaBullhorn className="text-[11px] text-amber-300 shrink-0" />
            <span className="uppercase font-black text-white tracking-wider">
              লাইভ শিরোনাম
            </span>
          </div>
        </div>

        {/* মাঝের অংশ: টেলিভিশনের মতো একটানা ধীরে ধীরে চলমান স্ক্রলার */}
        <div
          className="flex-1 min-w-0 overflow-hidden relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* দুই প্রান্তে স্মুথ ফেড শ্যাডো */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-emerald-950 to-transparent z-10" />

          <div className="relative flex overflow-x-hidden whitespace-nowrap">
            <div
              className={`animate-tv-ticker ${speedClass} ${
                isPaused ? "paused" : ""
              } inline-flex items-center gap-8 py-0.5 text-xs sm:text-[13px] font-medium text-slate-100`}
            >
              {tickerItems.map((h, idx) => (
                <span
                  key={`${h._id || idx}-${idx}`}
                  className="inline-flex items-center gap-2 group hover:text-emerald-300 transition-colors"
                >
                  {/* ক্যাটাগরি ব্যাজ */}
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] sm:text-[10px] font-black ${getBadgeStyle(
                      h.tagColor,
                    )}`}
                  >
                    {h.isUrgent && (
                      <FaFire className="inline-block mr-1 text-rose-400" />
                    )}
                    {h.tag || "নোটিশ"}
                  </span>

                  {/* শিরোনাম টেক্সট */}
                  <span className="cursor-default">{h.text}</span>

                  {/* অ্যাকশন বাটন / লিংক */}
                  {h.link && (
                    <a
                      href={h.link}
                      className="inline-flex items-center gap-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 transition"
                    >
                      <span>{h.linkLabel || "দেখুন"}</span>
                      <FaExternalLinkAlt className="text-[8px]" />
                    </a>
                  )}

                  {/* শিরোনামগুলোর মাঝে উজ্জ্বল টিভি ডিভাইডার */}
                  <span className="text-emerald-400/60 font-black px-2 select-none">
                    ✦
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ডান পাশের কন্ট্রোল বাটনসমূহ */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* থামান / চালু করুন বাটন */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`flex h-6 w-6 items-center justify-center rounded-md border text-[9px] transition ${
              isPaused
                ? "bg-amber-500/20 border-amber-400/40 text-amber-300"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
            }`}
            title={isPaused ? "চালু করুন" : "থামান"}
          >
            {isPaused ? <FaPlay /> : <FaPause />}
          </button>

          {/* স্ক্রলিং গতি পরিবর্তন (ধীর / স্বাভাবিক / দ্রুত) */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="hidden sm:flex items-center gap-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300 transition"
            title="স্ক্রল গতি পরিবর্তন করুন"
          >
            <span>
              {speed === "slow"
                ? "🐢 ধীর"
                : speed === "fast"
                  ? "⚡ দ্রুত"
                  : "🚶 গতি"}
            </span>
          </button>

          {/* সব নোটিশ একসাথে দেখার টগল */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs transition ${
              isExpanded
                ? "bg-emerald-500 text-slate-950 font-black border-emerald-400"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
            title="সকল শিরোনাম তালিকা"
          >
            {isExpanded ? <FaTimes /> : <FaListUl />}
          </button>
        </div>
      </div>

      {/* ড্রপডাউন: সব সক্রিয় নোটিশ একসাথে দেখার প্যানেল */}
      {isExpanded && (
        <div className="mt-2 border-t border-emerald-900/40 pt-2 animate-fadeIn">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto">
            {activeHeadlines.map((h, i) => (
              <div
                key={h._id || i}
                className="flex items-start gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60"
              >
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-black ${getBadgeStyle(
                    h.tagColor,
                  )}`}
                >
                  {h.tag || "নোটিশ"}
                </span>
                <p className="text-xs text-slate-200">{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HeadlineBar;
