import reducer, {
  setStartCampaign,
  setBasicInfo,
  setContent,
  setFunding,
  setSettings,
  setPrimaryContact,
  setSecondContact,
  selectStartCampaignState,
  startCampaignActions,
} from "../../../store/slices/startCampaignSlice";

describe("startCampaignSlice", () => {
  const initialState = {};

  // Seeded state that mirrors the shape expected by nested reducers
  const seededState: any = {
    startCampaign: {
      basicInformation: { campaignTitle: "Old Title", duration: 30 },
      content: { story: "Old Story", video: "" },
      funding: { amountExpected: 1000, currency: "USD" },
      settings: { isPublic: false, allowExcess: false },
      team: {
        primaryContact: { name: "Alice", email: "alice@example.com" },
        secondContact: { name: "Bob", email: "bob@example.com" },
      },
    },
  };

  it("returns the initial state for unknown actions", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("setStartCampaign stores the campaign payload", () => {
    const campaign = { _id: "c1", basicInformation: { campaignTitle: "New" } };
    const state = reducer(initialState as any, setStartCampaign(campaign));
    expect((state as any).startCampaign).toEqual(campaign);
  });

  it("setStartCampaign overwrites previous campaign", () => {
    const first = reducer(initialState as any, setStartCampaign({ _id: "c1" }));
    const second = reducer(first as any, setStartCampaign({ _id: "c2" }));
    expect((second as any).startCampaign).toEqual({ _id: "c2" });
  });

  it("setBasicInfo merges into basicInformation", () => {
    const state = reducer(seededState, setBasicInfo({ campaignTitle: "New Title" }));
    expect((state as any).startCampaign.basicInformation).toEqual({
      campaignTitle: "New Title",
      duration: 30,
    });
  });

  it("setBasicInfo adds new keys without dropping existing", () => {
    const state = reducer(seededState, setBasicInfo({ locationCountry: "Nigeria" }));
    expect((state as any).startCampaign.basicInformation).toEqual({
      campaignTitle: "Old Title",
      duration: 30,
      locationCountry: "Nigeria",
    });
  });

  it("setContent merges into content", () => {
    const state = reducer(seededState, setContent({ story: "New Story" }));
    expect((state as any).startCampaign.content).toEqual({
      story: "New Story",
      video: "",
    });
  });

  it("setFunding merges into funding", () => {
    const state = reducer(seededState, setFunding({ amountExpected: 5000 }));
    expect((state as any).startCampaign.funding).toEqual({
      amountExpected: 5000,
      currency: "USD",
    });
  });

  it("setSettings merges into settings", () => {
    const state = reducer(seededState, setSettings({ isPublic: true }));
    expect((state as any).startCampaign.settings).toEqual({
      isPublic: true,
      allowExcess: false,
    });
  });

  it("setPrimaryContact merges into team.primaryContact", () => {
    const state = reducer(seededState, setPrimaryContact({ phone: "08012345678" }));
    expect((state as any).startCampaign.team.primaryContact).toEqual({
      name: "Alice",
      email: "alice@example.com",
      phone: "08012345678",
    });
  });

  it("setPrimaryContact overwrites existing keys", () => {
    const state = reducer(seededState, setPrimaryContact({ name: "Grace" }));
    expect((state as any).startCampaign.team.primaryContact.name).toBe("Grace");
    expect((state as any).startCampaign.team.primaryContact.email).toBe("alice@example.com");
  });

  it("setSecondContact merges into team.secondContact", () => {
    const state = reducer(seededState, setSecondContact({ phone: "08099999999" }));
    expect((state as any).startCampaign.team.secondContact).toEqual({
      name: "Bob",
      email: "bob@example.com",
      phone: "08099999999",
    });
  });

  it("setSecondContact preserves existing fields", () => {
    const state = reducer(seededState, setSecondContact({ name: "Charlie" }));
    expect((state as any).startCampaign.team.secondContact.name).toBe("Charlie");
    expect((state as any).startCampaign.team.secondContact.email).toBe("bob@example.com");
  });

  it("selectStartCampaignState reads from the persisted reducer key", () => {
    const rootState = { startCampaignReducer: seededState } as any;
    expect(selectStartCampaignState(rootState)).toBe(seededState);
  });

  it("startCampaignActions contains all reducer actions", () => {
    expect(startCampaignActions.setStartCampaign).toBeDefined();
    expect(startCampaignActions.setBasicInfo).toBeDefined();
    expect(startCampaignActions.setContent).toBeDefined();
    expect(startCampaignActions.setFunding).toBeDefined();
    expect(startCampaignActions.setSettings).toBeDefined();
    expect(startCampaignActions.setPrimaryContact).toBeDefined();
    expect(startCampaignActions.setSecondContact).toBeDefined();
  });

  it("sequential updates compose correctly", () => {
    let state: any = reducer(initialState as any, setStartCampaign(seededState.startCampaign));
    state = reducer(state, setBasicInfo({ campaignTitle: "Composed" }));
    state = reducer(state, setFunding({ currency: "NGN" }));
    expect((state as any).startCampaign.basicInformation.campaignTitle).toBe("Composed");
    expect((state as any).startCampaign.funding.currency).toBe("NGN");
    expect((state as any).startCampaign.funding.amountExpected).toBe(1000);
  });
});
