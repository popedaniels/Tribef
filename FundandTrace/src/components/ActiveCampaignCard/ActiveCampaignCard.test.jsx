// ActiveCampaignCard component tests — renders campaign data & real days-left
import React from "react";
import { render, screen } from "@testing-library/react";
import ActiveCampaignCard from "./ActiveCampaignCard";

// next/link renders as a plain anchor in tests; router is mocked in jest.setup.js
jest.mock("next/link", () => {
  return ({ children, ...props }) => <a {...props}>{children}</a>;
});

const baseCampaign = {
  _id: "60f7117f2ee78d31b4de0f7d",
  basicInformation: {
    campaignTitle: "Help build a school",
    locationState: "Lagos",
    locationCountry: "Nigeria",
    campaignImage: "/images/stories/medical_hope.jpg",
  },
  funding: {
    currency: "USD",
    amountRaised: 4500,
    amountExpected: 10000,
  },
};

describe("ActiveCampaignCard", () => {
  it("renders title, location, raised amount and progress", () => {
    render(<ActiveCampaignCard campaign={baseCampaign} />);
    expect(screen.getByText("Help build a school")).toBeInTheDocument();
    expect(screen.getByText("Lagos, Nigeria")).toBeInTheDocument();
    expect(screen.getByText("$4,500")).toBeInTheDocument();
    expect(screen.getByText(/raised of/)).toBeInTheDocument();
  });

  it("renders real days remaining from createdAt + duration", () => {
    const createdAt = new Date(Date.now() - 5 * 86400000).toISOString();
    const campaign = {
      ...baseCampaign,
      createdAt,
      basicInformation: {
        ...baseCampaign.basicInformation,
        duration: 30,
      },
    };
    render(<ActiveCampaignCard campaign={campaign} />);
    expect(screen.getByText(/25 days left/)).toBeInTheDocument();
  });

  it("shows 0 days left for expired campaigns", () => {
    const campaign = {
      ...baseCampaign,
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      basicInformation: { ...baseCampaign.basicInformation, duration: 30 },
    };
    render(<ActiveCampaignCard campaign={campaign} />);
    expect(screen.getByText(/0 days left/)).toBeInTheDocument();
  });

  it("falls back to default image when missing", () => {
    const campaign = {
      ...baseCampaign,
      basicInformation: { ...baseCampaign.basicInformation, campaignImage: "" },
    };
    render(<ActiveCampaignCard campaign={campaign} />);
    const img = document.querySelector("img");
    // next/image rewrites src to /_next/image?url=... — check it contains fallback
    expect(img?.getAttribute("src")).toContain("medical_hope.jpg");
  });
});