import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import storage from "redux-persist/lib/storage";
import storageSession from "redux-persist/lib/storage/session";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import signUpReducer from "./slices/signUpSlice";
import authStateReducer from "./slices/authSlice";
import adminAuthStateReducer from "./slices/adminAuthStateSlice";
import startCampaignReducer from "./slices/startCampaignSlice";
import toastReducer from "./slices/ToastSlice";
import campaignErrorReducer from "./slices/startcampaignErrorSlice";

const adminConfig = {
  key: "adminAuthStateReducer",
  storage: storageSession,
};

const reducers = combineReducers({
  adminAuthStateReducer: persistReducer(adminConfig, adminAuthStateReducer),
  signUpReducer,
  authStateReducer,
  startCampaignReducer,
  toastReducer,
  campaignErrorReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["authStateReducer", "startCampaignReducer"],
};

const persistedReducer = persistReducer(persistConfig, reducers);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});
export default store;
