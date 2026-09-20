import axios from "axios";

export const getApiBaseUrl = (): string => {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location.origin) {
    // If running on port 3000, fallback to port 5000 in local dev
    if (window.location.port === "3000") {
      return "http://localhost:5000";
    }
    return window.location.origin;
  }
  return "http://localhost:5000";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    // Ensure baseURL is always dynamically resolved
    if (!config.baseURL || config.baseURL.includes("undefined")) {
      config.baseURL = getApiBaseUrl();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
