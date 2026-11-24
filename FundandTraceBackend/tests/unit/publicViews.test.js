const {
  CAMPAIGN_PUBLIC_PROJECTION,
  toPublicCampaign,
  toPublicDonation,
  FUNDING_REQUEST_PUBLIC_PROJECTION,
  toPublicUser,
} = require("../../utility/publicViews");

const contact = {
  firstName: "Kofi",
  lastName: "Mensah",
  country: "GH",
  email: "kofi@example.com",
  phoneNumber: "0244000000",
  phoneCode: "+233",
  dateOfBirth: "1990-01-01",
  streetAddress: "1 Ring Road",
  zipCode: "00233",
  idImage: "https://res.cloudinary.com/x/id.jpg",
};

const campaign = {
  _id: "c1",
  basicInformation: { campaignTitle: "Clinic roof" },
  funding: {
    currency: "GHS",
    amountExpected: 1000,
    amountRaised: 400,
    bankName: "v2:aa",
    accountName: "v2:bb",
    accountNumber: "v2:cc",
    sortCode: "v2:dd",
  },
  team: { primaryContact: { ...contact }, secondContact: { ...contact } },
  stripeConnect: { accountId: "acct_123", payoutsEnabled: true },
  disputeGovernance: {
    isLocked: true,
    lockReason: "3 reports",
    disputeReports: [{ donorEmail: "a@x.com" }, { donorEmail: "b@x.com" }],
  },
  comments: [{ name: "Dami", email: "dami@example.com", comment: "Go!" }],
  adminActivities: [{ AdminId: "admin1" }],
};

describe("toPublicCampaign", () => {
  const view = toPublicCampaign(campaign);

  it("removes payout bank details", () => {
    expect(view.funding).toEqual({ currency: "GHS", amountExpected: 1000, amountRaised: 400 });
  });

  it("removes team contact PII but keeps names and country", () => {
    for (const key of ["primaryContact", "secondContact"]) {
      expect(view.team[key]).toEqual({ firstName: "Kofi", lastName: "Mensah", country: "GH" });
    }
  });

  it("hides dispute reporters but keeps the lock state and a count", () => {
    expect(view.disputeGovernance).toEqual({ isLocked: true, lockReason: "3 reports", disputeCount: 2 });
  });

  it("removes commenter emails, the Stripe account id and admin activity", () => {
    expect(view.comments[0]).toEqual({ name: "Dami", comment: "Go!" });
    expect(view.stripeConnect).toEqual({ payoutsEnabled: true });
    expect(view.adminActivities).toBeUndefined();
  });

  it("does not mutate the source document", () => {
    expect(campaign.funding.accountNumber).toBe("v2:cc");
    expect(campaign.team.primaryContact.email).toBe("kofi@example.com");
  });
});

describe("projections cover the same private fields", () => {
  it.each([
    "funding.accountNumber",
    "funding.bankName",
    "team.primaryContact.idImage",
    "team.secondContact.dateOfBirth",
    "disputeGovernance.disputeReports",
    "comments.email",
    "stripeConnect.accountId",
  ])("campaign projection excludes %s", (path) => {
    expect(CAMPAIGN_PUBLIC_PROJECTION[path]).toBe(0);
  });

  it.each(["thirdPartyAccountNumber", "disbursement.accountNumber", "vendorDisbursement.bankDetails"])(
    "funding request projection excludes %s",
    (path) => {
      expect(FUNDING_REQUEST_PUBLIC_PROJECTION[path]).toBe(0);
    }
  );
});

describe("toPublicDonation / toPublicUser", () => {
  it("masks anonymous donors and drops email, IP and fraud data", () => {
    const view = toPublicDonation({
      _id: "d1",
      donorName: "Dami",
      donorEmail: "dami@example.com",
      anonymous: true,
      amount: 25,
      fraud: { ip: "1.2.3.4" },
    });
    expect(view.donorName).toBe("Anonymous");
    expect(view).not.toHaveProperty("donorEmail");
    expect(view).not.toHaveProperty("fraud");
  });

  it("returns a profile without contact details or role", () => {
    const view = toPublicUser({ _id: "u1", firstName: "Kofi", email: "k@x.com", phone: "1", role: "user", country: "GH" });
    expect(view).toEqual({ _id: "u1", firstName: "Kofi", country: "GH" });
  });
});
