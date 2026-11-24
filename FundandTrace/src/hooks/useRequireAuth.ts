import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../store/slices/authSlice";

export const SIGN_IN_PATH = "/SignUp/SignIn";

/**
 * Only allow same-origin, path-absolute redirect targets ("/dashboard"),
 * never "//evil.com" or "https://evil.com" (open redirect).
 */
export const safeNextPath = (value: unknown, fallback = "/dashboard"): string => {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string") return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return fallback;
  }
  return candidate;
};

type PersistedState = { _persist?: { rehydrated?: boolean } };

/**
 * Gate a page on authentication.
 *
 * redux-persist restores the session from localStorage *asynchronously*, so
 * on a hard refresh `authenticated` is briefly false. Redirecting before
 * rehydration finished used to bounce signed-in users out of the dashboard.
 * This waits for rehydration, then sends signed-out visitors to sign-in with
 * a `next` parameter so they land back where they were.
 *
 * Returns `ready === true` only once the user is known to be signed in;
 * render a loader until then so child pages don't fire requests with an
 * `undefined` user id.
 */
export function useRequireAuth() {
  const router = useRouter();
  const rehydrated = useSelector((state: PersistedState) => Boolean(state?._persist?.rehydrated));
  const { authenticated, profile } = useSelector(selectAuthStateState);

  useEffect(() => {
    if (!router.isReady || !rehydrated || authenticated) return;
    router.replace(`${SIGN_IN_PATH}?next=${encodeURIComponent(router.asPath)}`);
  }, [rehydrated, authenticated, router]);

  return { ready: rehydrated && Boolean(authenticated), profile };
}

/**
 * True once redux-persist has restored the saved session. Gate any redirect
 * that depends on `authenticated` on this: before it, a signed-in user looks
 * signed out (the session is restored after hydration; see _app.tsx).
 */
export function useRehydrated(): boolean {
  return useSelector((state: PersistedState) => Boolean(state?._persist?.rehydrated));
}

/** Same, for the admin session (persisted separately in sessionStorage). */
export function useAdminRehydrated(): boolean {
  return useSelector((state: { adminAuthStateReducer?: PersistedState }) => Boolean(state?.adminAuthStateReducer?._persist?.rehydrated));
}
