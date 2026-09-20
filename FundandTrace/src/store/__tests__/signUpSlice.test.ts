import reducer, {
  setSignUpFailed,
  setSignUpSuccess,
  setSigningIn,
  setBasicData,
  selectSignUpState,
} from "../../../store/slices/signUpSlice";

describe("signUpSlice", () => {
  const initialState = {
    signingIn: false,
    signUpSuccess: false,
    signUpFailed: { status: false, error: "" },
  };

  it("returns the initial state for unknown actions", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("setSigningIn toggles the in-flight flag", () => {
    const signing = reducer(initialState, setSigningIn(true));
    expect(signing.signingIn).toBe(true);

    const settled = reducer(signing, setSigningIn(false));
    expect(settled.signingIn).toBe(false);
  });

  it("setSignUpSuccess stores success flag", () => {
    const success = reducer(initialState, setSignUpSuccess(true));
    expect(success.signUpSuccess).toBe(true);

    const reset = reducer(success, setSignUpSuccess(false));
    expect(reset.signUpSuccess).toBe(false);
  });

  it("setSignUpFailed records failure status and error", () => {
    const failed = reducer(
      initialState,
      setSignUpFailed({ status: true, error: "Email already exists" })
    );
    expect(failed.signUpFailed).toEqual({
      status: true,
      error: "Email already exists",
    });
  });

  it("setSignUpFailed merges partial updates", () => {
    const first = reducer(
      initialState,
      setSignUpFailed({ status: true, error: "First error" })
    );
    // Partial update with only status should preserve previous error due to spread merge
    const partial = reducer(first, setSignUpFailed({ status: false } as any));
    expect(partial.signUpFailed.status).toBe(false);
    expect(partial.signUpFailed.error).toBe("First error");
  });

  it("setSignUpFailed can clear error", () => {
    const failed = reducer(
      initialState,
      setSignUpFailed({ status: true, error: "Some error" })
    );
    const cleared = reducer(
      failed,
      setSignUpFailed({ status: false, error: "" })
    );
    expect(cleared.signUpFailed).toEqual({ status: false, error: "" });
  });

  it("setBasicData creates basicData from empty state", () => {
    const withData = reducer(
      initialState,
      setBasicData({ firstName: "Ada", email: "ada@example.com" })
    );
    expect((withData as any).basicData).toEqual({
      firstName: "Ada",
      email: "ada@example.com",
    });
  });

  it("setBasicData merges subsequent payloads", () => {
    const first = reducer(initialState, setBasicData({ firstName: "Ada" }));
    const second = reducer(first, setBasicData({ lastName: "Lovelace", email: "ada@example.com" }));
    expect((second as any).basicData).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    });
  });

  it("setBasicData overwrites existing keys", () => {
    const first = reducer(initialState, setBasicData({ firstName: "Ada" }));
    const updated = reducer(first, setBasicData({ firstName: "Grace" }));
    expect((updated as any).basicData.firstName).toBe("Grace");
  });

  it("selectSignUpState reads from the persisted reducer key", () => {
    expect(selectSignUpState({ signUpReducer: initialState })).toBe(initialState);
  });

  it("does not mutate unrelated state on setSigningIn", () => {
    const state = reducer(initialState, setSigningIn(true));
    expect(state.signUpSuccess).toBe(false);
    expect(state.signUpFailed).toEqual({ status: false, error: "" });
  });
});
