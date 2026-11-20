import React, { useRef } from "react";

const TABS = [
  { id: "story", label: "STORY" },
  { id: "updates", label: "UPDATES" },
  { id: "live", label: "LIVE" },
  { id: "contact", label: "CONTACT" },
];

/**
 * Campaign page tabs. Real buttons in a WAI-ARIA tablist: reachable by
 * keyboard (Tab), arrow keys move between tabs, and the selected tab is
 * announced. Previously these were <h5 role="button"> elements that
 * keyboard users couldn't operate.
 */
export default function TabNavigation({ view, setView }) {
  const refs = useRef([]);

  const onKeyDown = (e, index) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = TABS.length - 1;
    setView(TABS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      className="w-100 d-flex align-items-center mb-4 justify-content-start overflow-auto"
      id="tab"
      role="tablist"
      aria-label="Campaign sections"
      style={{ gap: 32 }}
    >
      {TABS.map((tab, i) => {
        const selected = view === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => setView(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            style={{
              border: 0,
              background: "transparent",
              padding: "6px 0",
              fontWeight: selected ? 700 : 500,
              color: selected ? "var(--color-primary)" : "#5f6672",
              borderBottom: selected ? "2px solid var(--color-primary)" : "2px solid transparent",
              cursor: "pointer",
              fontSize: 16,
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
