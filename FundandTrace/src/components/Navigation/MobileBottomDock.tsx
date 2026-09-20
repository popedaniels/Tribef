/* eslint-disable react/no-unknown-property */
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function MobileBottomDock() {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    {
      label: "Explore",
      path: "/Categories",
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? "var(--color-primary, #6979F8)" : "currentColor"}
          strokeWidth={active ? "2.3" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      label: "Launch",
      path: "/StartACampaign",
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? "var(--color-primary, #6979F8)" : "currentColor"}
          strokeWidth={active ? "2.3" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      ),
    },
    {
      label: "Tracker",
      path: "/campaign/6228221c5690b201dc93ec3e/tracker",
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? "var(--color-primary, #6979F8)" : "currentColor"}
          strokeWidth={active ? "2.3" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? "var(--color-primary, #6979F8)" : "currentColor"}
          strokeWidth={active ? "2.3" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="mobile-bottom-dock d-md-none fixed-bottom"
      style={{
        zIndex: 1050,
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: "calc(12px + var(--sab, 0px))",
        pointerEvents: "none",
      }}
    >
      <div
        className="dock-glass-pill mx-auto d-flex justify-content-around align-items-center"
        style={{
          maxWidth: 380,
          height: 62,
          borderRadius: 999,
          padding: "6px 12px",
          background: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(28px) saturate(190%)",
          WebkitBackdropFilter: "blur(28px) saturate(190%)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)",
          pointerEvents: "auto",
        }}
      >
        {navItems.map((item) => {
          const isActive =
            item.path === "/Categories"
              ? currentPath.includes("Categories") || currentPath.includes("category")
              : item.path === "/StartACampaign"
              ? currentPath.includes("StartACampaign")
              : item.path === "/dashboard"
              ? currentPath.startsWith("/dashboard")
              : currentPath.includes("tracker");

          return (
            <Link href={item.path} key={item.label} passHref>
              <a
                className="d-flex flex-column align-items-center justify-content-center mobile-touchable text-decoration-none"
                style={{
                  flex: 1,
                  height: "100%",
                  borderRadius: 999,
                  position: "relative",
                  color: isActive ? "var(--color-primary, #6979F8)" : "#64748B",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div
                  style={{
                    transform: isActive ? "scale(1.08)" : "scale(1)",
                    transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {item.icon(isActive)}
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: isActive ? 700 : 500,
                    marginTop: 2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 2,
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: "var(--color-primary, #6979F8)",
                    }}
                  />
                )}
              </a>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        :global([data-theme="dark"]) .dock-glass-pill,
        :global(.dark-theme) .dock-glass-pill {
          background: rgba(15, 23, 42, 0.88) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
        }
      `}</style>
    </nav>
  );
}
