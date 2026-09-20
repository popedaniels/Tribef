import { createSlice } from "@reduxjs/toolkit";
// Slice
const toastSlice = createSlice({
  name: "toast",
  initialState: {
    showToast: {
      show: false,
      text: "",
      type: "",
    },
  },
  reducers: {
    setShowToast: (state, action) => {
      state.showToast = action.payload;
    },
  },
});

export const selectToastState = (state) => state.toastReducer;
export default toastSlice.reducer;
// Actions
export const { setShowToast } = toastSlice.actions;

export const toast = (show, text, type) => async (dispatch) => {
  try {
    dispatch(setShowToast({ show: show, text: text, type: type }));
  } catch (error) {
    return console.log(error.response);
  }
};
