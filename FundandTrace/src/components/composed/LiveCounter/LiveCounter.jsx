import React, { useEffect, useRef, useState } from "react";
import styles from "./LiveCounter.module.scss";

export default function LiveCounter({
  targetNumber = 100,
  prefix = "",
  suffix = "",
  duration = 2000,
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime = null;

          const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeProgress * targetNumber));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(targetNumber);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [targetNumber, duration]);

  const formattedCount = count.toLocaleString();

  return (
    <span ref={ref} className={styles.counterWrap}>
      <span className={styles.prefix}>{prefix}</span>
      <span className={styles.number}>{formattedCount}</span>
      <span className={styles.suffix}>{suffix}</span>
    </span>
  );
}
