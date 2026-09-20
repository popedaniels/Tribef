import Header from "../../components/HeaderComponent/Header";
import styled from "styled-components";
import Stories from "../../components/homepageComponents/StoriesSection/Stories";
import StartFunding from "../../components/homepageComponents/StartFundingSection/StartFunding";
import TopCampaignSection from "../../components/homepageComponents/topCampaignSection/TopCampaignSection";
import FeaturesGrid from "../../components/homepageComponents/FeaturesGrid/FeaturesGrid";
import PageLayout from "../../components/pageLayout";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Preloader from "../../components/composed/Preloader/Preloader";
import Layout from "../../components/Layout";
import type { GetServerSidePropsContext } from "next";

interface CategoryInfo {
  category?: string;
  heroHeading: string;
  heroText: string;
  chipData: { text: string }[];
}

interface CategoryPageProps {
  category: CategoryInfo;
}

const categoryDefaults = {
  medical: {
    heroHeading: "Get Help with Medical & Healthcare Fundraising",
    heroText: "With Fund&Trace, you can raise money for surgeries, cancer treatments, and hospital bills with milestone-verified payouts.",
    chipData: [{ text: "Surgery" }, { text: "Cancer Care" }, { text: "Pediatrics" }, { text: "Medication" }, { text: "ICU Support" }],
  },
  emergency: {
    heroHeading: "Immediate Emergency & Disaster Relief",
    heroText: "Rapid response funding for families and communities facing sudden crises, natural disasters, or unexpected displacement.",
    chipData: [{ text: "Flood Relief" }, { text: "Fire Damage" }, { text: "Food Relief" }, { text: "Shelter" }, { text: "Clean Water" }],
  },
  education: {
    heroHeading: "Empower Students & Schools Through Education",
    heroText: "Fund school tuition, STEM labs, books, and scholarship programs with 100% transparent disbursements.",
    chipData: [{ text: "Tuition Fees" }, { text: "STEM Labs" }, { text: "Books & Kits" }, { text: "Scholarships" }, { text: "School Renovation" }],
  },
  nonprofit: {
    heroHeading: "Transparent Funding for NGOs & Nonprofits",
    heroText: "Help registered charities and grassroots initiatives scale verified community projects with automated donor statements.",
    chipData: [{ text: "Community Outreach" }, { text: "Clean Water" }, { text: "Youth Mentorship" }, { text: "Hunger Relief" }],
  },
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const categoryName = (context.query.name as string) || "medical";
  const nameLower = categoryName.toLowerCase();
  const defaultInfo: CategoryInfo =
    categoryDefaults[nameLower as keyof typeof categoryDefaults] || {
      heroHeading: `Fundraising for ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Causes`,
      heroText: `Start a verified campaign for ${categoryName} with 0% platform fees and milestone-tracked donations.`,
      chipData: [{ text: "Support" }, { text: "Community" }, { text: "Emergency" }, { text: "Milestones" }],
    };

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const categoryData = await axios.get(
      `${apiUrl}/api/categories/category/${nameLower}`,
      { timeout: 2500 }
    );
    const category: CategoryInfo = categoryData?.data?.data || {
      category: categoryName,
      ...defaultInfo,
    };
    return { props: { category } };
  } catch (err) {
    return {
      props: {
        category: {
          category: categoryName,
          ...defaultInfo,
        },
      },
    };
  }
}

export default function Category({ category }: CategoryPageProps) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [preloader, setPreloader] = useState(false);

  const getAllCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const camps = await axios.get(
        `${apiUrl}/api/campaigns/searchByCategory/${router.query.name}`,
        { timeout: 2500 }
      );
      if (camps?.data?.data?.campaigns) {
        setCampaigns(camps.data.data.campaigns);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [router.query.name]);

  useEffect(() => {
    if (router.query.name) {
      getAllCampaigns();
    }
  }, [router.query.name, getAllCampaigns]);

  const catTitle = category?.category
    ? category.category.charAt(0).toUpperCase() + category.category.slice(1)
    : "Category";

  return (
    <Layout
      title={`${catTitle} Crowdfunding | Fund&Trace`}
      description={category?.heroText || "Verified crowdfunding campaigns."}
      showFooter
    >
      <Preloader isVisible={preloader} />
      <Wrapper>
        <Header category={category} />

        <div className="featuresSection">
          <FeaturesGrid />
        </div>

        <TopCampaignSection
          data={campaigns}
          heading={`Verified ${catTitle} Campaigns`}
          tag="CATEGORY CAUSES"
          loading={loading}
        />

        <Stories />
        <StartFunding />
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.div`
  .featuresSection {
    background: #fbfcfe;
    border-top: 1px solid #eef1f8;
    border-bottom: 1px solid #eef1f8;
  }
`;
