import { I18nProvider } from "../i18n";
import { LowDataProvider } from "../utils/lowData";
import React, { useEffect } from "react";
// Self-hosted fonts (bundled, same origin, latin subsets load on demand via
// unicode-range). Google Fonts used to be a render-blocking third-party
// stylesheet asking for 27 variants; these are the ones the design uses.
import "@fontsource-variable/plus-jakarta-sans/wght.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/bootstrap4-compat.css";
import "../../styles/index.css";
import "../../styles/polish.css";
import "../../styles/design-system.css";
import { Provider, useSelector } from "react-redux";
import store from "../../store/index";
import Toast from "../components/Toast/Toast";
import { persistStore } from "redux-persist";
import { check, selectAuthStateState } from "../../store/slices/authSlice";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import "../../styles/nprogress.css";
import Preloader from "../components/composed/Preloader/Preloader";
import Head from "next/head";
import MobileBottomDock from "../components/Navigation/MobileBottomDock";
import { useAppDispatch } from "./../../store/hooks";
import type { AppProps } from "next/app";

interface ContentProps {
  Component: AppProps["Component"];
  pageProps: AppProps["pageProps"];
}

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

// Restore the saved session only AFTER React has hydrated the server HTML.
// Restoring it at module load made the first client render differ from the
// server's (signed-in vs signed-out), which threw a hydration error on every
// page for signed-in visitors and made React discard the server HTML.
// Redirects that depend on auth wait for it via useRehydrated().
const persistor = persistStore(store, { manualPersist: true } as unknown as undefined);

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    persistor.persist();
  }, []);
  return (
    <Provider store={store}>
      <I18nProvider>
        <LowDataProvider>
          <Content Component={Component} pageProps={pageProps} />
          <Toast />
        </LowDataProvider>
      </I18nProvider>
    </Provider>
  );
}

function Content({ Component, pageProps }: ContentProps) {
  const dispatch = useAppDispatch();
  const { profile } = useSelector(selectAuthStateState);
  const router = useRouter();

  useEffect(() => {
    if (profile?._id) {
      dispatch(check(profile._id));
    }
  }, [profile?._id, dispatch]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => reg.update().catch(() => undefined))
      .catch(() => undefined);

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  return (
    <div>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, minimum-scale=1, viewport-fit=cover, user-scalable=yes"
        />
      </Head>
      {process.env.LOCK === "true" && router.pathname !== "/" ? (
        <Preloader comingSoon={true} />
      ) : (
        <>
          <Component {...pageProps} />
          <MobileBottomDock />
        </>
      )}
    </div>
  );
}

export default MyApp;
