// Jest configuration for backend unit tests (pure logic, no HTTP/DB).
// Controller/integration tests are run separately via Mocha (npm test).
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/unit/**/*.test.js"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  verbose: true,
  // otplib v13 pulls in ESM-only dependencies; transform them with babel.
  transform: {
    "^.+\\.[cm]?js$": [
      "babel-jest",
      { presets: [["@babel/preset-env", { targets: { node: "current" } }]] },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!(@scure|@noble|@otplib)/)"],
  collectCoverageFrom: [
    "utility/auth.js",
    "utility/config.js",
    "utility/encryption.js",
    "utility/fraud.js",
    "utility/twoFactor.js",
  ],
  // Coverage floor for the auth/fraud/crypto core. Run via `npm run test:unit:cov`
  // (CI enforces it; plain `npm run test:unit` stays fast for local loops).
  coverageThreshold: {
    "./utility/auth.js": { lines: 65 },
    "./utility/config.js": { lines: 50 },
    "./utility/encryption.js": { lines: 85 },
    "./utility/fraud.js": { lines: 50 },
    "./utility/twoFactor.js": { lines: 85 },
  },
};
