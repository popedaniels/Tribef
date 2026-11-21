import React, { useState } from "react";
import Link from "next/link";
import styles from "./TopCampaignSection.module.scss";
import CampaignCard from "../../CampaignCard/CampaignCard";
import type { Campaign } from "../../../types/campaigns";

interface TopCampaignSectionProps {
  data: Campaign[];
  heading?: string;
  title?: string;
  tag?: string;
  loading?: boolean;
}

const categories = [
  { label: "All Causes", value: "all" },
  { label: "Medical", value: "medical" },
  { label: "Emergency", value: "emergency" },
  { label: "Education", value: "education" },
  { label: "Nonprofit", value: "nonprofit" },
  { label: "Memorial", value: "memorial" },
];

export default function TopCampaignSection({ data, heading, title, tag, loading }: TopCampaignSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredCampaigns =
    selectedCategory === "all"
      ? data
      : data.filter(
          (c) =>
            c?.category?.toLowerCase() === selectedCategory ||
            c?.basicInformation?.category?.toLowerCase() === selectedCategory
        );

  return (
    <section className={styles.section} id="campaigns">
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.titleCol}>
            <span className={styles.tag}>{tag}</span>
            <h2>{heading || title}</h2>
          </div>
          <Link href="/Categories" passHref className={styles.viewAllLink}>

            <span>Explore All Causes</span>
            <span>→</span>

          </Link>
        </div>

        <div className={styles.filterBar} role="group" aria-label="Filter by cause">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.value}
              className="ft-pill"
              aria-pressed={selectedCategory === cat.value}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.cardGrid} aria-busy="true" aria-label="Loading campaigns">
            {[0, 1, 2].map((i) => (
              <div key={i} className="ft-card" style={{ overflow: "hidden" }}>
                <span className="ft-skeleton" style={{ height: 200, borderRadius: 0 }} />
                <div style={{ padding: 20 }}>
                  <span className="ft-skeleton" style={{ height: 14, width: "40%", marginBottom: 12 }} />
                  <span className="ft-skeleton" style={{ height: 20, width: "85%", marginBottom: 10 }} />
                  <span className="ft-skeleton" style={{ height: 14, width: "70%", marginBottom: 24 }} />
                  <span className="ft-skeleton" style={{ height: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className={styles.cardGrid}>
            {filteredCampaigns.slice(0, 6).map((campaign, i) => (
              <CampaignCard campaign={campaign} key={campaign?._id || i} />
            ))}
          </div>
        ) : (
          <div className="ft-empty">
            <h3>{selectedCategory === "all" ? "No live campaigns right now" : `No ${categories.find((c) => c.value === selectedCategory)?.label.toLowerCase()} campaigns yet`}</h3>
            <p>
              {selectedCategory === "all"
                ? "New campaigns appear here as soon as they launch. Have a cause in mind? Every campaign gets escrow and a public ledger from day one."
                : "Try another cause, or start the first one."}
            </p>
            <div className="d-flex justify-content-center flex-wrap" style={{ gap: 12 }}>
              {selectedCategory !== "all" && (
                <button type="button" className="ft-btn ft-btn--secondary" onClick={() => setSelectedCategory("all")}>
                  Show all causes
                </button>
              )}
              <Link href="/StartACampaign" className="ft-btn ft-btn--primary">
                Start a campaign
              </Link>
            </div>
          </div>
        )}

        <div className={styles.bottomCtaMobile}>
          <Link href="/Categories" passHref className={styles.viewAllLink}>

            <span>Explore All Causes →</span>

          </Link>
        </div>
      </div>
    </section>
  );
}
