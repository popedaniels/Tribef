import React from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import Navbar from "../../Navbar/Navbar";
import { selectAuthStateState } from "../../../../store/slices/authSlice";
import styles from "./HeroSection.module.scss";

const Glass = dynamic(() => import("../../canvasui/Glass"), { ssr: false, loading: () => <div style={{height:260}} /> });
const ParticleObject = dynamic(() => import("../../canvasui/ParticleObject"), { ssr: false, loading: () => <div style={{height:260}} /> });

export default function HeroSection() {
  const { authenticated } = useSelector(selectAuthStateState);

  const scrollToCampaigns = (e) => {
    e.preventDefault();
    const element = document.getElementById("campaigns");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className={styles.container}>
      <Navbar />

      <div className={styles.heroContent}>
        <div className="custom-container">
          <div className="row align-items-center">
            {/* Left Column: Value Prop & CTA */}
            <div className="col-lg-6 mb-5 mb-lg-0">
              <div className={styles.leftCol}>
                <span className={styles.eyebrow}>
                  MILESTONE-VERIFIED CROWDFUNDING
                </span>

                <h1 className={styles.headline}>
                  Where Trust Powers <span className={styles.highlight}>Social Giving</span>.
                </h1>

                <p className={styles.subheadline}>
                  Donors don't just give to stories—they give to accountability. Fund&amp;Trace is the zero-fee platform where every dollar is held in transparent milestone escrow and released only as real-world proof is verified.
                </p>

                <div className={styles.ctaGroup}>
                  <Link
                    href={authenticated ? "/StartACampaign/type" : "/SignUp"}
                    passHref
                  >
                    <a className={styles.primaryBtn}>
                      <span>Start a Campaign</span>
                      <span className={styles.arrow}>→</span>
                    </a>
                  </Link>

                  <a
                    href="#campaigns"
                    onClick={scrollToCampaigns}
                    className={styles.secondaryBtn}
                  >
                    <span>Explore Verified Causes</span>
                    <span>↓</span>
                  </a>
                </div>

                <div className={styles.statsStrip}>
                  <div className={styles.statItem}>
                    <strong>0%</strong>
                    <span>Platform Commission</span>
                  </div>
                  <div className={styles.statItem}>
                    <strong>3.4x</strong>
                    <span>Higher Donor Conversion</span>
                  </div>
                  <div className={styles.statItem}>
                    <strong>100%</strong>
                    <span>Auditable Disbursements</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase (Canvas UI Glass lens + 3D particle shield) */}
            <div className="col-lg-6">
              <div style={{ position: "relative" }}>
                <Glass
                  shape="rectangle"
                  size={260}
                  aspect={1.4}
                  corner={24}
                  ior={1.35}
                  edge={0.6}
                  bevel={3}
                  depth={180}
                  aberration={0.6}
                  blur={0.4}
                  reflection={0.7}
                  shine={0.15}
                  zoom={1.15}
                >
                  <div className={styles.heroMediaCard}>
                    <Image
                      src="/images/master_hero.jpg"
                      alt="Doctor and Community Organizer reviewing milestone verifications"
                      width={600}
                      height={400}
                      priority
                      className={styles.heroImage}
                      style={{width:"100%",height:"auto"}}
                    />

                    {/* Floating Live Escrow Badge */}
                    <div className={styles.floatingMetric}>
                      <div className="d-flex align-items-center mb-1">
                        <span className={styles.liveDot}></span>
                        <strong style={{ fontSize: 13, color: "var(--color-text-heading)" }}>
                          Phase 2 Verified • Pediatric Care
                        </strong>
                      </div>
                      <p className="mb-0 text-muted" style={{ fontSize: 12 }}>
                        $9,000 hospital theatre invoice verified and settled directly to clinic.
                      </p>
                    </div>
                  </div>
                </Glass>

                {/* 3D particle shield — pure WebGL, works in every browser */}
                <div className={styles.particleAccent}>
                  <ParticleObject
                    style={{ width: "100%", height: "100%" }}
                    src="/images/icons/shield.svg"
                    count={5000}
                    size={2.5}
                    sizeVariance={0.5}
                    scale={2.4}
                    floatIntensity={2.5}
                    rotationIntensity={1.2}
                    floatSpeed={1.8}
                    orbit
                    swirl={0.8}
                    spring={1}
                    damping={0.35}
                    drift={0.5}
                    radius={120}
                    strength={1}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
