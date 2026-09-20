import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "./ToastSlice";

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

const getApiUrl = () => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" && window.location.port === "3000"
      ? "http://localhost:5000"
      : "http://localhost:5000")
  );
};

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
    res && dispatch(authStateActions.setProfile(res?.data?.data?.userProfile));
    res && dispatch(authStateActions.loginSuccess(true));
    res && dispatch(authStateActions.setLoggingIn(false));
    res && dispatch(toast(true, "Sign In successful", "success"));
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
