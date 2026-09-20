import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "./ToastSlice";

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

const getApiUrl = () => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" && window.location.port === "3000"
      ? "http://localhost:5000"
      : "http://localhost:5000")
  );
};

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
    console.log(res);
    res &&
      dispatch(
        adminAuthStateActions.setAdminProfile(res?.data?.data?.userProfile)
      );
    res && dispatch(adminAuthStateActions.setJWT(res?.data?.data?.jwt));

    res && dispatch(adminAuthStateActions.adminLoginSuccess(true));
    res && dispatch(adminAuthStateActions.setAdminLoggingIn(false));
    res && dispatch(toast(true, "Sign In successful", "success"));
    if (res) {
      return true;
    } else {
      return false;
    }
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
//     process.env.NEXT_PUBLIC_API_URL + "/api/auth/checkExists/" + id
//   );
//   if (checked?.data?.status == true) {
//     dispatch(adminAuthStateActions.setAdminProfile(checked?.data?.data));
//   } else {
//     console.log("deleted");
//     return dispatch(logout());
//   }
// };
