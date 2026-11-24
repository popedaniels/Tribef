// Charity registry lookups (gap A-2).
//
//   GB — Charity Commission for England & Wales (needs CHARITIES_API key)
//   US — IRS-registered nonprofits via ProPublica Nonprofit Explorer (free, no key)
//   other — no public registry API (e.g. Nigeria CAC, Kenya NGO Board):
//           returned as "manual_review" so an admin verifies the documents.
const axios = require("axios");

const NUMBER_PATTERNS = {
  GB: /^[0-9]{5,8}(-[0-9]{1,2})?$/,
  US: /^[0-9]{2}-?[0-9]{7}$/, // EIN
};

class RegistryError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function lookupCharity(country, regNo) {
  const cc = String(country || "GB").toUpperCase();
  const number = String(regNo || "").trim();
  if (!number || number.length > 32) throw new RegistryError(400, "A registration number is required");

  if (cc === "GB") {
    if (!NUMBER_PATTERNS.GB.test(number)) throw new RegistryError(400, "UK charity numbers are 5–8 digits");
    if (!process.env.CHARITIES_API) throw new RegistryError(503, "UK charity lookup is not configured");
    const { data } = await axios.get(
      `https://api.charitycommission.gov.uk/register/api/allcharitydetails/${encodeURIComponent(number)}/0`,
      { headers: { "Cache-Control": "no-cache", "Ocp-Apim-Subscription-Key": process.env.CHARITIES_API }, timeout: 10000 }
    );
    if (!data || !data.charity_name) throw new RegistryError(404, "Charity not found");
    return {
      raw: data,
      registry: { country: "GB", number, name: data.charity_name, status: "verified", source: "Charity Commission for England and Wales" },
    };
  }

  if (cc === "US") {
    if (!NUMBER_PATTERNS.US.test(number)) throw new RegistryError(400, "US nonprofits are looked up by EIN (9 digits)");
    const ein = number.replace("-", "");
    try {
      const { data } = await axios.get(`https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`, { timeout: 10000 });
      const org = data?.organization;
      if (!org?.name) throw new RegistryError(404, "Nonprofit not found");
      return {
        raw: data,
        registry: {
          country: "US",
          number: ein,
          name: org.name,
          city: org.city,
          state: org.state,
          status: "verified",
          source: "IRS records via ProPublica Nonprofit Explorer",
        },
      };
    } catch (err) {
      if (err instanceof RegistryError) throw err;
      if (err.response?.status === 404) throw new RegistryError(404, "Nonprofit not found");
      throw err;
    }
  }

  return {
    raw: null,
    registry: {
      country: cc,
      number,
      status: "manual_review",
      source: "No public registry API — our team will verify your registration documents",
    },
  };
}

module.exports = { lookupCharity, RegistryError };
