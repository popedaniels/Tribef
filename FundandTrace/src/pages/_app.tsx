import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/index.css";
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

persistStore(store);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Content Component={Component} pageProps={pageProps} />
      <Toast />
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
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
