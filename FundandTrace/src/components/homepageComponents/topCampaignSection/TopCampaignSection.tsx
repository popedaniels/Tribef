import React, { useState } from "react";
import Link from "next/link";
import styles from "./TopCampaignSection.module.scss";
import CampaignCard from "../../CampaignCard/CampaignCard";
import Spinner from "../../composed/spinner/Spinner";
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
          <Link href="/Categories" passHref>
            <a className={styles.viewAllLink}>
              <span>Explore All Causes</span>
              <span>→</span>
            </a>
          </Link>
        </div>

        <div className={styles.filterBar}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`${styles.filterBtn} ${
                selectedCategory === cat.value ? styles.filterBtnActive : ""
              }`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="d-flex align-items-center justify-content-center my-5 py-5">
            <Spinner type="Oval" width={32} height={32} color={"var(--color-primary)"} />
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className={styles.cardGrid}>
            {filteredCampaigns.slice(0, 6).map((campaign, i) => (
              <CampaignCard campaign={campaign} key={campaign?._id || i} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>No Campaigns Found</h3>
            <p>There are currently no active campaigns in this category.</p>
            <Link href="/Categories" passHref>
              <a className="btn btn-primary" style={{ background: "var(--color-primary)", border: "none" }}>
                Browse All Categories
              </a>
            </Link>
          </div>
        )}

        <div className={styles.bottomCtaMobile}>
          <Link href="/Categories" passHref>
            <a className={styles.viewAllLink}>
              <span>Explore All Causes →</span>
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
}
