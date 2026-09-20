import React, { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import StartLayout from "./StartLayout";
import Link from "next/link";
// import ImageUploader from "react-images-upload";
import { useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  loadStartCampaign,
  selectStartCampaignState,
  startCampaignActions,
} from "../../../store/slices/startCampaignSlice";
import axios from "axios";
import { cloudinaryUploadUrl } from "../../utils/cloudinary";
import { toast } from "../../../store/slices/ToastSlice";
import { useAppDispatch } from "./../../../store/hooks";
import {
  getAllCountries,
  getCountries,
  getStates,
  handleCountrySearchFunction,
  handlePhoneSearchFunction,
  handleStateSearchFunction,
} from "../../components/helperFunctions/locationFunctions";

interface CountryOption {
  name: string;
  phone_code: string;
  href: { flag: string };
  states: string[];
}

interface StateOption {
  name: string;
}

export default function Team() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  useEffect(() => {
    const storedCampaignId = localStorage.getItem("campaignId") || "";
    setCampaignId(storedCampaignId);
    dispatch(loadStartCampaign(storedCampaignId));
  }, [dispatch]);

  const [picture, setPicture] = useState<File[]>([]);
  const { startCampaign } = useSelector(selectStartCampaignState);
  const [first, setFirst] = useState(true);
  const [second, setSecond] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [states, setStates] = useState<StateOption[]>([]);
  const [allStates, setAllStates] = useState<StateOption[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [allCountries, setAllCountries] = useState<CountryOption[]>([]);
  const [showCountries, setShowCountries] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const [states2, setStates2] = useState<StateOption[]>([]);
  const [allStates2, setAllStates2] = useState<StateOption[]>([]);
  const [countries2, setCountries2] = useState<CountryOption[]>([]);
  const [showCountries2, setShowCountries2] = useState(false);
  const [showStates2, setShowStates2] = useState(false);
  const [selectedCountry2, setSelectedCountry2] = useState("");
  const [selectedState2, setSelectedState2] = useState("");
  const [flag, setFlag] = useState("");
  const [flag2, setFlag2] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [showPhone2, setShowPhone2] = useState(false);
  const [selectedPhone2, setSelectedPhone2] = useState("");
  const [phones, setPhones] = useState<CountryOption[]>([]);
  const [phones2, setPhones2] = useState<CountryOption[]>([]);

  const getAllCountriesFromFunction = useCallback(async () => {
    const countries = await getAllCountries();
    setAllCountries(countries);
    setCountries(countries);
    setCountries2(countries);
    setPhones(countries);
    setPhones2(countries);
  }, []);

  const getAllStatesFromFunction = useCallback(async () => {
    const states = await getStates(
      startCampaign?.team?.primaryContact?.country
    );
    setStates(states);
    setAllStates(states);
  }, [startCampaign?.team?.primaryContact?.country]);

  const getAllStatesFromFunction2 = useCallback(async () => {
    const states = await getStates(startCampaign?.team?.secondContact?.country);
    setStates2(states);
    setAllStates2(states);
  }, [startCampaign?.team?.secondContact?.country]);

  useEffect(() => {
    getAllCountriesFromFunction();
  }, [getAllCountriesFromFunction]);

  const handleCountrySearch = useCallback(() => {
    setCountries(handleCountrySearchFunction(allCountries, selectedCountry));
  }, [allCountries, selectedCountry]);

  const handleCountrySearch2 = useCallback(() => {
    setCountries2(handleCountrySearchFunction(allCountries, selectedCountry2));
  }, [allCountries, selectedCountry2]);

  const handlePhoneSearch = useCallback(() => {
    setPhones(handlePhoneSearchFunction(allCountries, selectedPhone));
  }, [allCountries, selectedPhone]);

  const handlePhoneSearch2 = useCallback(() => {
    setPhones2(handlePhoneSearchFunction(allCountries, selectedPhone2));
  }, [allCountries, selectedPhone2]);

  const handleStateSearch = useCallback(() => {
    setStates(handleStateSearchFunction(allStates, selectedState));
  }, [allStates, selectedState]);

  const handleStateSearch2 = useCallback(() => {
    setStates(handleStateSearchFunction(allStates2, selectedState2));
  }, [allStates2, selectedState2]);

  useEffect(() => {
    handlePhoneSearch();
  }, [handlePhoneSearch]);

  useEffect(() => {
    handlePhoneSearch2();
  }, [handlePhoneSearch2]);

  useEffect(() => {
    handleCountrySearch();
  }, [handleCountrySearch]);

  useEffect(() => {
    handleCountrySearch2();
  }, [handleCountrySearch2]);

  useEffect(() => {
    handleStateSearch();
  }, [handleStateSearch]);

  useEffect(() => {
    handleStateSearch2();
  }, [handleStateSearch2]);

  useEffect(() => {
    startCampaign?.team?.primaryContact?.country && getAllStatesFromFunction();
  }, [startCampaign?.team?.primaryContact?.country, getAllStatesFromFunction]);

  useEffect(() => {
    startCampaign?.team?.secondContact?.country && getAllStatesFromFunction2();
  }, [startCampaign?.team?.secondContact?.country, getAllStatesFromFunction2]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      const file = e.target.files![0];
      const formData = new FormData();
      formData.append("upload_preset", "campaignImage");
      formData.append("file", file);
      const url = await axios.post<{ secure_url: string }>(
        cloudinaryUploadUrl(),
        formData
      );
      setLoading(false);

      dispatch(
        startCampaignActions.setPrimaryContact({
          idImage: url.data.secure_url,
        })
      );

      previewFile(file);
    } catch (error) {
    }
  };

  const previewFile = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setSelectedFile(reader.result as string);
    };
  };

  // const check = () => {
  //   for (let key in startCampaign?.team?.primaryContact) {
  //     if (startCampaign?.team?.primaryContact[key] == "") {
  //       return false;
  //     }
  //   }
  //   return true;
  // };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/startCampaign/team",
        { team: startCampaign?.team, id: campaignId },
        { withCredentials: true }
      );

      res && router.push("/StartACampaign/Funding");
    } catch (error) {
      dispatch(toast(true, "Server Error", "error"));
    }
  };

  return (
    <StartLayout active={3} page={"CONTACT"}>
      <Wrapper>
        <div className="mb-5">
          <h2 className="text-heading mb-4">Contact</h2>
          <p className="mb-4">
            Provide information about you and other parties involve in the
            campaign. We will require some information to verify your identity.{" "}
            <strong>
              The information shared will not be displayed publicly.
            </strong>
          </p>
        </div>
        <div className="mb-5">
          <h2 className="text-medium mb-4">Primary Contact</h2>
          <div
            className="d-flex justify-content-between align-items-baseline mb-4"
            style={{
              borderBottom: first
                ? "0.5px solid var(--color-primary)"
                : "0.5px solid #B3B3B3",
              cursor: "pointer",
            }}
            onClick={() => setFirst(!first)}
            role="button"
          >
            <p className="mb-4">
              Please provide the primary contact of the campaign. This person
              will be the main point of contact to answer questions or queries
              regarding the campaign.
            </p>
            <img
              src={
                !first
                  ? "/images/icons/dropdown.svg"
                  : "/images/icons/blueup.svg"
              }
              width={13}
              height={8}
              className="pt-0 ml-4"
              alt="dropdown"
            />
          </div>

          <div className="drops" style={{ display: first ? "block" : "none" }}>
            <div className="d-flex mb-md-5 justify-content-between flex-column flex-md-row">
              <div className="detailsRow d-flex flex-column ">
                <h2 className="text-medium mb-4">First Name</h2>
                <input
                  type="text"
                  value={startCampaign?.team?.primaryContact?.firstName}
                  onChange={(e) =>
                    dispatch(
                      startCampaignActions.setPrimaryContact({
                        firstName: e.target.value,
                      })
                    )
                  }
                />
              </div>
              <div className="detailsRow d-flex flex-column ">
                <h2 className="text-medium mb-4">Last Name</h2>
                <input
                  type="text"
                  value={startCampaign?.team?.primaryContact?.lastName}
                  onChange={(e) =>
                    dispatch(
                      startCampaignActions.setPrimaryContact({
                        lastName: e.target.value,
                      })
                    )
                  }
                />
              </div>
            </div>
            <div className="d-flex mb-md-5 justify-content-between flex-column flex-md-row">
              <div className="detailsRow d-flex flex-column ">
                <h2 className="text-medium mb-4">Date of Birth</h2>
                <input
                  type="date"
                  name=""
                  id=""
                  value={startCampaign?.team?.primaryContact?.dateOfBirth}
                  onChange={(e) =>
                    dispatch(
                      startCampaignActions.setPrimaryContact({
                        dateOfBirth: e.target.value,
                      })
                    )
                  }
                />
              </div>
              <div className="detailsRow d-flex flex-column ">
                <h2 className="text-medium mb-4">Email</h2>
                <input
                  type="email"
                  value={startCampaign?.team?.primaryContact?.email}
                  onChange={(e) =>
                    dispatch(
                      startCampaignActions.setPrimaryContact({
                        email: e.target.value,
                      })
                    )
                  }
                />
              </div>
            </div>
            <div className="d-flex flex-wrap justify-content-between mb-5 w-100">
              <div className="detailsRow d-flex flex-column">
                <h2 className="text-medium mb-4">Country</h2>
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
                        fontWeight: !startCampaign?.team?.primaryContact
                          ?.country
                          ? 300
                          : "",
                        opacity: !startCampaign?.team?.primaryContact?.country
                          ? 0.9
                          : 1,
                        fontSize: !startCampaign?.team?.primaryContact?.country
                          ? 14
                          : 16,
                      }}
                    >
                      {startCampaign?.team?.primaryContact?.country
                        ? startCampaign?.team?.primaryContact?.country
                        : "Country"}
                    </p>
                    <img
                      src="/images/icons/dropdown.svg"
                      width={13}
                      height={8}
                      className="pt-0 ml-2"
                      alt="dropdown"
                    />
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
                        }}
                        className="py-1 px-2"
                      />
                      <p
                        className="options py-3 mb-0 px-2"
                        onClick={() => {
                          setShowCountries(false);
                          dispatch(
                            startCampaignActions.setPrimaryContact({
                              country: "",
                            })
                          );
                          setStates([]);
                        }}
                        role="button"
                      >
                        Country
                      </p>
                      {countries?.map((country, i) => (
                        <p
                          className="options mb-0 px-2 py-3"
                          key={i}
                          onClick={() => {
                            dispatch(
                              startCampaignActions.setPrimaryContact({
                                country: country?.name,
                              })
                            );
                            setShowCountries(false);
                            dispatch(
                              startCampaignActions?.setPrimaryContact({
                                state: "",
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
              </div>

              <div className="detailsRow d-flex flex-column">
                <h2 className="text-medium mb-4">State</h2>
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
                        fontWeight: !startCampaign?.team?.primaryContact?.state
                          ? 300
                          : "",
                        opacity: !startCampaign?.team?.primaryContact?.state
                          ? 0.9
                          : 1,
                        fontSize: !startCampaign?.team?.primaryContact?.state
                          ? 14
                          : 16,
                      }}
                    >
                      {startCampaign?.team?.primaryContact?.state
                        ? startCampaign?.team?.primaryContact?.state
                        : "State/City"}
                    </p>
                    <img
                      src="/images/icons/dropdown.svg"
                      width={13}
                      height={8}
                      className="pt-0 ml-2"
                      alt="dropdown"
                    />
                  </button>

                  {showStates && (
                    <div
                      onClick={() => setShowStates(false)}
                      className="overlay"
                    ></div>
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
                        }}
                        className="py-1 px-2"
                      />
                      <p
                        className="options py-3 mb-0 px-2"
                        onClick={() => {
                          setShowStates(false);
                          dispatch(
                            startCampaignActions.setPrimaryContact({
                              state: "",
                            })
                          );
                        }}
                        role="button"
                      >
                        State/City
                      </p>
                      {states?.map((state, i) => (
                        <p
                          className="options py-3 mb-0 px-2"
                          key={i}
                          onClick={() => {
                            dispatch(
                              startCampaignActions.setPrimaryContact({
                                state: state?.name,
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
            </div>
            <div className="d-flex mb-md-5 justify-content-between flex-column flex-md-row">
              <div className="d-flex flex-column detailsRow">
                <h2 className="text-medium mb-4">Phone Number</h2>
                <div
                  style={{ position: "relative", paddingRight: 0 }}
                  className="w-100 d-flex align-items-center mb-4 name"
                >
                  <Select
                    className="d-flex align-items-center"
                    style={{
                      background: "white",
                      position: "static",
                      width: "max-content",
                      paddingRight: 10,
                      height: "48px",
                      top: "0",
                      paddingLeft: 10,
                      borderRight: "0.5px solid #c4c4c4",
                    }}
                  >
                    <button
                      onClick={() => setShowPhone(!showPhone)}
                      className="d-flex align-items-center"
                      style={{
                        border: "none",
                        minWidth: "100%",
                        borderStyle: "none",
                        boxShadow: "none",
                        outline: "none",
                        background: "white",
                        height: "48px",
                        padding: 0,
                        width: "max-content",
                      }}
                    >
                      <div
                        className="d-flex align-items-center value"
                        style={{
                          fontWeight: !startCampaign?.team?.primaryContact
                            ?.phoneCode
                            ? 300
                            : "",
                          opacity: !startCampaign?.team?.primaryContact
                            ?.phoneCode
                            ? 0.9
                            : 1,
                          fontSize: !startCampaign?.team?.primaryContact
                            ?.phoneCode
                            ? 14
                            : 16,
                        }}
                      >
                        {flag && (
                          <img src={flag} alt="" width={15} className="mr-2" />
                        )}
                        <p className="mb-0 ">
                          {startCampaign?.team?.primaryContact?.phoneCode
                            ? startCampaign?.team?.primaryContact?.phoneCode
                            : "Phone"}
                        </p>
                      </div>
                      <img
                        src="/images/icons/dropdown.svg"
                        width={13}
                        height={8}
                        className="pt-0 ml-2"
                        alt="dropdown"
                      />
                    </button>
                    {showPhone && (
                      <div
                        onClick={() => setShowPhone(false)}
                        className="overlay"
                      ></div>
                    )}
                    {showPhone && (
                      <>
                        <div className="dropdown bg-white">
                          <input
                            type="search"
                            autoFocus={true}
                            placeholder="Search by country"
                            autoComplete="new-password"
                            value={selectedPhone}
                            onChange={(e) => {
                              setSelectedPhone(e.target.value);
                            }}
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
                              setShowPhone(false);
                              dispatch(
                                startCampaignActions.setPrimaryContact({
                                  phoneCode: "",
                                })
                              );
                              setFlag("");
                            }}
                            role="button"
                          >
                            Phone
                          </p>
                          {phones?.map((phone, i) => (
                            <div
                              className="options py-3 mb-0 px-2 d-flex align-items-center"
                              key={i}
                              onClick={() => {
                                dispatch(
                                  startCampaignActions.setPrimaryContact({
                                    phoneCode: phone?.phone_code,
                                  })
                                );

                                setShowPhone(false);
                                setFlag(phone?.href?.flag);
                              }}
                              role="button"
                            >
                              <img src={phone?.href.flag} alt="" width={15} />
                              <p className="ml-2 mb-0">{phone?.phone_code}</p>
                              <p className="ml-2 mb-0">{phone?.name}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </Select>
                  <input
                    type="phone"
                    name="phone"
                    id="phone"
                    maxLength={10}
                    value={startCampaign?.team?.primaryContact?.phoneNumber}
                    placeholder="Phone"
                    className="email"
                    style={{ border: 0, height: "48px", outline: "none" }}
                    onChange={(e) =>
                      dispatch(
                        startCampaignActions.setPrimaryContact({
                          phoneNumber: e.target.value,
                        })
                      )
                    }
                  />
                </div>
              </div>

              <div className="detailsRow d-flex flex-column">
                <h2 className="text-medium mb-4">Street Address</h2>

                <input
                  type="text"
                  value={startCampaign?.team?.primaryContact?.streetAddress}
                  onChange={(e) =>
                    dispatch(
                      startCampaignActions.setPrimaryContact({
                        streetAddress: e.target.value,
                      })
                    )
                  }
                />
              </div>
            </div>

            <div className="mb-5">
              <h2 className="text-medium mb-4">I.D Verification</h2>
              <p className="mb-4">
                Please provide a means of identification (National I.D.,
                Driver’s License, etc) for verification
              </p>
              {startCampaign?.team?.primaryContact?.idImage == "" &&
                !selectedFile && (
                  <div className="file d-flex align-items-center justify-content-center">
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
                        className="d-none"
                        name="pic"
                        accept="image/*"
                        id="pic"
                        onChange={handleSelect}
                      />
                    </label>
                  </div>
                )}

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

                {startCampaign?.team?.primaryContact?.idImage != "" &&
                !selectedFile ? (
                  <img
                    src={startCampaign?.team?.primaryContact?.idImage}
                    alt="image"
                    style={{ width: "100%", objectFit: "cover" }}
                  />
                ) : (
                  selectedFile && (
                    <img
                      src={selectedFile}
                      alt="image"
                      style={{ width: "100%", objectFit: "cover" }}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="text-medium mb-4">Secondary Contact</h2>
          <div
            className="d-flex justify-content-between align-items-baseline mb-4"
            style={{
              borderBottom: second
                ? "0.5px solid var(--color-primary)"
                : "0.5px solid #B3B3B3",
              cursor: "pointer",
            }}
            onClick={() => setSecond(!second)}
            role="button"
          >
            <p className="mb-4">
              The secondary contact is required if the primary contact not
              available.
            </p>
            <img
              src={
                !second
                  ? "/images/icons/dropdown.svg"
                  : "/images/icons/blueup.svg"
              }
              width={13}
              height={8}
              className="pt-0 ml-4"
             alt="" />
          </div>

          <div className="drops" style={{ display: second ? "block" : "none" }}>
            <div className="d-flex mb-md-5 justify-content-between flex-column flex-md-row">
              <div className="detailsRow d-flex flex-column ">
                <h2 className="text-medium mb-4">First Name</h2>
                <input
                  type="text"
                  value={startCampaign?.team?.secondContact?.firstName}
                  onChange={(e) =>
                    dispatch(
                      startCampaignActions.setSecondContact({
                        firstName: e.target.value,
                      })
                    )
                  }
                />
              </div>
              <div className="d-flex flex-column detailsRow">
                <h2 className="text-medium mb-4">Last Name</h2>
                <input
                  type="text"
                  value={startCampaign?.team?.secondContact?.lastName}
                  onChange={(e) =>
                    dispatch(
                      startCampaignActions.setSecondContact({
                        lastName: e.target.value,
                      })
                    )
                  }
                />
              </div>
            </div>
            <div className="d-flex mb-md-5 justify-content-between flex-column flex-md-row">
              <div className="d-flex flex-column detailsRow">
                <h2 className="text-medium mb-4">Date of Birth</h2>
                <input
                  type="date"
                  name=""
                  id=""
                  value={startCampaign?.team?.secondContact?.dateOfBirth}
                  onChange={(e) =>
                    dispatch(
                      startCampaignActions.setSecondContact({
                        dateOfBirth: e.target.value,
                      })
                    )
                  }
                />
              </div>
              <div className="detailsRow d-flex flex-column ">
                <h2 className="text-medium mb-4">Email</h2>
                <input
                  type="email"
                  value={startCampaign?.team?.secondContact?.email}
                  onChange={(e) =>
                    dispatch(
                      startCampaignActions.setSecondContact({
                        email: e.target.value,
                      })
                    )
                  }
                />
              </div>
            </div>

            <div className="d-flex flex-wrap justify-content-between mb-5 w-100">
              <div className="detailsRow d-flex flex-column">
                <h2 className="text-medium mb-4">Country</h2>
                <Select className="d-flex align-items-center justify-content-between name mb-4 mb-md-0">
                  <button
                    onClick={() => setShowCountries2(!showCountries2)}
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
                        fontWeight: !startCampaign?.team?.secondContact?.country
                          ? 300
                          : "",
                        opacity: !startCampaign?.team?.secondContact?.country
                          ? 0.9
                          : 1,
                        fontSize: !startCampaign?.team?.secondContact?.country
                          ? 14
                          : 16,
                      }}
                    >
                      {startCampaign?.team?.secondContact?.country
                        ? startCampaign?.team?.secondContact?.country
                        : "Country"}
                    </p>
                    <img
                      src="/images/icons/dropdown.svg"
                      width={13}
                      height={8}
                      className="pt-0 ml-2"
                      alt="dropdown"
                    />
                  </button>

                  {showCountries2 && (
                    <div
                      onClick={() => setShowCountries2(false)}
                      className="overlay"
                    ></div>
                  )}
                  {showCountries2 && (
                    <div className="dropdown bg-white">
                      <input
                        type="search"
                        autoFocus={true}
                        placeholder="Search"
                        autoComplete="new-password"
                        value={selectedCountry2}
                        onChange={(e) => setSelectedCountry2(e.target.value)}
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
                          setShowCountries2(false);
                          dispatch(
                            startCampaignActions.setSecondContact({
                              country: "",
                            })
                          );
                          setStates2([]);
                        }}
                        role="button"
                      >
                        Country
                      </p>
                      {countries2.map((country, i) => (
                        <p
                          className="options mb-0 px-2 py-3"
                          key={i}
                          onClick={() => {
                            dispatch(
                              startCampaignActions.setSecondContact({
                                country: country?.name,
                              })
                            );
                            setShowCountries2(false);
                            dispatch(
                              startCampaignActions.setSecondContact({
                                state: "",
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
              </div>

              <div className="detailsRow d-flex flex-column">
                <h2 className="text-medium mb-4">State</h2>
                <Select className="d-flex align-items-center justify-content-between name">
                  <button
                    className="d-flex align-items-center justify-content-between px-3"
                    onClick={() => setShowStates2(!showStates2)}
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
                        fontWeight: !startCampaign?.team?.secondContact?.state
                          ? 300
                          : "",
                        opacity: !startCampaign?.team?.secondContact?.state
                          ? 0.9
                          : 1,
                        fontSize: !startCampaign?.team?.secondContact?.state
                          ? 14
                          : 16,
                      }}
                    >
                      {startCampaign?.team?.secondContact?.state
                        ? startCampaign?.team?.secondContact?.state
                        : "State/City"}
                    </p>
                    <img
                      src="/images/icons/dropdown.svg"
                      width={13}
                      height={8}
                      className="pt-0 ml-2"
                      alt="dropdown"
                    />
                  </button>

                  {showStates2 && (
                    <div
                      onClick={() => setShowStates2(false)}
                      className="overlay"
                    ></div>
                  )}
                  {showStates2 && (
                    <div className="dropdown bg-white">
                      <input
                        type="search"
                        autoFocus={true}
                        placeholder="Search"
                        autoComplete="new-password"
                        value={selectedState2}
                        onChange={(e) => setSelectedState2(e.target.value)}
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
                          setShowStates2(false);
                          dispatch(
                            startCampaignActions.setSecondContact({
                              state: "",
                            })
                          );
                        }}
                        role="button"
                      >
                        State/City
                      </p>
                      {states2.map((state, i) => (
                        <p
                          className="options py-3 mb-0 px-2"
                          key={i}
                          onClick={() => {
                            dispatch(
                              startCampaignActions.setSecondContact({
                                state: state?.name,
                              })
                            );
                            setShowStates2(false);
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
            </div>

            <div className="d-flex mb-md-5 justify-content-between flex-column flex-md-row">
              <div className="detailsRow d-flex flex-column">
                <h2 className="text-medium mb-4">Phone Number</h2>
                <div
                  style={{ position: "relative", paddingRight: 0 }}
                  className="w-100 d-flex align-items-center mb-4 name"
                >
                  <Select
                    className="d-flex align-items-center name"
                    style={{
                      background: "white",
                      position: "static",
                      width: "max-content",
                      paddingRight: 10,
                      height: "48px",
                      top: "0",
                      paddingLeft: 10,
                      borderRight: "0.5px solid #c4c4c4",
                    }}
                  >
                    <button
                      onClick={() => setShowPhone2(!showPhone2)}
                      className="d-flex align-items-center"
                      style={{
                        border: "none",
                        minWidth: "100%",
                        borderStyle: "none",
                        boxShadow: "none",
                        outline: "none",
                        background: "white",
                        height: "48px",
                        padding: 0,
                        width: "100%",
                      }}
                    >
                      <div
                        className="d-flex align-items-center value"
                        style={{
                          fontWeight: !startCampaign?.team?.secondContact
                            ?.phoneCode
                            ? 300
                            : "",
                          opacity: !startCampaign?.team?.secondContact
                            ?.phoneCode
                            ? 0.9
                            : 1,
                          fontSize: !startCampaign?.team?.secondContact
                            ?.phoneCode
                            ? 14
                            : 16,
                        }}
                      >
                        {flag2 && (
                          <img src={flag} alt="" width={15} className="mr-2" />
                        )}
                        <p className="mb-0 ">
                          {startCampaign?.team?.secondContact?.phoneCode
                            ? startCampaign?.team?.secondContact?.phoneCode
                            : "Phone"}
                        </p>
                      </div>
                      <img
                        src="/images/icons/dropdown.svg"
                        width={13}
                        height={8}
                        className="pt-0 ml-2"
                        alt="dropdown"
                      />
                    </button>
                    {showPhone2 && (
                      <div
                        onClick={() => setShowPhone2(false)}
                        className="overlay"
                      ></div>
                    )}
                    {showPhone2 && (
                      <>
                        <div className="dropdown bg-white">
                          <input
                            type="search"
                            autoFocus={true}
                            placeholder="Search by country"
                            autoComplete="new-password"
                            value={selectedPhone2}
                            onChange={(e) => {
                              setSelectedPhone2(e.target.value);
                            }}
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
                              setShowPhone2(false);
                              dispatch(
                                startCampaignActions.setSecondContact({
                                  phoneCode: "",
                                })
                              );
                              setFlag2("");
                            }}
                            role="button"
                          >
                            Phone
                          </p>
                          {phones2?.map((phone, i) => (
                            <div
                              className="options py-3 mb-0 px-2 d-flex align-items-center"
                              key={i}
                              onClick={() => {
                                dispatch(
                                  startCampaignActions.setSecondContact({
                                    phoneCode: phone?.phone_code,
                                  })
                                );

                                setShowPhone2(false);
                                setFlag2(phone?.href?.flag);
                              }}
                              role="button"
                            >
                              <img src={phone?.href.flag} alt="" width={15} />
                              <p className="ml-2 mb-0">{phone?.phone_code}</p>
                              <p className="ml-2 mb-0">{phone?.name}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </Select>
                  <input
                    type="phone"
                    name="phone"
                    id="phone"
                    maxLength={10}
                    value={startCampaign?.team?.secondContact?.phoneNumber}
                    placeholder="Phone"
                    className="email"
                    style={{ border: 0, height: "48px", outline: "none" }}
                    onChange={(e) =>
                      dispatch(
                        startCampaignActions.setSecondContact({
                          phoneNumber: e.target.value,
                        })
                      )
                    }
                  />
                </div>
              </div>

              <div className="detailsRow d-flex flex-column">
                <h2 className="text-medium mb-4">Street Address</h2>

                <input
                  type="text"
                  value={startCampaign?.team?.secondContact?.streetAddress}
                  onChange={(e) =>
                    dispatch(
                      startCampaignActions.setSecondContact({
                        streetAddress: e.target.value,
                      })
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <button
          className="btn text-white mobileBtn-full"
          onClick={handleSubmit}
        >
          Save and Continue
        </button>
      </Wrapper>
    </StartLayout>
  );
}

const Wrapper = styled.div`
  .detailsRow {
    width: 47%;
    @media screen and (max-width: 767px) {
      width: 100%;
      margin-bottom: 35px;
    }
  }
`;

const Select = styled.div`
width: 100%;
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
