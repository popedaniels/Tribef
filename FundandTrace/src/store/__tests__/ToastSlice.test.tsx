import { configureStore } from "@reduxjs/toolkit";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import toastReducer, {
  setShowToast,
  selectToastState,
  toast,
} from "../../../store/slices/ToastSlice";
import Toast from "../../components/Toast/Toast";

describe("ToastSlice", () => {
  const initialState = { showToast: { show: false, text: "", type: "" } };

  it("starts hidden", () => {
    expect(toastReducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("setShowToast stores the visible message and type", () => {
    const state = toastReducer(
      initialState,
      setShowToast({ show: true, text: "Campaign saved", type: "success" })
    );
    expect(state.showToast).toEqual({
      show: true,
      text: "Campaign saved",
      type: "success",
    });
  });

  it("toast thunk dispatches the visibility payload", async () => {
    const store = configureStore({ reducer: { toastReducer } });
    await store.dispatch(toast(true, "Message sent", "success"));
    expect(selectToastState(store.getState())).toEqual({
      showToast: { show: true, text: "Message sent", type: "success" },
    });
  });

  it("Toast component renders the active message through a real store", () => {
    // DomPortal mounts into Next's #__next element; create it for jsdom.
    const nextRoot = document.createElement("div");
    nextRoot.id = "__next";
    document.body.appendChild(nextRoot);

    const store = configureStore({ reducer: { toastReducer } });
    render(
      <Provider store={store}>
        <Toast />
      </Provider>
    );

    act(() => {
      store.dispatch(setShowToast({ show: true, text: "Message Sent!", type: "success" }));
    });

    expect(screen.getByText("Message Sent!")).toBeInTheDocument();

    nextRoot.remove();
  });
});
