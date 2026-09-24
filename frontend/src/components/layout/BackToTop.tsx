"use client";

import React, { useEffect, useState } from "react";

interface BackToTopProps {
  hasChatBot?: boolean;
}

export default function BackToTop({ hasChatBot = false }: BackToTopProps) {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      const docHeight =
        Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        ) - window.innerHeight;

      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      setScrollProgress(progress);
      setShowBackToTop(scrollTop > 80);
    };

    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const main = document.querySelector(".dashboard-main");
    if (main) {
      main.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={scrollToTop}
        className={`dashboard-back-to-top ${showBackToTop ? "is-visible" : ""} ${hasChatBot ? "with-bot" : ""}`}
        aria-label="Scroll back to top"
        title="Back to Top"
      >
        <svg className="scroll-progress-svg" width="50" height="50" viewBox="0 0 50 50">
          {/* Background ring */}
          <circle
            cx="25"
            cy="25"
            r="21.5"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3"
          />
          {/* Active progress ring */}
          <circle
            cx="25"
            cy="25"
            r="21.5"
            fill="none"
            stroke="#0038A8"
            strokeWidth="3"
            strokeDasharray={135.1}
            strokeDashoffset={135.1 - (scrollProgress / 100) * 135.1}
            strokeLinecap="round"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset 0.1s ease-out"
            }}
          />
        </svg>
        <svg
          className="chevron-up-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0038A8"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
        <span className="btt-tooltip">Back to Top</span>
      </button>

      <style jsx>{`
        .dashboard-back-to-top {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 56, 168, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9998;
          padding: 0;
          outline: none;
          opacity: 0;
          pointer-events: none;
          transform: translateY(14px) scale(0.88);
          transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.2s ease;
        }

        .dashboard-back-to-top.with-bot {
          bottom: 96px;
          right: 29px;
        }

        .dashboard-back-to-top.is-visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }

        .dashboard-back-to-top:hover {
          transform: translateY(-3px) scale(1.06);
          box-shadow: 0 8px 24px rgba(0, 56, 168, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .dashboard-back-to-top:active {
          transform: translateY(0) scale(0.95);
        }

        .scroll-progress-svg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .chevron-up-icon {
          position: relative;
          z-index: 1;
          transition: transform 0.2s ease;
        }

        .dashboard-back-to-top:hover .chevron-up-icon {
          transform: translateY(-2px);
        }

        .btt-tooltip {
          position: absolute;
          right: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%) translateX(6px);
          background: #0f172a;
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        }

        .btt-tooltip::after {
          content: '';
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-width: 5px 0 5px 6px;
          border-style: solid;
          border-color: transparent transparent transparent #0f172a;
        }

        .dashboard-back-to-top:hover .btt-tooltip {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        @media (max-width: 768px) {
          .dashboard-back-to-top {
            bottom: 20px;
            right: 20px;
          }
          .dashboard-back-to-top.with-bot {
            bottom: 86px;
            right: 24px;
          }
        }
      `}</style>
    </>
  );
}
