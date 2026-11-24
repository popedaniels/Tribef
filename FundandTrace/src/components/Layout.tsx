import React from "react";
import SEOHead from "./composed/SEOHead";
import Footer from "./Footer/Footer";
import EscrowHelperPill from "./composed/EscrowHelperPill/EscrowHelperPill";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  url?: string;
  ogImage?: string;
  showFooter?: boolean;
}

export default function Layout({
  children,
  title = "FundandTrace",
  description = "FundandTrace",
  url = "https://fundandtrace.com",
  ogImage = "/og-image.jpg",
  showFooter = false,
}: LayoutProps) {
  return (
    <>
      <SEOHead
        title={title}
        url={url}
        description={description}
        // Crawlers (WhatsApp, X, Facebook) need an absolute URL.
        ogImage={ogImage && ogImage.startsWith("/") ? `https://fundandtrace.com${ogImage}` : ogImage}
      />
      {/* <!-- Google Tag Manager (noscript) — production builds only.
          Gated on NODE_ENV (identical on server and client) rather than
          `window`, which rendered nothing on the server but a <noscript> on
          the client and caused a hydration mismatch on every production page. --> */}
      {process.env.NODE_ENV === "production" ? (
        <noscript
          dangerouslySetInnerHTML={{
            __html: `
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-MFPDTB2"
          height="0"
          width="0"
          style="display:none;visibility:hidden"
        ></iframe>`,
          }}
        ></noscript>
      ) : null}
      {/* End Google Tag Manager (noscript) */}
      {children}
      <EscrowHelperPill />
      {showFooter && <Footer />}
    </>
  );
}
