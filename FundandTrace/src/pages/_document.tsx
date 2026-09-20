import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from "next/document";
import React from "react";
import { ServerStyleSheet } from "styled-components";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Mobile & Web App Capabilities */}
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="application-name" content="Fund&Trace" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />
          <meta name="apple-mobile-web-app-title" content="Fund&Trace" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />

          {/* Theme Colors for Light & Dark Mode / Mobile Chrome navigation bar */}
          <meta name="theme-color" content="#6979F8" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#0B0F19" media="(prefers-color-scheme: dark)" />

          {/* Icons for iOS and PWA */}
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon180x180.png" />
          <link rel="apple-touch-icon" href="/favicon192x192.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
          <link rel="mask-icon" href="/images/logo.png" color="#6979F8" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
