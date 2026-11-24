import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "./ToastSlice";
import { getApiBaseUrl } from "../../src/utils/api";

// Slice
const adminAuthStateSlice = createSlice({
  name: "adminAuthState",
  initialState: {
    adminLoggingIn: false,
    adminLogInFailed: { status: false, error: "" },
    JWT: "",
    adminProfile: {}
  },
  reducers: {
    adminLoginSuccess: (state, action) => {
      state.adminAuthenticated = action.payload;
    },
    setAdminLogInFailed: (state, action) => {
      state.adminLogInFailed = { ...state.adminLogInFailed, ...action.payload };
    },
    setAdminLoggingIn: (state, action) => {
      state.adminLoggingIn = action.payload;
    },
    adminLogoutSuccess: (state, action) => {
      state.adminAuthenticated = action.payload;
      state.adminProfile = {};
      state.JWT = "";
    },
    setAdminProfile: (state, action) => {
      state.adminProfile = action.payload;
    },
    setEditProfile: (state, action) => {
      state.adminProfile = { ...state.adminProfile, ...action.payload };
    },
    setJWT: (state, action) => {
      state.JWT = action.payload;
    },
  },
});

export const selectAdminAuthStateState = (state) => state.adminAuthStateReducer;
export default adminAuthStateSlice.reducer;
// Actions
export const adminAuthStateActions = adminAuthStateSlice.actions;

const getApiUrl = () => getApiBaseUrl();

export const adminLogin = (email, password) => async (dispatch) => {
  try {
    dispatch(
      adminAuthStateActions.setAdminLogInFailed({
        status: false,
        error: "",
      })
    );
    dispatch(adminAuthStateActions.setAdminLoggingIn(true));

    const res = await axios.post(
      getApiUrl() + "/api/admin/login",
      {
        email,
        password,
      }
    );
    dispatch(adminAuthStateActions.setAdminLoggingIn(false));
    // Password OK but a second step is needed: the page asks for the
    // authenticator code (or sets 2FA up first) and then calls
    // adminCompleteLogin with the session it gets back.
    if (res?.data?.twoFactorRequired || res?.data?.twoFactorSetupRequired) {
      return res.data;
    }
    dispatch(adminCompleteLogin(res?.data?.data));
    return true;
  } catch (error) {
    dispatch(toast(true, error?.response?.data?.error, "error"));
    dispatch(adminAuthStateActions.setAdminLoggingIn(false));
    dispatch(
      adminAuthStateActions.setAdminLogInFailed({
        status: true,
        error: error?.response?.data?.error,
      })
    );
    return false;
  }
};

export const adminCompleteLogin = (data) => (dispatch) => {
  dispatch(adminAuthStateActions.setAdminProfile(data?.userProfile));
  dispatch(adminAuthStateActions.setJWT(data?.jwt));
  dispatch(adminAuthStateActions.adminLoginSuccess(true));
  dispatch(toast(true, "Sign In successful", "success"));
};

export const adminLogout = () => async (dispatch) => {
  try {
    dispatch(toast(true, "Logged Out", "success"));
    sessionStorage.removeItem("persist:adminAuthStateReducer");
    dispatch(adminAuthStateActions.adminLogoutSuccess(false));
  } catch (e) {
    return console.error(e?.message);
  }
};

// export const check = (id) => async (dispatch) => {
//   const checked = await axios.get(
//     getApiBaseUrl() + "/api/auth/checkExists/" + id
//   );
//   if (checked?.data?.status == true) {
//     dispatch(adminAuthStateActions.setAdminProfile(checked?.data?.data));
//   } else {
//     console.log("deleted");
//     return dispatch(logout());
//   }
// };
