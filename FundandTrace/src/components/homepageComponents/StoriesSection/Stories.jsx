import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Stories.module.scss";

const defaultStories = [
  {
    image: "/images/stories/medical_hope.jpg",
    heading: "Baby Tariro's Successful Heart Surgery",
    role: "Pediatric Health Appeal • 100% Verified",
    raised: "$14,000",
    story:
      "“Fund&Trace gave our donors absolute confidence with direct hospital settlements for my daughter’s surgery. Supporters who usually hesitate to give online donated immediately because hospital billing invoices were verified in real-time.”",
    summary: "100% of surgery goal reached with 142 verified supporters across 6 countries.",
  },
  {
    image: "/images/stories/water_story.jpg",
    heading: "Mukono Primary Solar Water Well",
    role: "Community Infrastructure • Verified",
    raised: "$12,000",
    story:
      "“Breaking our solar pump installation into trackable phases made our local campaign go viral. Donors loved receiving automated statements and water purity test laboratory reports directly in their inbox.”",
    summary: "Provided clean drinking water to over 1,400 students with audited financial statements.",
  },
  {
    image: "/images/stories/tech_girls.jpg",
    heading: "Lagos STEM & Cloud Coding Lab",
    role: "Education Non-Profit • Milestone Audited",
    raised: "$18,500",
    story:
      "“The 0% platform fee and automated periodic statement feature saved us thousands of dollars and hundreds of hours of manual donor reporting. Fund&Trace is the new gold standard for honest crowdfunding.”",
    summary: "Equipped 85 young women with laptops and certified cloud computing training.",
  },
];

export default function Stories({ stories = defaultStories }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const nextStory = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % stories.length);
  }, [stories.length]);

  const prevStory = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? stories.length - 1 : prev - 1));
  }, [stories.length]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextStory();
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, stories.length, nextStory]);

  // Mobile Touch Swipe Listeners
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Go Next
      nextStory();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Go Previous
      prevStory();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <section
      className={styles.section}
      id="stories"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.tag}>Real Impact, Proven Proof</span>
          <h2>
            Stories from Our <span>Transparent Community</span>
          </h2>
          <p>
            Real creators and donors sharing how verifiable milestone disbursements helped change
            lives without fear of mismanagement.
          </p>
        </div>

        <div
          className={styles.storyCard}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ userSelect: "none", touchAction: "pan-y" }}
        >
          {/* Left Text Carousel Column */}
          <div className={styles.storyLeft}>
            <div className={styles.verifiedStoryPill}>
              <img src="/images/icons/blueCheck.svg" alt="verified" width="14" height="14" />
              <span>Verified Milestone Success</span>
            </div>

            <div className={styles.sliderViewport}>
              <div
                className={styles.sliderTrack}
                style={{
                  transform: `translateX(-${activeIndex * 100}%)`,
                }}
              >
                {stories.map((story, i) => (
                  <div className={styles.slideItem} key={i}>
                    <h3 className={styles.storyHeading}>{story.heading}</h3>
                    <p className={styles.roleText}>{story.role}</p>
                    <p className={styles.quoteText}>{story.story}</p>
                    <div className={styles.summaryBox}>
                      <strong>Impact Milestone: </strong>
                      <span>{story.summary}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.navControls}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={prevStory}
                aria-label="Previous story (Swipe Right)"
              >
                <img src="/images/icons/slidebackdark.svg" alt="prev" width="14" height="14" />
              </button>

              <div className={styles.dots}>
                {stories.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Jump to story ${i + 1}`}
                    style={{ border: "none", padding: 0, cursor: "pointer" }}
                  />
                ))}
              </div>

              <button
                type="button"
                className={styles.navBtn}
                onClick={nextStory}
                aria-label="Next story (Swipe Left)"
              >
                <img src="/images/icons/slidefrontdark.svg" alt="next" width="14" height="14" />
              </button>
            </div>
          </div>

          {/* Right Image Carousel Column */}
          <div className={styles.storyRight}>
            <div className={styles.imageWrapper}>
              <div
                className={styles.imageTrack}
                style={{
                  transform: `translateX(-${activeIndex * 100}%)`,
                }}
              >
                {stories.map((story, i) => (
                  <div className={styles.imageSlide} key={i}>
                    <img src={story.image} alt={story.heading} />
                  </div>
                ))}
              </div>

              <div className={styles.raisedBadge}>
                <span>Audited Total</span>
                <strong>{stories[activeIndex]?.raised || "$14,000"} Raised</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
