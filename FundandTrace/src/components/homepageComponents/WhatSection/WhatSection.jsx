import React, { useEffect } from "react";
import styles from "./WhatSection.module.scss";
import { AnimatePresence, useAnimation, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function WhatSection() {
  const controls = useAnimation();
  const [WhyRef, inView] = useInView();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <div className={[styles.container, "custom-container"].join(" ")}>
      <AnimatePresence>
        <motion.div
          className={styles.what_left}
          ref={WhyRef}
          animate={controls}
          initial="hidden"
          transition={{ duration: 0.6 }}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: -10 },
          }}
        >
          <img
            src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836172/oldman.jpg"
            alt="oldman_what"
            width="100%"
          />
        </motion.div>
        <motion.div
          className={styles.what_right}
          ref={WhyRef}
          animate={controls}
          initial="hidden"
          transition={{ duration: 0.6, delay: 0.3 }}
          variants={{
            visible: { opacity: 1, x: 0 },
            hidden: { opacity: 0, x: 10 },
          }}
        >
          <h2 className="text-blue mb-4 text-center text-md-left">
            WHAT MAKES US UNIQUE?
          </h2>
          <h2
            className="text-heading mb-4 text-center text-md-left"
            style={{ fontWeight: 500, lineHeight: "40px" }}
          >
            You donate to a campaign and you get fund statements of how the
            money is being spent after donations! Interesting right?
          </h2>
          <h4 className="text-small text-center text-md-left">
            You will receive email updates with Fund&Trace on campaigns to which
            you have contributed. You will also track campaign reports at
            intervals when the money is paid out. This allows you to keep in
            touch with how much you contributed to the cause you’re passionate
            about.
          </h4>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
