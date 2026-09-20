// Verified demo campaigns shown when the backend is unreachable,
// so the homepage and campaign pages render end-to-end without an API.
export const fallbackCampaigns = [
  {
    _id: "demo-1",
    category: "medical",
    organizer: "Daniel's Family",
    organizerId: "demo-organizer-1",
    basicInformation: {
      campaignTitle: "Urgent Pediatric Heart Surgery for Daniel",
      campaignTagline:
        "Providing pediatric cardiovascular surgery and post-op intensive care with milestone-verified hospital releases.",
      campaignImage: "/images/stories/medical_hope.jpg",
      locationState: "Lagos",
      locationCountry: "Nigeria",
    },
    funding: {
      currency: "USD",
      amountExpected: 15000,
      amountRaised: 11450,
      daysLeft: 12,
    },
    content: {
      story: [
        "Providing pediatric cardiovascular surgery and post-op intensive care with milestone-verified hospital releases.",
        "Every donation is held in milestone escrow and released only after verified proof — follow the live tracker to see each milestone as it is verified and settled directly to the hospital.",
      ],
    },
    updates: [],
    donations: [],
  },
  {
    _id: "demo-2",
    category: "education",
    organizer: "STEM for Girls Initiative",
    organizerId: "demo-organizer-2",
    basicInformation: {
      campaignTitle: "Solar Powered STEM & Cloud Lab for Girls",
      campaignTagline:
        "Equipping 300 underprivileged students with clean solar energy, 30 refurbished laptops, and certified coding bootcamps.",
      campaignImage: "/images/stories/tech_girls.jpg",
      locationState: "Nairobi",
      locationCountry: "Kenya",
    },
    funding: {
      currency: "USD",
      amountExpected: 8500,
      amountRaised: 6200,
      daysLeft: 18,
    },
    content: {
      story: [
        "Equipping 300 underprivileged students with clean solar energy, 30 refurbished laptops, and certified coding bootcamps.",
        "Donor funds are released milestone-by-milestone: solar installation, hardware procurement, and certification — each verified with photographed proof before the next tranche unlocks.",
      ],
    },
    updates: [],
    donations: [],
  },
  {
    _id: "demo-3",
    category: "emergency",
    organizer: "Mukono Parents Association",
    organizerId: "demo-organizer-3",
    basicInformation: {
      campaignTitle: "Clean Solar Borehole & Pipeline for Mukono Primary",
      campaignTagline:
        "Drilling an industrial depth borehole with solar pumps to eliminate waterborne diseases across 1,400 students and families.",
      campaignImage: "/images/stories/water_story.jpg",
      locationState: "Mukono",
      locationCountry: "Uganda",
    },
    funding: {
      currency: "USD",
      amountExpected: 12000,
      amountRaised: 12000,
      daysLeft: 0,
    },
    content: {
      story: [
        "Drilling an industrial depth borehole with solar pumps to eliminate waterborne diseases across 1,400 students and families.",
        "Vendor payments are escrowed and released only after geo-tagged verification photos from local engineers and community elders confirm each drilling milestone.",
      ],
    },
    updates: [],
    donations: [],
  },
  {
    _id: "demo-4",
    category: "nonprofit",
    organizer: "Community Health Alliance",
    organizerId: "demo-organizer-4",
    basicInformation: {
      campaignTitle: "Rural Solar Microgrid & Cold Storage for Clinics",
      campaignTagline:
        "Installing community solar microgrids and vaccine cold chain refrigeration across 5 underserved rural health centers.",
      campaignImage: "/images/stories/solar_eco.jpg",
      locationState: "Enugu",
      locationCountry: "Nigeria",
    },
    funding: {
      currency: "USD",
      amountExpected: 20000,
      amountRaised: 14800,
      daysLeft: 24,
    },
    content: {
      story: [
        "Installing community solar microgrids and vaccine cold chain refrigeration across 5 underserved rural health centers.",
        "Each clinic installation is a verified milestone — solar panels, inverters, and cold-chain units are inspected and signed off before funds are disbursed to suppliers.",
      ],
    },
    updates: [],
    donations: [],
  },
];
