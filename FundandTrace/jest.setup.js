// Registers jest-dom custom matchers (toBeInTheDocument, toHaveTextContent, etc.) as
// global expect extensions so they're available in every test without manual imports.
require("@testing-library/jest-dom");

// Mock Next.js router/cookies for component tests that import next hooks.
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  }),
}));