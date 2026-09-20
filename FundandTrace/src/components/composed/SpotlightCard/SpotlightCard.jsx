import React, { useRef } from "react";
import styles from "./SpotlightCard.module.scss";

export default function SpotlightCard({ children, className = "", style = {} }) {
  const divRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty("--mouse-x", `${x}px`);
    divRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={[styles.spotlightCard, className].join(" ")}
      style={style}
    >
      <div className={styles.spotlightHalo} />
      <div className={styles.contentWrap}>{children}</div>
    </div>
  );
}
