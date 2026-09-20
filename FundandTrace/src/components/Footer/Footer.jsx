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
            <Link href="/" passHref>
              <a className={styles.logoLink}>
                <img src="/images/logo.png" alt="Fund&Trace" width={88} height={60} />
              </a>
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
              <li><Link href="/Categories"><a>All Categories</a></Link></li>
              <li><Link href="/workings"><a>How It Works</a></Link></li>
              <li><Link href="/fundraisingIdeas"><a>Strategy Playbooks</a></Link></li>
              <li><Link href="/fundraising-stories"><a>Verified Stories</a></Link></li>
              <li><Link href="/fees"><a>0% Pricing &amp; Fees</a></Link></li>
            </ul>
          </div>

          <div className={styles.navCol}>
            <h4 className={styles.colTitle}>CAUSES</h4>
            <ul className={styles.navList}>
              <li><Link href="/category/medical"><a>Medical &amp; Surgery</a></Link></li>
              <li><Link href="/category/emergency"><a>Disaster Relief</a></Link></li>
              <li><Link href="/category/education"><a>STEM &amp; Education</a></Link></li>
              <li><Link href="/category/nonprofit"><a>NGO &amp; Charities</a></Link></li>
              <li><Link href="/category/memorial"><a>Memorial Funds</a></Link></li>
            </ul>
          </div>

          <div className={styles.navCol}>
            <h4 className={styles.colTitle}>COMPANY</h4>
            <ul className={styles.navList}>
              <li><Link href="/aboutUs"><a>About Fund&amp;Trace</a></Link></li>
              <li><Link href="/fundraising-stories"><a>Impact Chronicles</a></Link></li>
              <li><Link href="/help"><a>Help &amp; Support</a></Link></li>
              <li><Link href="/search"><a>Search Campaigns</a></Link></li>
              <li><Link href="/StartACampaign/type"><a>Start a Campaign</a></Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.copyrightText}>
            © {new Date().getFullYear()} Fund&amp;Trace Technologies Inc. Built with radical transparency.
          </div>
          <div className={styles.bottomLinks}>
            <Link href="/terms"><a>Terms of Service</a></Link>
            <span className={styles.dot}>•</span>
            <Link href="/privacy"><a>Privacy Policy</a></Link>
            <span className={styles.dot}>•</span>
            <Link href="/fees"><a>Fee Schedule</a></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
