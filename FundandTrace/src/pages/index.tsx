import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import api from "../utils/api";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import HeroSection from "../components/homepageComponents/heroSection/HeroSection";
import type { FallbackCampaigns } from "../types/campaigns";

// Below-fold sections — dynamically imported to split framer-motion and
// heavy UI out of the initial bundle. ssr:true preserves SEO while still
// code-splitting. HeroSection stays eager (above-fold LCP).
const TraceabilitySteps = dynamic(
  () => import("../components/homepageComponents/TraceabilitySteps/TraceabilitySteps"),
  { ssr: true }
);
const AudienceBenefits = dynamic(
  () => import("../components/homepageComponents/AudienceBenefits/AudienceBenefits"),
  { ssr: true }
);
const TopCampaignSection = dynamic(
  () => import("../components/homepageComponents/topCampaignSection/TopCampaignSection"),
  { ssr: true }
);
const FeaturesGrid = dynamic(
  () => import("../components/homepageComponents/FeaturesGrid/FeaturesGrid"),
  { ssr: true }
);
const GlobalImpact = dynamic(
  () => import("../components/homepageComponents/GlobalImpact/GlobalImpact"),
  { ssr: true }
);
const ComparisonMatrix = dynamic(
  () => import("../components/homepageComponents/ComparisonMatrix/ComparisonMatrix"),
  { ssr: true }
);
const LiveActivityTicker = dynamic(
  () => import("../components/homepageComponents/LiveActivityTicker/LiveActivityTicker"),
  { ssr: true }
);
const EscrowWorkflowSimulator = dynamic(
  () => import("../components/homepageComponents/EscrowWorkflowSimulator/EscrowWorkflowSimulator"),
  { ssr: true }
);
const Stories = dynamic(
  () => import("../components/homepageComponents/StoriesSection/Stories"),
  { ssr: true }
);
const StartFunding = dynamic(
  () => import("../components/homepageComponents/StartFundingSection/StartFunding"),
  { ssr: true }
);

export default function Home() {
  const [campaigns, setCampaigns] = useState<FallbackCampaigns>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getAllCampaigns = async () => {
    try {
      const res = await api.get("/api/campaigns");
      if (res?.data?.data && res.data.data.length > 0) {
        setCampaigns(res.data.data);
      }
    } catch (error) {
      setCampaigns([]);
    }
  };

  useEffect(() => {
    getAllCampaigns();
  }, []);

  const handleSmoothScroll = () => {
    if (typeof window !== "undefined") {
      const hashId = window.location.hash;
      if (hashId) {
        const element = document.querySelector(hashId);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }
    }
  };

  useEffect(() => {
    handleSmoothScroll();
  }, [router.query]);

  return (
    <Layout
      description="The 1st trackable and transparent crowdfunding platform. Donors verify where every dollar goes in real-time with milestone-audited statements, and creators raise funds with 0% platform fees."
      title="FundandTrace | The 1st Trackable & Transparent Crowdfunding Platform"
      showFooter
      url="https://fundandtrace.com"
      ogImage="/og-image.jpg"
    >
      {/* 1. Hero with Dual CTAs, Live Audit Timeline, and Trust Badges */}
      <HeroSection />

      {/* 2. Real-Time Verified Escrow Disbursals Marquee Stream */}
      <LiveActivityTicker />

      {/* 3. 4-Step Traceability Engine */}
      <TraceabilitySteps />

      {/* 4. Dual Persona Value Section */}
      <AudienceBenefits />

      {/* 5. Verified Campaigns Showcase */}
      <TopCampaignSection
        data={campaigns}
        heading="Verified Campaigns Making Real Impact"
        tag="DISCOVER & SUPPORT"
        loading={loading}
      />

      {/* 6. Platform Pillars Grid */}
      <FeaturesGrid />

      {/* 7. Institutional Comparison Matrix */}
      <ComparisonMatrix />

      {/* 8. Interactive Proof-of-Escrow Workflow Simulator */}
      <EscrowWorkflowSimulator />

      {/* 9. Global Impact Narrative */}
      <GlobalImpact />

      {/* 10. Verified Stories & Testimonials */}
      <Stories />

      {/* 11. Closing High-Conversion Banner */}
      <StartFunding />
    </Layout>
  );
}
