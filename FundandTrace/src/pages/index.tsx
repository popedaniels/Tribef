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
const ComparisonMatrix = dynamic(
  () => import("../components/homepageComponents/ComparisonMatrix/ComparisonMatrix"),
  { ssr: true }
);
const EscrowWorkflowSimulator = dynamic(
  () => import("../components/homepageComponents/EscrowWorkflowSimulator/EscrowWorkflowSimulator"),
  { ssr: true }
);
const StartFunding = dynamic(
  () => import("../components/homepageComponents/StartFundingSection/StartFunding"),
  { ssr: true }
);

export default function Home() {
  const [campaigns, setCampaigns] = useState<FallbackCampaigns>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getAllCampaigns = async () => {
    try {
      const res = await api.get("/api/campaigns");
      if (res?.data?.data && res.data.data.length > 0) {
        setCampaigns(res.data.data);
      }
    } catch (error) {
      setCampaigns([]);
    } finally {
      setLoading(false);
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
      description="Crowdfunding with escrow and a public ledger. Donations are released in reviewed stages, receipts are published, and anyone can verify where the money went. No platform fee."
      title="Fund&Trace | Crowdfunding you can verify"
      showFooter
      url="https://fundandtrace.com"
      ogImage="/og-image.jpg"
    >
      {/* 1. Value proposition */}
      <HeroSection />

      {/* 2. Real campaigns, early: what people came to see */}
      <TopCampaignSection
        data={campaigns}
        heading="Campaigns you can support today"
        tag="Live campaigns"
        loading={loading}
      />

      {/* 3. How it works */}
      <TraceabilitySteps />

      {/* 4. One donation, step by step */}
      <EscrowWorkflowSimulator />

      {/* 5. Donors and organisers */}
      <AudienceBenefits />

      {/* 6. Honest comparison with the usual model */}
      <ComparisonMatrix />

      {/* 7. Closing call to action */}
      <StartFunding />
    </Layout>
  );
}
