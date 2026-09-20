import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { login } from "./authSlice";
import { toast } from "./ToastSlice";
// Slice
const signUpSlice = createSlice({
  name: "signUp",
  initialState: {
    signingIn: false,
    signUpSuccess: false,
    signUpFailed: { status: false, error: "" },
  },
  reducers: {
    setSignUpFailed: (state, action) => {
      state.signUpFailed = { ...state.signUpFailed, ...action.payload };
    },
    setSignUpSuccess: (state, action) => {
      state.signUpSuccess = action.payload;
    },
    setSigningIn: (state, action) => {
      state.signingIn = action.payload;
    },
    setBasicData: (state, action) => {
      state.basicData = { ...state.basicData, ...action.payload };
    },
  },
});

export const selectSignUpState = (state) => state.signUpReducer;
export const {
  setSignUpFailed,
  setSignUpSuccess,
  setSigningIn,
  setBasicData,
} = signUpSlice.actions;
export default signUpSlice.reducer;

const getApiUrl = () => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" && window.location.port === "3000"
      ? "http://localhost:5000"
      : "http://localhost:5000")
  );
};

export const signUp = (data) => async (dispatch) => {
  try {
    dispatch(setSigningIn(true));
    const res = await axios.post(
      getApiUrl() + "/api/auth/signup",
      data
    );
    res && dispatch(setSignUpSuccess(true));
    res && dispatch(toast(true, "Sign Up Successful", "success"));
    res && dispatch(setSignUpFailed({ status: false, error: "" }));
    res && dispatch(setSigningIn(false));
  } catch (error) {
    dispatch(
      setSignUpFailed({ status: true, error: error?.response?.data?.error || "Sign up failed" })
    );
    dispatch(setSigningIn(false));
    return console.log(error?.response);
  }
};
