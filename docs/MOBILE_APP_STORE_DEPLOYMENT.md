# Fund&Trace — Mobile Chrome, Google Play Store & Apple App Store Deployment Guide

This guide details how **Fund&Trace** is optimized for Mobile Chrome, mobile browsers, and how to package and publish it directly to the **Google Play Store** (via Trusted Web Activity / Bubblewrap) and the **Apple App Store** (via Capacitor / WebKit native wrapper).

---

## 1. 📱 Mobile Chrome & Mobile Browser Optimization (PWA)

Fund&Trace is built with modern mobile ergonomics:
- **Viewport Safe-Area Inset Support**: Full compatibility with iPhone Notch, Dynamic Island, and Android gesture navigation bars (`env(safe-area-inset-*)`).
- **iOS/Android Input Auto-Zoom Prevention**: Enforces `16px` base font size on form controls on screens $< 768\text{px}$ to stop mobile browsers from zooming in and breaking touch layout.
- **Fluid Typography**: Dynamic `clamp()` typography that scales cleanly between compact screens (e.g. 375px iPhone SE) and large tablets.
- **Touch Targets**: Minimum $44 \times 44\text{px}$ touch targets with `touch-action: manipulation` eliminating the 300ms tap delay.
- **Offline & Standalone Capabilities**: Fully configured `manifest.json` and service worker caching for "Add to Home Screen" standalone app mode.

---

## 2. 🤖 Google Play Store Deployment (Trusted Web Activity / TWA)

Google's Trusted Web Activity (TWA) allows Next.js / PWA applications to be published directly to Google Play as a native Android App Bundle (`.aab`) with **zero browser URL bar** and full hardware integration.

### Step 2.1: Prerequisites
```bash
# Install Bubblewrap CLI (Google's official TWA builder)
npm install -g @bubblewrap/cli
```

### Step 2.2: Initialize the Android Project
```bash
bubblewrap init --manifest=https://fundandtrace.com/manifest.json
```
Bubblewrap will automatically download the Android SDK and parse your `manifest.json`. When prompted:
* **Application Name**: `Fund&Trace`
* **Package ID**: `com.fundandtrace.app`
* **Host**: `fundandtrace.com`
* **Start URL**: `/?source=pwa`
* **Display Mode**: `standalone`
* **Theme / Background Color**: `#6979F8` / `#FFFFFF`

### Step 2.3: Link Android Digital Asset Links
1. Bubblewrap generates an Android signing keystore and outputs your **SHA-256 fingerprint**.
2. Add your SHA-256 fingerprint into [`FundandTrace/public/.well-known/assetlinks.json`](file:///home/psalmprax/ALL_PROJECTS/tribef/FundandTrace/public/.well-known/assetlinks.json):
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.fundandtrace.app",
         "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT_HERE"]
       }
     }
   ]
   ```
3. Deploy the updated `assetlinks.json` to your live domain `https://fundandtrace.com/.well-known/assetlinks.json`.

### Step 2.4: Build the Android App Bundle (`.aab`)
```bash
bubblewrap build
```
This produces `app-release-bundle.aab`. Upload this file to the **Google Play Console** under **Production / Internal Testing**.

---

## 3. 🍎 Apple App Store Deployment (Capacitor / iOS Wrapper)

To distribute on iOS with the Apple App Store, Capacitor wraps the Next.js production web app inside a native Swift WKWebView container.

### Step 3.1: Install Capacitor in Frontend
```bash
cd FundandTrace
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android --save
npx cap init "Fund&Trace" "com.fundandtrace.app" --web-dir "out"
```

### Step 3.2: Configure `capacitor.config.json` for Live Server URL
In `capacitor.config.json`:
```json
{
  "appId": "com.fundandtrace.app",
  "appName": "Fund&Trace",
  "webDir": "out",
  "server": {
    "url": "https://fundandtrace.com",
    "cleartext": false
  },
  "ios": {
    "contentInset": "always",
    "allowsLinkPreview": false
  }
}
```

### Step 3.3: Add iOS Native Platform & Open in Xcode
```bash
npx cap add ios
npx cap open ios
```

### Step 3.4: Xcode Build & Submission
1. In Xcode, select your **Development Team** under Signing & Capabilities.
2. Enable **Associated Domains** with domain: `applinks:fundandtrace.com`.
3. Archive the project (`Product` $\to$ `Archive`) and click **Distribute App** to submit directly to **App Store Connect** / TestFlight.

---

## 4. 🧪 Mobile Verification Checklist

- [x] Viewport meta `width=device-width, initial-scale=1, viewport-fit=cover` active.
- [x] Input auto-zoom disabled on iOS/Chrome ($16\text{px}$ minimum font size).
- [x] App icons (72x72 through 512x512 with `maskable` purpose) present.
- [x] `manifest.json` configured with standalone mode and high-res icons.
- [x] Digital Asset Links (`.well-known/assetlinks.json`) configured.
- [x] Apple App Site Association (`.well-known/apple-app-site-association`) configured.
- [x] Mobile bottom navigation dock (`Explore`, `Launch`, `Tracker`, `Dashboard`) styled with blur backdrop and safe-area padding.
