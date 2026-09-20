import React, { useEffect, useState, useCallback } from "react";
import StartLayout from "./StartLayout";
import { useRouter } from "next/router";
import axios from "axios";
import {
  loadStartCampaign,
  selectStartCampaignState,
  startCampaignActions,
} from "../../../store/slices/startCampaignSlice";
import { useSelector } from "react-redux";
import { logout, selectAuthStateState } from "../../../store/slices/authSlice";
import { toast } from "../../../store/slices/ToastSlice";
import {
  grabErrorMessage,
  grabErrorStatus,
  uploadImage,
} from "../../components/helperFunctions/helperFunctions";
import {
  selectCampaignErrorState,
  setShowCampaignError,
} from "../../../store/slices/startcampaignErrorSlice";
import styled from "styled-components";
import {
  getAllCountries,
  getCountries,
  getStates,
  handleCountrySearchFunction,
  handleStateSearchFunction,
} from "../../components/helperFunctions/locationFunctions";
import CategoryModal from "../../components/composed/Modal/DefaultModal/CategoryModal";
import { useAppDispatch } from "./../../../store/hooks";

interface CountryOption {
  name: string;
  phone_code: string;
  href: { flag: string };
  states: string[];
}

interface StateOption {
  name: string;
}

export default function BasicInformation() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { startCampaign } = useSelector(selectStartCampaignState);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const { authenticated } = useSelector(selectAuthStateState);
  const [error, setError] = useState({
    title: "",
    tagline: "",
    campaignImage: "",
    locationCountry: "",
    locationState: "",
    duration: "",
  });
  const [campError, setCampError] = useState(false);
  const { showCampaignError } = useSelector(selectCampaignErrorState);
  const [states, setStates] = useState<StateOption[]>([]);
  const [allStates, setAllStates] = useState<StateOption[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [allCountries, setAllCountries] = useState<CountryOption[]>([]);
  const [showCountries, setShowCountries] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    !authenticated && router.push("/SignUp");
  }, [authenticated, router]);

  const popUp = useCallback(() => {
    setShowModal(true);
    setCategory(String(router.query.category || ""));
    setType(String(router.query.type || ""));
  }, [router.query.category, router.query.type]);

  useEffect(() => {
    router.query.category && popUp();
  }, [router, popUp]);

  const getAllCountriesFromFunction = useCallback(async () => {
    const countries = await getAllCountries();
    setAllCountries(countries);
    setCountries(countries);
  }, []);

  const getAllStatesFromFunction = useCallback(async () => {
    const states = await getStates(
      startCampaign?.basicInformation?.locationCountry
    );
    setStates(states);
    setAllStates(states);
  }, [startCampaign?.basicInformation?.locationCountry]);

  useEffect(() => {
    getAllCountriesFromFunction();
  }, [getAllCountriesFromFunction]);

  const handleCountrySearch = useCallback(() => {
    setCountries(handleCountrySearchFunction(allCountries, selectedCountry));
  }, [allCountries, selectedCountry]);

  const handleStateSearch = useCallback(() => {
    setStates(handleStateSearchFunction(allStates, selectedState));
  }, [allStates, selectedState]);

  useEffect(() => {
    handleCountrySearch();
  }, [selectedCountry, handleCountrySearch]);

  useEffect(() => {
    handleStateSearch();
  }, [selectedState, handleStateSearch]);

  useEffect(() => {
    startCampaign?.basicInformation?.locationCountry &&
      getAllStatesFromFunction();
  }, [startCampaign?.basicInformation?.locationCountry, getAllStatesFromFunction]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      const file = e.target.files![0];
      const res = await uploadImage(file);
      res &&
        dispatch(
          startCampaignActions.setBasicInfo({
            campaignImage: res?.url.data.secure_url,
          })
        );
      setLoading(false);
      res && setSelectedFile(res?.file as string);
    } catch (error) {
      setLoading(false);
      dispatch(
        toast(true, "Unable to upload the image. Please try again.", "error")
      );
    }
  };

  useEffect(() => {
    const storedCampaignId = localStorage.getItem("campaignId") || "";
    setCampaignId(storedCampaignId);
    dispatch(loadStartCampaign(storedCampaignId));
  }, [dispatch]);

  const checkError = () => {
    setError({
      title:
        startCampaign?.basicInformation?.campaignTitle == ""
          ? "Please add a campaign Title"
          : "",
      duration:
        startCampaign?.basicInformation?.duration == ""
          ? "Please enter a duration for this campaign"
          : "",
      tagline:
        startCampaign?.basicInformation?.campaignTagline == ""
          ? "Please Enter a campaign tagline"
          : "",
      campaignImage:
        startCampaign?.basicInformation?.campaignImage == ""
          ? "Please add an image for this campaign"
          : "",
      locationCountry:
        startCampaign?.basicInformation?.locationCountry == ""
          ? "Please Enter a country for this campaign"
          : "",
      locationState:
        startCampaign?.basicInformation?.locationState == ""
          ? "Please enter a state/city for this campaign"
          : "",
    });
  };

  const setErrorandRemoveError = useCallback(() => {
    setCampError(true);
    setTimeout(() => {
      dispatch(setShowCampaignError(false));
    }, 1500);
  }, [dispatch]);

  useEffect(() => {
    showCampaignError && setErrorandRemoveError();
  }, [showCampaignError, setErrorandRemoveError]);

  const finalSubmit = async () => {
    try {
      // checkError();
      // if (
      //   startCampaign?.basicInformation?.location &&
      //   startCampaign?.basicInformation?.campaignImage &&
      //   startCampaign?.basicInformation?.campaignTagline &&
      //   startCampaign?.basicInformation?.duration &&
      //   startCampaign?.basicInformation?.campaignTitle
      //     ? true
      //     : false
      // ) {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/startCampaign/basicInformation",
        { basicInformation: startCampaign?.basicInformation, id: campaignId },
        { withCredentials: true }
      );

      res && router.push("/StartACampaign/Content");
      //  } else {
      //   dispatch(toast(true, "Please Fill in all fields", "error"));
      // }
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };

  return (
    <StartLayout active={1} page={"BASIC INFORMATION"}>
      <div className="mb-5">
        <h2 className="text-heading mb-4">Basic Information</h2>
        <p className="mb-4">
          The Basic information condense your campaign goals and description
          into a campaign card that’s shared with thousands of donors across our
          platform. Write a strong statement for donors to learn more.
        </p>
      </div>
      <div className="mb-5" style={{ position: "relative" }}>
        <h2 className="text-medium mb-4">Campaign Title</h2>
        <p className="mb-4">What is the title of this campaign?</p>
        <input
          type="text"
          style={{
            border:
              campError && !startCampaign?.basicInformation?.campaignTitle
                ? "1px solid red"
                : "",
          }}
          value={startCampaign?.basicInformation?.campaignTitle}
          onChange={(e) =>
            dispatch(
              startCampaignActions.setBasicInfo({
                campaignTitle: e.target.value,
              })
            )
          }
        />
        <p
          style={{ position: "absolute", top: "105%" }}
          className="text-danger"
        >
          {error.title}
        </p>
      </div>
      <div className="mb-5" style={{ position: "relative" }}>
        <h2 className="text-medium mb-4">Campaign Tagline</h2>
        <p className="mb-4">
          Provide a short description of the campaign - Highlight the benefits,
          how the funds be used.
        </p>
        <input
          type="text"
          style={{
            border:
              campError && !startCampaign?.basicInformation?.campaignTagline
                ? "1px solid red"
                : "",
          }}
          value={startCampaign?.basicInformation?.campaignTagline}
          onChange={(e) =>
            dispatch(
              startCampaignActions.setBasicInfo({
                campaignTagline: e.target.value,
              })
            )
          }
        />
        <p
          style={{ position: "absolute", top: "105%" }}
          className="text-danger"
        >
          {error.tagline}
        </p>
      </div>
      <div className="mb-5" style={{ position: "relative" }}>
        <h2 className="text-medium mb-4">Campaign Card Image</h2>
        <p className="mb-4">
          Upload an high-quality image that represents your campaign. This is
          what donors will see at first glance
        </p>
        {startCampaign?.basicInformation?.campaignImage == "" && !selectedFile && (
          <div
            className="file d-flex align-items-center justify-content-center"
            style={{
              border:
                campError && !startCampaign?.basicInformation?.campaignImage
                  ? "1px solid red"
                  : "",
            }}
          >
            <label
              className="d-flex flex-column align-items-center"
              style={{ cursor: "pointer" }}
              htmlFor="pic"
            >
              <img
                src="/images/icons/uploadImage.svg"
                alt="fundandtraceLogo"
                width={32}
                height={32}
                className="mb-2"
              />
              <p className="text-blue mb-0">Upload Image</p>
              <input
                type="file"
                accept="image/*"
                className="d-none"
                name="pic"
                id="pic"
                onChange={handleSelect}
              />
            </label>
          </div>
        )}
        <div className="d-flex align-items-md-center flex-column flex-md-row">
          <div
            className="file mt-3"
            style={{
              height: "auto",
              border: "none",
              borderRadius: "none",
              background: "transparent",
            }}
          >
            {loading && <p className="text-blue">Uploading...</p>}

            {startCampaign?.basicInformation?.campaignImage != "" &&
            !selectedFile ? (
              <img
                src={startCampaign?.basicInformation?.campaignImage}
                alt="image"
                style={{ width: "100%", objectFit: "cover", maxHeight: 200 }}
              />
            ) : (
              selectedFile && (
                <img
                  src={selectedFile}
                  alt="image"
                  style={{ width: "100%", objectFit: "cover", maxHeight: 200 }}
                />
              )
            )}
          </div>
          {startCampaign?.basicInformation?.campaignImage != "" && (
            <div className="ml-0 ml-md-4 mt-4 mt-md-0">
              <div
                role="button"
                className="d-flex align-items-center"
                onClick={() => {
                  dispatch(
                    startCampaignActions.setBasicInfo({
                      campaignImage: "",
                    })
                  );
                  setSelectedFile("");
                }}
              >
                <img
                  src="/images/icons/deleteIcon.svg"
                  alt="delete"
                  width={20}
                  height={20}
                />
                <p className="text-small text-danger mb-0 ml-3">Delete</p>
              </div>
              <label className="d-flex align-items-center mt-3" htmlFor="pic">
                <img
                  src="/images/icons/uploadImage.svg"
                  alt="fundandtraceLogo"
                  width={20}
                  height={20}
                  className=""
                />
                <p className="text-small text-blue mb-0 ml-3">Upload Image</p>
                <input
                  type="file"
                  accept="image/*"
                  className="d-none"
                  name="pic"
                  id="pic"
                  onChange={handleSelect}
                />
              </label>
            </div>
          )}
        </div>
        <p
          style={{ position: "absolute", top: "105%" }}
          className="text-danger"
        >
          {error.campaignImage}
        </p>
      </div>
      {/* <div className="mb-5" style={{ position: "relative" }}>
        <h2 className="text-medium mb-4">Location</h2>
        <p className="mb-4">Where is the campaign going to run?</p>
        <input
          type="text"
          placeholder="Lagos, Nigeria"
          style={{
            border:
              campError && !startCampaign?.basicInformation?.location
                ? "1px solid red"
                : "",
          }}
          value={startCampaign?.basicInformation?.location}
          onChange={(e) =>
            dispatch(
              startCampaignActions.setBasicInfo({
                location: e.target.value,
              })
            )
          }
        />
        <p
          style={{ position: "absolute", top: "105%" }}
          className="text-danger"
        >
          {error.location}
        </p>
      </div> */}
      <h2 className="text-medium mb-4">Location</h2>
      <p className="mb-4">
        Choose the location where you are running the campaign. This location
        will be visible on your campaign page for your audience to see.
      </p>
      <div className="d-flex flex-wrap justify-content-between mb-5 w-100">
        <Select className="d-flex align-items-center justify-content-between name mb-4 mb-md-0">
          <button
            onClick={() => setShowCountries(!showCountries)}
            className="w-100 d-flex align-items-center justify-content-between px-3"
            style={{
              border: "none",
              minWidth: "100%",
              borderStyle: "none",
              boxShadow: "none",
              outline: "none",
              background: "white",
              height: "48px",
              padding: 0,
            }}
          >
            <p
              className="mb-0 value"
              style={{
                fontWeight: !startCampaign?.basicInformation?.locationCountry
                  ? 300
                  : "",
                opacity: !startCampaign?.basicInformation?.locationCountry
                  ? 0.9
                  : 1,
                fontSize: !startCampaign?.basicInformation?.locationCountry
                  ? 14
                  : 16,
              }}
            >
              {startCampaign?.basicInformation?.locationCountry
                ? startCampaign?.basicInformation?.locationCountry
                : "Country"}
            </p>
            <img
              src="/images/icons/dropdown.svg"
              width={13}
              height={8}
              className="pt-0 ml-2"
             alt="" />
          </button>

          {showCountries && (
            <div
              onClick={() => setShowCountries(false)}
              className="overlay"
            ></div>
          )}
          {showCountries && (
            <div className="dropdown bg-white">
              <input
                type="search"
                autoFocus={true}
                placeholder="Search"
                autoComplete="new-password"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                style={{
                  position: "sticky",
                  top: 0,
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "#E5E5E5",
                  zIndex: 1000,
                }}
                className="py-1 px-2"
              />
              <p
                className="options py-3 mb-0 px-2"
                onClick={() => {
                  setShowCountries(false);
                  dispatch(
                    startCampaignActions.setBasicInfo({
                      locationCountry: "",
                    })
                  );
                  setStates([]);
                }}
                role="button"
              >
                Country
              </p>
              {countries.map((country, i) => (
                <p
                  className="options mb-0 px-2 py-3"
                  key={i}
                  onClick={() => {
                    dispatch(
                      startCampaignActions.setBasicInfo({
                        locationCountry: country.name,
                      })
                    );
                    setShowCountries(false);
                    dispatch(
                      startCampaignActions.setBasicInfo({
                        locationState: "",
                      })
                    );
                  }}
                  role="button"
                >
                  {country?.name}
                </p>
              ))}
            </div>
          )}
        </Select>

        <Select className="d-flex align-items-center justify-content-between name">
          <button
            className="d-flex align-items-center justify-content-between px-3"
            onClick={() => setShowStates(!showStates)}
            style={{
              border: "none",
              minWidth: "100%",
              borderStyle: "none",
              boxShadow: "none",
              outline: "none",
              background: "white",
              height: "48px",
              padding: 0,
            }}
          >
            <p
              className="mb-0 value"
              style={{
                fontWeight: !startCampaign?.basicInformation?.locationState
                  ? 300
                  : "",
                opacity: !startCampaign?.basicInformation?.locationState
                  ? 0.9
                  : 1,
                fontSize: !startCampaign?.basicInformation?.locationState
                  ? 14
                  : 16,
              }}
            >
              {startCampaign?.basicInformation?.locationState
                ? startCampaign?.basicInformation?.locationState
                : "State/City"}
            </p>
            <img
              src="/images/icons/dropdown.svg"
              width={13}
              height={8}
              className="pt-0 ml-2"
             alt="" />
          </button>

          {showStates && (
            <div onClick={() => setShowStates(false)} className="overlay"></div>
          )}
          {showStates && (
            <div className="dropdown bg-white">
              <input
                type="search"
                autoFocus={true}
                placeholder="Search"
                autoComplete="new-password"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{
                  position: "sticky",
                  top: 0,
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "#E5E5E5",
                  zIndex: 1000,
                }}
                className="py-1 px-2"
              />
              <p
                className="options py-3 mb-0 px-2"
                onClick={() => {
                  setShowStates(false);
                  dispatch(
                    startCampaignActions.setBasicInfo({
                      locationState: "",
                    })
                  );
                }}
                role="button"
              >
                State/City
              </p>
              {states.map((state, i) => (
                <p
                  className="options py-3 mb-0 px-2"
                  key={i}
                  onClick={() => {
                    dispatch(
                      startCampaignActions.setBasicInfo({
                        locationState: state?.name,
                      })
                    );
                    setShowStates(false);
                  }}
                  role="button"
                >
                  {state?.name}
                </p>
              ))}
            </div>
          )}
        </Select>
      </div>
      <div className="mb-5" style={{ position: "relative" }}>
        <h2 className="text-medium mb-4">Duration</h2>
        <p className="mb-4">
          How many days do you want your campaign to run for?
        </p>
        <input
          type="number"
          min="10"
          value={startCampaign?.basicInformation?.duration}
          onChange={(e) =>
            dispatch(
              startCampaignActions.setBasicInfo({
                duration: e.target.value,
              })
            )
          }
        />
        <p
          style={{ position: "absolute", top: "105%" }}
          className="text-danger"
        >
          {error.duration}
        </p>
      </div>

      <button className="btn text-white mobileBtn-full" onClick={finalSubmit}>
        Save and Continue
      </button>
      <CategoryModal
        showModal={showModal}
        onModalClose={() => setShowModal(false)}
        type={type}
        category={category}
      />
    </StartLayout>
  );
}

const Select = styled.div`
width: 48%;
box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1), 0 4px 10px 0px rgba(0, 0, 0, 0.04), 0 7px 8px -5px rgba(255, 255, 255, 0.2);
@media screen and (max-width: 767px) {
  width: 100%
}
  position: relative;
  .value{
    overflow: hidden;
    whitespace: nowrap;
    max-height: 100%;

  }
  .options{
    @media screen and (max-width: 767px) {
      border-top: 1px solid #E5E5E5
    }
    background: transparent;
    &:hover {
      background: #E5E5E5;
    }
  }
  .dropdown{
    position: absolute;
    top: 110%;
     box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
    2px 10px 24px rgba(50, 50, 71, 0.05);
    z-index: 10000000000;
    cursor: pointer;
    width: max-content;
    max-height: 300px;
    overflow-y: scroll;
    left: -2px;
    @media screen and (max-width: 767px) {
      position: fixed;
      top: 50%;
      left: 50%;
      width: 90%;
      border-radius: 4px;
      max-width: 430px;
      max-height: 400px;
      transform: translate(-50%, -50%)
    }
  }
  .overlay{
    width: 100vw;
    height:100vh;
    position:fixed;
    z-index 1000000;
    left: 0;
    top: 0;
    @media screen and (max-width: 767px) {
      background: rgba(0,0,0,0.5)
    }
  }
`;
