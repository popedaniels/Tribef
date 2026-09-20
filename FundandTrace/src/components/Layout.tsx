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
        ogImage={ogImage}
      />
      {/* <!-- Google Tag Manager (noscript) — production only (see SEOHead) --> */}
      {typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1" ? (
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
