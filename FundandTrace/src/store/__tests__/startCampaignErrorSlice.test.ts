import reducer, {
  setShowCampaignError,
  selectCampaignErrorState,
  campaignError,
} from "../../../store/slices/startcampaignErrorSlice";
import { configureStore } from "@reduxjs/toolkit";

describe("startcampaignErrorSlice", () => {
  const initialState = { showCampaignError: false };

  it("returns the initial state for unknown actions", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("setShowCampaignError sets true", () => {
    const state = reducer(initialState, setShowCampaignError(true));
    expect(state.showCampaignError).toBe(true);
  });

  it("setShowCampaignError sets false", () => {
    const withError = reducer(initialState, setShowCampaignError(true));
    const cleared = reducer(withError, setShowCampaignError(false));
    expect(cleared.showCampaignError).toBe(false);
  });

  it("toggles error flag multiple times", () => {
    let state = reducer(initialState, setShowCampaignError(true));
    expect(state.showCampaignError).toBe(true);
    state = reducer(state, setShowCampaignError(false));
    expect(state.showCampaignError).toBe(false);
    state = reducer(state, setShowCampaignError(true));
    expect(state.showCampaignError).toBe(true);
  });

  it("selectCampaignErrorState reads from the persisted reducer key", () => {
    expect(selectCampaignErrorState({ campaignErrorReducer: initialState })).toBe(initialState);
    const withError = { showCampaignError: true };
    expect(selectCampaignErrorState({ campaignErrorReducer: withError } as any)).toBe(withError);
  });

  it("campaignError thunk dispatches setShowCampaignError true", async () => {
    const store = configureStore({ reducer: { campaignErrorReducer: reducer } });
    await (store.dispatch as any)(campaignError(true));
    expect(selectCampaignErrorState(store.getState() as any).showCampaignError).toBe(true);
  });

  it("campaignError thunk dispatches setShowCampaignError false", async () => {
    const store = configureStore({ reducer: { campaignErrorReducer: reducer } });
    // start true then false
    await (store.dispatch as any)(campaignError(true));
    await (store.dispatch as any)(campaignError(false));
    expect(selectCampaignErrorState(store.getState() as any).showCampaignError).toBe(false);
  });

  it("campaignError thunk handles false payload", async () => {
    const store = configureStore({ reducer: { campaignErrorReducer: reducer } });
    await (store.dispatch as any)(campaignError(false));
    expect(selectCampaignErrorState(store.getState() as any).showCampaignError).toBe(false);
  });
});
