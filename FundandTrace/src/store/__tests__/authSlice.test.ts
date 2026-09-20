import reducer, {
  authStateActions,
  selectAuthStateState,
} from "../../../store/slices/authSlice";

interface AuthStateWithProfile {
  loggingIn: boolean;
  logInFailed: { status: boolean; error: string };
  authenticated?: boolean;
  profile?: Record<string, unknown>;
}

describe("authSlice", () => {
  const initialState = {
    loggingIn: false,
    logInFailed: { status: false, error: "" },
  };

  it("returns the initial state for unknown actions", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("setLoggingIn toggles the in-flight flag", () => {
    const state = reducer(initialState, authStateActions.setLoggingIn(true));
    expect(state.loggingIn).toBe(true);

    const settled = reducer(state, authStateActions.setLoggingIn(false));
    expect(settled.loggingIn).toBe(false);
  });

  it("setLogInFailed records the failure message", () => {
    const state = reducer(
      initialState,
      authStateActions.setLogInFailed({ status: true, error: "Invalid credentials" })
    );
    expect(state.logInFailed).toEqual({
      status: true,
      error: "Invalid credentials",
    });
  });

  it("logoutSuccess clears the profile", () => {
    const withProfile = reducer(
      initialState,
      authStateActions.setProfile({ _id: "u1", email: "a@b.c" })
    );
    const loggedOut = reducer(withProfile, authStateActions.logoutSuccess(false));
    expect((loggedOut as AuthStateWithProfile).profile).toEqual({});
  });

  it("setEditProfile merges partial updates into the profile", () => {
    const withProfile = reducer(
      initialState,
      authStateActions.setProfile({ _id: "u1", firstName: "Ada" })
    );
    const updated = reducer(
      withProfile,
      authStateActions.setEditProfile({ country: "NG" })
    );
    expect((updated as AuthStateWithProfile).profile).toEqual({ _id: "u1", firstName: "Ada", country: "NG" });
  });

  it("selectAuthStateState reads from the persisted reducer key", () => {
    expect(selectAuthStateState({ authStateReducer: initialState })).toBe(initialState);
  });
});
