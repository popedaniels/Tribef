import { quote, FeeSchedule } from "../fees";

// Produced by the server (services/fees.js). If either side changes the
// formula, this fails: a donor would see one fee and be refused by the API.
const SERVER = {
 "schedule": {
  "platformFeePercent": 0,
  "modes": {
   "paystack": "required",
   "flutterwave": "required",
   "stripe": "optional"
  },
  "rules": {
   "paystack": {
    "NGN": {
     "pct": 1.5,
     "fixed": 100,
     "waiveFixedBelow": 2500,
     "cap": 2000,
     "label": "Paystack, Nigerian cards/bank: 1.5% + \u20a6100 (\u20a6100 waived under \u20a62,500), capped at \u20a62,000"
    },
    "GHS": {
     "pct": 1.95,
     "label": "Paystack Ghana: 1.95% (cards and mobile money)"
    },
    "KES": {
     "pct": 2.9,
     "label": "Paystack Kenya: 2.9% on cards",
     "methods": {
      "mpesa": {
       "pct": 1.5,
       "label": "Paystack Kenya: 1.5% on M-PESA"
      }
     }
    },
    "ZAR": {
     "pct": 2.9,
     "fixed": 1,
     "label": "Paystack South Africa: 2.9% + R1"
    },
    "USD": {
     "pct": 3.9,
     "label": "Paystack, USD cards: 3.9%"
    }
   },
   "flutterwave": {
    "NGN": {
     "pct": 2,
     "cap": 2000,
     "label": "Flutterwave Nigeria: 2% (1.4% + 0.6%), capped at \u20a62,000"
    },
    "*": {
     "pct": 2.9,
     "label": "Flutterwave: 2.9% (cards and mobile money outside Nigeria)"
    }
   },
   "stripe": {
    "GBP": {
     "pct": 1.5,
     "fixed": 0.2,
     "label": "Stripe, UK cards: 1.5% + 20p",
     "byDonorRegion": {
      "eea": {
       "pct": 2.5,
       "fixed": 0.2,
       "label": "Stripe, EEA cards: 2.5% + 20p"
      },
      "intl": {
       "pct": 3.25,
       "fixed": 0.2,
       "label": "Stripe, international cards: 3.25% + 20p"
      }
     }
    },
    "USD": {
     "pct": 3.25,
     "fixed": 0.25,
     "fx": 2,
     "label": "Stripe, cards in USD: 3.25% + 2% conversion + ~20p"
    },
    "NGN": {
     "pct": 3.25,
     "fixed": 0,
     "fx": 2,
     "label": "Stripe, cards in NGN: 3.25% + 2% conversion"
    }
   }
  },
  "eea": [
   "AT",
   "BE",
   "BG",
   "HR",
   "CY",
   "CZ",
   "DK",
   "EE",
   "FI",
   "FR",
   "DE",
   "GR",
   "HU",
   "IE",
   "IT",
   "LV",
   "LT",
   "LU",
   "MT",
   "NL",
   "PL",
   "PT",
   "RO",
   "SK",
   "SI",
   "ES",
   "SE",
   "IS",
   "LI",
   "NO"
  ],
  "checkedOn": "2026-11-24"
 },
 "cases": [
  {
   "rail": "paystack",
   "currency": "NGN",
   "base": 1000,
   "coverFee": false,
   "method": "",
   "donorCountry": "",
   "fee": 15.23
  },
  {
   "rail": "paystack",
   "currency": "NGN",
   "base": 10000,
   "coverFee": false,
   "method": "",
   "donorCountry": "",
   "fee": 253.81
  },
  {
   "rail": "paystack",
   "currency": "NGN",
   "base": 2000000,
   "coverFee": false,
   "method": "",
   "donorCountry": "",
   "fee": 2000
  },
  {
   "rail": "paystack",
   "currency": "KES",
   "base": 1000,
   "coverFee": false,
   "method": "mpesa",
   "donorCountry": "",
   "fee": 15.23
  },
  {
   "rail": "paystack",
   "currency": "GHS",
   "base": 250,
   "coverFee": false,
   "method": "",
   "donorCountry": "",
   "fee": 4.98
  },
  {
   "rail": "flutterwave",
   "currency": "NGN",
   "base": 50000,
   "coverFee": false,
   "method": "",
   "donorCountry": "",
   "fee": 1020.41
  },
  {
   "rail": "flutterwave",
   "currency": "UGX",
   "base": 80000,
   "coverFee": false,
   "method": "",
   "donorCountry": "",
   "fee": 2389.29
  },
  {
   "rail": "stripe",
   "currency": "GBP",
   "base": 50,
   "coverFee": true,
   "method": "",
   "donorCountry": "GB",
   "fee": 0.97
  },
  {
   "rail": "stripe",
   "currency": "GBP",
   "base": 50,
   "coverFee": true,
   "method": "",
   "donorCountry": "DE",
   "fee": 1.49
  },
  {
   "rail": "stripe",
   "currency": "GBP",
   "base": 50,
   "coverFee": false,
   "method": "",
   "donorCountry": "US",
   "fee": 0
  },
  {
   "rail": "stripe",
   "currency": "USD",
   "base": 100,
   "coverFee": true,
   "method": "",
   "donorCountry": "",
   "fee": 5.81
  }
 ]
};

describe("card fee: browser matches server", () => {
  it.each(SERVER.cases)("$rail $currency $base cover=$coverFee $method $donorCountry", (c) => {
    expect(quote(SERVER.schedule as unknown as FeeSchedule, c).fee).toBe(c.fee);
  });
});
