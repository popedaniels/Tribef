import React from "react";
import NextHead from "next/head";
import Script from "next/script";

export default function SEOHead({
  title = "FundandTrace",
  description = "FundandTrace",
  url = "https://fundandtrace.com",
  ogImage = "https://res.cloudinary.com/wisdomosara/image/upload/v1631901631/fandtBanner_hmy59o.png",
}) {
  return (
    <>
      <NextHead>
      <meta charSet="UTF-8" />
      <meta
        name="viewport"
        content="initial-scale=1.0, width=device-width"
        key="viewport"
      />
      <title>{title}</title>
      <meta
        name="google-site-verification"
        content="ljsoh0qt1t_nPQ7CBFhT7C13rZk10FF_Z8v4_YMpLO8"
      />

      <meta name="description" content={description} />
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta property="og:site_name" content="Fund and Trace" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="keywords" content="Fund-raising, Africa, fundandtrace" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="@fundandtrace" />
      <meta name="twitter:site" content="@fundandtrace" />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={description} />
      <meta name="twitter:description" content={description} />
      <meta name="application-name" content="FundandTrace" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="FundandTrace" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="msapplication-tap-highlight" content="yes" />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/animate.css@3.5.2/animate.min.css"
      />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#6979F8" />
      <link rel="shortcut icon" href="/favicon72x72.png" />
      <link
        rel="apple-touch-icon"
        href="/images/FT_Favicon.svg"
        sizes="16x16"
      />
      {/* <!-- Google Tag Manager (production only — GTM sets third-party
      cookies that browsers flag as warnings on localhost/dev hosts) --> */}
      {/* <!-- End Google Tag Manager --> */}
    </NextHead>
    {typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1" ? (
      <Script
        id="gtm"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MFPDTB2')`,
        }}
      />
    ) : null}
  </>
  );
}
