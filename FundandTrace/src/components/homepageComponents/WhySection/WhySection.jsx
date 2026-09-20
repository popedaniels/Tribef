import { useAnimation, motion } from "framer-motion";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import styles from "./WhySection.module.scss";

export default function WhySection() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={{ duration: 0.6 }}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 10 },
      }}
      className={[
        "d-flex flex-column flex-md-row justify-content-between align-items-center mt-5",
        styles.container,
      ].join(" ")}
      style={{ maxWidth: "1440px", marginLeft: "auto", marginRight: "auto" }}
    >
      <div className={[styles.why_left, ""].join(" ")}>
        <div className="d-flex justify-content-between flex-wrap blue-container mx-auto mx-md-0">
          <div className={[styles.why_items]}>
            <img
              src="/images/icons/setup.svg"
              alt="WhySectionIcon"
              width="50px"
              height="50px"
            />
            <h2 className="text-medium-white my-3">Simple setup</h2>
            <p className="mb-0 text-white">
              You can create a campaign and share your account in just a few
              minutes!
            </p>
          </div>
          <div className={[styles.why_items]}>
            <img
              src="/images/icons/payment.svg"
              alt="WhySectionIcon"
              width="50px"
              height="50px"
            />
            <h2 className="text-medium-white my-3">Secure payments</h2>
            <p className="mb-0 text-white">
              You always have secure payments on Fund&Trace when you donate.
            </p>
          </div>
          <div className={[styles.why_items]}>
            <img
              src="/images/icons/tracking.svg"
              alt="WhySectionIcon"
              width="50px"
              height="50px"
            />
            <h2 className="text-medium-white my-3">Track disbursements </h2>
            <p className="mb-0 text-white">
              You can also monitor how money is being paid out of a campaign.
            </p>
          </div>
          <div className={[styles.why_items]}>
            <img
              src="/images/icons/accountable.svg"
              alt="WhySectionIcon"
              width="50px"
              height="50px"
            />
            <h2 className="text-medium-white my-3">Accountable platform</h2>
            <p className="mb-0 text-white">
              On campaigns you are passionate about, you can receive accurate
              updates.
            </p>
          </div>
          <div className={[styles.why_items]}>
            <img
              src="/images/icons/reach.svg"
              alt="WhySectionIcon"
              width="50px"
              height="50px"
            />
            <h2 className="text-medium-white my-3">Social Reach</h2>
            <p className="mb-0 text-white">
              Share your campaigns on different social media channels to build
              traction
            </p>
          </div>
          <div className={[styles.why_items]}>
            <img
              src="/images/icons/consultation.svg"
              alt="WhySectionIcon"
              width="50px"
              height="50px"
            />
            <h2 className="text-medium-white my-3">24/7 Consultation</h2>
            <p className="mb-0 text-white">
              For you, we're always here. You can always tell us if you need any
              help.
            </p>
          </div>
        </div>
      </div>
      <div className={[styles.why_right, "blue-container"].join(" ")}>
        <p className="text-blue text-center text-md-left ">WHY CHOOSE US</p>
        <h3
          className="text-heading"
          style={{ fontWeight: 500, lineHeight: "40px" }}
        >
          With Fund&Trace, you are guaranteed secure fundraising and will be
          allowed to track campaigns you donated for
        </h3>
      </div>
    </motion.div>
  );
}
