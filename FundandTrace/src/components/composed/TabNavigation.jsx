import React from "react";

export default function TabNavigation({ view, setView }) {
  return (
    <div
      className="w-100 d-flex align-items-center mb-4 justify-content-start overflow-auto"
      id="tab"
    >
      <h5
        className="mr-5"
        style={{
          fontWeight: view == "story" ? 600 : 400,
          color: view == "story" ? "var(--color-primary)" : "#adadad",
          cursor: "pointer",
          fontSize: 16,
        }}
        onClick={() => setView("story")}
        role="button"
      >
        STORY
      </h5>
      <h5
        className="mr-5"
        style={{
          fontWeight: view == "updates" ? 600 : 400,
          color: view == "updates" ? "var(--color-primary)" : "#adadad",
          cursor: "pointer",
          fontSize: 16,
        }}
        onClick={() => setView("updates")}
        role="button"
      >
        UPDATES
      </h5>
      <h5
        className="mr-5"
        style={{
          fontWeight: view == "live" ? 600 : 400,
          color: view == "live" ? "var(--color-primary)" : "#adadad",
          cursor: "pointer",
          fontSize: 16,
        }}
        onClick={() => setView("live")}
        role="button"
      >
        LIVE
      </h5>
      <h5
        style={{
          fontWeight: view == "contact" ? 600 : 400,
          color: view == "contact" ? "var(--color-primary)" : "#adadad",
          cursor: "pointer",
          fontSize: 16,
        }}
        onClick={() => setView("contact")}
        role="button"
      >
        CONTACT
      </h5>
    </div>
  );
}
