import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "./ToastSlice";
import { getApiBaseUrl } from "../../src/utils/api";

// Slice
const authStateSlice = createSlice({
  name: "authState",
  initialState: {
    loggingIn: false,
    logInFailed: { status: false, error: "" },
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.authenticated = action.payload;
    },
    setLogInFailed: (state, action) => {
      state.logInFailed = { ...state.logInFailed, ...action.payload };
    },
    setLoggingIn: (state, action) => {
      state.loggingIn = action.payload;
    },
    logoutSuccess: (state, action) => {
      state.authenticated = action.payload;
      state.profile = {};
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    setEditProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
  },
});

export const selectAuthStateState = (state) => state.authStateReducer;
export default authStateSlice.reducer;
// Actions
export const authStateActions = authStateSlice.actions;

const getApiUrl = () => getApiBaseUrl();

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(
      authStateActions.setLogInFailed({
        status: false,
        error: "",
      })
    );
    dispatch(authStateActions.setLoggingIn(true));

    const res = await axios.post(
      `${getApiUrl()}/api/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    dispatch(authStateActions.setLoggingIn(false));
    // 2FA on: the sign-in page asks for the authenticator code next.
    if (res?.data?.twoFactorRequired) return { twoFactorRequired: true, challengeToken: res.data.challengeToken };
    dispatch(authStateActions.setProfile(res?.data?.data?.userProfile));
    dispatch(authStateActions.loginSuccess(true));
    dispatch(toast(true, "Sign In successful", "success"));
    return true;
  } catch (error) {
    dispatch(toast(true, error?.response?.data?.error || "Login failed", "error"));
    dispatch(authStateActions.setLoggingIn(false));
    dispatch(
      authStateActions.setLogInFailed({
        status: true,
        error: error?.response?.data?.error || "Login failed",
      })
    );
    return false;
  }
};

// Second sign-in step for accounts with two-factor authentication.
export const completeTwoFactor = (challengeToken, token) => async (dispatch) => {
  const res = await axios.post(`${getApiUrl()}/api/auth/2fa/challenge`, { challengeToken, token }, { withCredentials: true });
  dispatch(authStateActions.setProfile(res?.data?.data?.userProfile));
  dispatch(authStateActions.loginSuccess(true));
  dispatch(toast(true, "Sign In successful", "success"));
  return true;
};

export const logout = () => async (dispatch) => {
  try {
    const res = await axios.post(
      `${getApiUrl()}/api/auth/logout`,
      {},
      { withCredentials: true }
    );
    res && dispatch(toast(true, "Logged Out", "success"));
    res && localStorage.removeItem("persist:root");
    return dispatch(authStateActions.logoutSuccess(false));
  } catch (e) {
    return console.error(e?.message);
  }
};

export const check = (id) => async (dispatch) => {
  try {
    const checked = await axios.get(
      `${getApiUrl()}/api/auth/checkExists/${id}`
    );
    if (checked?.data?.status == true) {
      dispatch(authStateActions.setProfile(checked?.data?.data));
    } else {
      console.log("deleted");
      return dispatch(logout());
    }
  } catch (err) {
    console.warn("Auth check failed:", err.message);
  }
};
