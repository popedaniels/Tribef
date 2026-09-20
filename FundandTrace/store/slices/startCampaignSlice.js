import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { useSelector } from "react-redux";
// Typed initial state for strict tsc compliance
/** @type {{ startCampaign?: any }} */
const initialState = {};

// Slice
const startCampaignSlice = createSlice({
  name: "startCampaign",
  initialState,
  reducers: {
    setStartCampaign: (state, action) => {
      state.startCampaign = action.payload;
    },
    setBasicInfo: (state, action) => {
      state.startCampaign.basicInformation = {
        ...state.startCampaign.basicInformation,
        ...action.payload,
      };
    },
    setContent: (state, action) => {
      state.startCampaign.content = {
        ...state.startCampaign.content,
        ...action.payload,
      };
    },
    setFunding: (state, action) => {
      state.startCampaign.funding = {
        ...state.startCampaign.funding,
        ...action.payload,
      };
    },
    setSettings: (state, action) => {
      state.startCampaign.settings = {
        ...state.startCampaign.settings,
        ...action.payload,
      };
    },
    setPrimaryContact: (state, action) => {
      state.startCampaign.team.primaryContact = {
        ...state.startCampaign.team.primaryContact,
        ...action.payload,
      };
    },
    setSecondContact: (state, action) => {
      state.startCampaign.team.secondContact = {
        ...state.startCampaign.team.secondContact,
        ...action.payload,
      };
    },
  },
});

export const selectStartCampaignState = (state) => state.startCampaignReducer;
export const startCampaignActions = startCampaignSlice.actions;
export const {
  setStartCampaign,
  setBasicInfo,
  setContent,
  setFunding,
  setSettings,
  setPrimaryContact,
  setSecondContact,
} = startCampaignSlice.actions;
export default startCampaignSlice.reducer;

// Actions
const getApiUrl = () => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" && window.location.port === "3000"
      ? "http://localhost:5000"
      : "http://localhost:5000")
  );
};

export const loadStartCampaign = (id) => async (dispatch) => {
  try {
    const res = await axios.get(
      getApiUrl() + "/api/campaigns/campaign/" + id
    );

    res && dispatch(startCampaignActions.setStartCampaign(res.data.data));
  } catch (error) {
    console.log(error);
  }
};
