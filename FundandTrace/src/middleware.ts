import { NextResponse, type NextRequest } from "next/server";
import { COUNTRY_COOKIE, detectCountry } from "./utils/geo";

// Remember the visitor's country (from the CDN's geo header, else the
// browser's language region) in a cookie the pages read for defaults.
// No third-party lookup, no IP stored. Only set when missing or changed.
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const detected = detectCountry(req.headers);
  if (detected && req.cookies.get(COUNTRY_COOKIE)?.value !== detected) {
    res.cookies.set(COUNTRY_COOKIE, detected, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  }
  return res;
}

export const config = {
  // Pages only: skip static files, images, Next internals and API routes.
  matcher: ["/((?!_next/|api/|images/|fonts/|favicon|robots.txt|sitemap|manifest|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|txt|xml|json)$).*)"],
};
