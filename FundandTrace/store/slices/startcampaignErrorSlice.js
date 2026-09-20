import { createSlice } from "@reduxjs/toolkit";
// Slice
const campaignErrorSlice = createSlice({
  name: "campaignError",
  initialState: {
    showCampaignError: false,
  },
  reducers: {
    setShowCampaignError: (state, action) => {
      state.showCampaignError = action.payload;
    },
  },
});

export const selectCampaignErrorState = (state) => state.campaignErrorReducer;
export default campaignErrorSlice.reducer;
// Actions
export const { setShowCampaignError } = campaignErrorSlice.actions;

export const campaignError = (payload) => async (dispatch) => {
  try {
    dispatch(setShowCampaignError(payload));
  } catch (error) {
    return console.log(error.response);
  }
};
