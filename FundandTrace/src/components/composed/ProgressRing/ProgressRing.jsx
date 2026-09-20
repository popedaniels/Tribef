import React from "react";
import styles from "./ProgressRing.module.scss";

export default function ProgressRing({
  progress = 0,
  size = 46,
  strokeWidth = 4,
  label = "",
  showPercentage = true,
  color = "var(--color-primary)",
}) {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className={styles.ringContainer} style={{ width: size, height: size }}>
      <svg width={size} height={size} className={styles.svgRing}>
        {/* Background track */}
        <circle
          stroke="rgba(105, 121, 248, 0.12)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Animated fill circle */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className={styles.animatedCircle}
        />
      </svg>
      <div className={styles.centerText}>
        {normalizedProgress >= 100 ? (
          <span className={styles.checkIcon}>✓</span>
        ) : showPercentage ? (
          <span className={styles.percentNumber}>{normalizedProgress}%</span>
        ) : (
          label
        )}
      </div>
    </div>
  );
}
