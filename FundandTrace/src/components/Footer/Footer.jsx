import React from "react";
import Link from "next/link";
import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footerWrapper}>
      <div className="custom-container">
        {/* Top Grid */}
        <div className={styles.topGrid}>
          {/* Brand Col */}
          <div className={styles.brandCol}>
            <Link href="/" passHref className={styles.logoLink}>

              <img src="/images/logo.png" alt="Fund&Trace" width={88} height={60} />

            </Link>
            <p className={styles.brandMission}>
              The milestone-verified crowdfunding platform that eliminates platform fees and brings radical transparency to global social giving.
            </p>
            <div className={styles.trustBadge}>
              <span className={styles.shieldIcon}>🛡️</span>
              <div>
                <strong>100% Escrow Verified</strong>
                <p className="mb-0">Zero platform commissions on all medical &amp; disaster causes.</p>
              </div>
            </div>
          </div>

          {/* Nav Columns */}
          <div className={styles.navCol}>
            <h4 className={styles.colTitle}>EXPLORE</h4>
            <ul className={styles.navList}>
              <li><Link href="/Categories">All Categories</Link></li>
              <li><Link href="/workings">How It Works</Link></li>
              <li><Link href="/fundraisingIdeas">Strategy Playbooks</Link></li>
              <li><Link href="/fundraising-stories">Verified Stories</Link></li>
              <li><Link href="/fees">0% Pricing &amp; Fees</Link></li>
            </ul>
          </div>

          <div className={styles.navCol}>
            <h4 className={styles.colTitle}>CAUSES</h4>
            <ul className={styles.navList}>
              <li><Link href="/category/medical">Medical &amp; Surgery</Link></li>
              <li><Link href="/category/emergency">Disaster Relief</Link></li>
              <li><Link href="/category/education">STEM &amp; Education</Link></li>
              <li><Link href="/category/nonprofit">NGO &amp; Charities</Link></li>
              <li><Link href="/category/memorial">Memorial Funds</Link></li>
            </ul>
          </div>

          <div className={styles.navCol}>
            <h4 className={styles.colTitle}>COMPANY</h4>
            <ul className={styles.navList}>
              <li><Link href="/aboutUs">About Fund&amp;Trace</Link></li>
              <li><Link href="/fundraising-stories">Impact Chronicles</Link></li>
              <li><Link href="/help">Help &amp; Support</Link></li>
              <li><Link href="/search">Search Campaigns</Link></li>
              <li><Link href="/StartACampaign/type">Start a Campaign</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.copyrightText}>
            © {new Date().getFullYear()} Fund&amp;Trace Technologies Inc. Built with radical transparency.
          </div>
          <div className={styles.bottomLinks}>
            <Link href="/terms">Terms of Service</Link>
            <span className={styles.dot}>•</span>
            <Link href="/privacy">Privacy Policy</Link>
            <span className={styles.dot}>•</span>
            <Link href="/fees">Fee Schedule</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
