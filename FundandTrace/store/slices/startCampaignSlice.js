import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { useSelector } from "react-redux";
import { getApiBaseUrl } from "../../src/utils/api";
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
const getApiUrl = () => getApiBaseUrl();

export const loadStartCampaign = (id) => async (dispatch) => {
  // A fresh wizard has no draft yet; calling /campaign/<empty> just 500s.
  if (!id || id === "undefined" || id === "null") return;
  try {
    const res = await axios.get(
      getApiUrl() + "/api/campaigns/campaign/" + id
    );

    res && dispatch(startCampaignActions.setStartCampaign(res.data.data));
  } catch (error) {
    console.log(error);
  }
};
