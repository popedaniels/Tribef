import Link from "next/link";
import React, { useEffect, useCallback } from "react";
import styled from "styled-components";
import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { useSelector } from "react-redux";
import {
  selectSignUpState,
  setSignUpFailed,
  setSignUpSuccess,
  signUp,
} from "../../../store/slices/signUpSlice";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import { useRouter } from "next/router";
import Spinner from "../../components/composed/spinner/Spinner";
import { toast } from "../../../store/slices/ToastSlice";
import axios from "axios";
import TermsModal from "../../components/composed/Modal/DefaultModal/TermsModal";
import Layout from "../../components/Layout";
import { useAppDispatch } from "./../../../store/hooks";
import {
  getAllCountries as locationGetAllCountries,
  getStates as locationGetStates,
  getCountries as locationGetCountries,
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

export default function StepOne() {
  const [email, setEmail] = useState("");
  const [fName, setFName] = useState("");
  const [lName, setLName] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPassWordError, setConfirmPasswordError] = useState(false);
  const dispatch = useAppDispatch();
  const signUpState = useSelector(selectSignUpState);
  const { authenticated } = useSelector(selectAuthStateState);
  const router = useRouter();
  const [states, setStates] = useState<StateOption[]>([]);
  const [allStates, setAllStates] = useState<StateOption[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [allCountries, setAllCountries] = useState<CountryOption[]>([]);
  const [phones, setPhones] = useState<CountryOption[]>([]);
  const [subscription, setSubscription] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [agree, setAgree] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [showCountries, setShowCountries] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [flag, setFlag] = useState("");
  const [passwordBorderError, setPasswordBorderError] = useState(false);
  const [confirmPasswordBorderError, setConfirmPasswordBorderError] =
    useState(false);
  const [emailError, setEmailError] = useState(false);
  const [fNameError, setFNameError] = useState(false);
  const [lNameError, setLNameError] = useState(false);
  const [countryError, setCountryError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [cityError, setCityError] = useState(false);
  const [codeError, setCodeError] = useState(false);

  const checkForEmptyFields = () => {
    !email && setEmailError(true);
    !fName && setFNameError(true);
    !lName && setLNameError(true);
    !country && setCountryError(true);
    !phone && setPhoneError(true);
    !city && setCityError(true);
    !code && setCodeError(true);
    !password && setPasswordBorderError(true);
    !confirmPassword && setConfirmPasswordBorderError(true);
  };

  const handleSubmit = async () => {
    try {
      checkForEmptyFields();
      if (
        email &&
        fName &&
        country &&
        phone &&
        city &&
        password &&
        password.length >= 8 &&
        confirmPassword &&
        agree &&
        code
      ) {
        setConfirmPasswordError(false);
        const data = {
          email: email,
          password,
          phone: phone,
          firstName: fName,
          lastName: lName,
          country: country,
          city: city,
          code: code,
        };

        if (confirmPassword == password) {
          dispatch(signUp(data));
        } else {
          setConfirmPasswordError(true);
        }
      } else {
        dispatch(toast(true, "Please Fill in the mandatory fields", "error"));
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    if (signUpState.signUpSuccess) {
      router.push({
        pathname: "/SignUp/stepTwo",
        query: { email: email },
      });
      dispatch(setSignUpSuccess(false));
    }
  }, [signUpState.signUpSuccess, dispatch, email, router]);

  useEffect(() => {
    dispatch(setSignUpFailed({ status: false, error: "" }));
  }, [dispatch]);

  useEffect(() => {
    authenticated && router.push("/");
  }, [authenticated, router]);

  const getStates = useCallback(async () => {
    try {
      const data = await locationGetStates(country);
      setStates(data);
      setAllStates(data);
    } catch (err) {
    }
  }, [country]);

  const getCountries = async () => {
    try {
      const response = await locationGetCountries();
      if (response?.country_name) {
        setCountry(response.country_name);
        setCode("+" + response.calling_code);
        setFlag(response.flag);
      }
    } catch (error) {
    }
  };

  const getAllCountries = async () => {
    try {
      const data = await locationGetAllCountries();
      setAllCountries(data);
      setPhones(data);
      setCountries(data);
    } catch (error) {
    }
  };

  useEffect(() => {
    getAllCountries();
    getCountries();
  }, []);

  const handlePhoneSearch = useCallback(() => {
    setPhones(
      allCountries?.filter((phone) =>
        phone?.name?.toLowerCase().includes(selectedPhone?.toLowerCase())
      )
    );
  }, [allCountries, selectedPhone]);

  useEffect(() => {
    handlePhoneSearch();
  }, [selectedPhone, handlePhoneSearch]);

  const handleCountrySearch = useCallback(() => {
    setCountries(
      allCountries?.filter((country) =>
        country?.name?.toLowerCase().includes(selectedCountry?.toLowerCase())
      )
    );
  }, [allCountries, selectedCountry]);

  useEffect(() => {
    handleCountrySearch();
  }, [selectedCountry, handleCountrySearch]);

  const handleStateSearch = useCallback(() => {
    setStates(
      allStates?.filter((State) =>
        State?.name?.toLowerCase().includes(selectedState?.toLowerCase())
      )
    );
  }, [allStates, selectedState]);

  useEffect(() => {
    handleStateSearch();
  }, [selectedState, handleStateSearch]);

  useEffect(() => {
    country && getStates();
  }, [country, getStates]);

  return (
    <Layout
      title="Fund&Trace | Sign Up"
      description="Sign Up to Fund&Trace, The leading fundraising platform"
    >
      <Wrapper>
        <div className="w-100 bg-white">
          <header className="header d-md-flex justify-content-between align-items-center custom-container d-none">
            <Link href="/" passHref>
              <a>
                <img
                  src="/images/logo.png"
                  alt="fundandtraceLogo"
                  width={78}
                  height={55}
                />
              </a>
            </Link>
            <div className="d-flex align-items-center">
              <p className="mb-0 mr-3">Already have an account?</p>
              <Link href="/SignUp/SignIn" passHref>
                <a className="mb-0" style={{ color: "var(--color-primary)" }}>
                  Sign in
                </a>
              </Link>
            </div>
          </header>
          <div className="d-block d-md-none">
            <Navbar />
          </div>
        </div>
        <main className="">
          {signUpState.signUpFailed.status && (
            <div className="error text-center">
              <p className="my-4 text-danger">
                {signUpState.signUpFailed.error}
              </p>
            </div>
          )}
          <article className="d-flex flex-column  mx-auto">
            <p className="mb-4 text-blue text-center">SIGN UP</p>
            <h2 className="text-heading mb-4 text-center">Let’s go!</h2>
            <div className="d-flex justify-content-between mb-4">
              <input
                type="text"
                name="firstName"
                className={`name ${fNameError ? "error" : ""}`}
                placeholder="First Name"
                value={fName}
                onChange={(e) => {
                  setFNameError(false);
                  setFName(e.target.value);
                }}
              />
              <input
                type="text"
                className={`name ${lNameError ? "error" : ""}`}
                placeholder="Last Name"
                value={lName}
                name="lastName"
                onChange={(e) => {
                  setLNameError(false);
                  setLName(e.target.value);
                }}
              />
            </div>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Email Address"
              className={`email mb-4 ${emailError ? "error" : ""}`}
              value={email}
              onChange={(e) => {
                setEmailError(false);
                setEmail(e.target.value);
              }}
            />

            <div className="d-flex justify-content-between mb-4 w-100">
              <Select
                className={`name d-flex align-items-center justify-content-between ${
                  countryError ? "error" : ""
                }`}
              >
                <button
                  onClick={() => setShowCountries(!showCountries)}
                  className="w-100 d-flex align-items-center justify-content-between"
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
                      fontWeight: !country ? 300 : "",
                      opacity: !country ? 0.9 : 1,
                      fontSize: !country ? 14 : 16,
                    }}
                  >
                    {country ? country : "Country"}
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
                      }}
                      className="py-1 px-2"
                    />
                    <p
                      className="options py-3 mb-0 px-2"
                      onClick={() => {
                        setShowCountries(false);
                        setCountry("");
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
                          setCountry(country?.name);
                          setCountryError(false);
                          setShowCountries(false);
                          setCity("");
                        }}
                        role="button"
                      >
                        {country?.name}
                      </p>
                    ))}
                  </div>
                )}
              </Select>

              <Select
                className={`d-flex align-items-center justify-content-between name ${
                  cityError ? "error" : ""
                }`}
              >
                <button
                  className="d-flex align-items-center justify-content-between"
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
                      fontWeight: !city ? 300 : "",
                      opacity: !city ? 0.9 : 1,
                      fontSize: !city ? 14 : 16,
                    }}
                  >
                    {city ? city : "State/City"}
                  </p>
                  <img
                    src="/images/icons/dropdown.svg"
                    width={13}
                    height={8}
                    className="pt-0 ml-2"
                   alt="" />
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
                        setCity("");
                      }}
                      role="button"
                    >
                      State/City
                    </p>
                    {states.map((state, i) => (
                      <p
                        className="options py-3 mb-0 px-2"
                        key={i}
                        onClick={(e) => {
                          setCity(state?.name);
                          setCityError(false);
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

            <div
              style={{ position: "relative", paddingRight: 0 }}
              className="w-100 d-flex align-items-center mb-4 name"
            >
              <Select
                className={`d-flex align-items-center ${
                  codeError ? "error" : ""
                }`}
                style={{
                  background: "white",
                  position: "static",
                  width: "max-content",
                  paddingRight: 10,
                  height: "30px",
                  top: "0",
                  left: 20,
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
                      fontWeight: !code ? 300 : "",
                      opacity: !code ? 0.9 : 1,
                      fontSize: !code ? 14 : 16,
                    }}
                  >
                    {flag && (
                      <img src={flag} alt="" width={15} className="mr-2" />
                    )}
                    <p className="mb-0 ">{code ? code : "Phone"}</p>
                  </div>
                  <img
                    src="/images/icons/dropdown.svg"
                    width={13}
                    height={8}
                    className="pt-0 ml-2"
                   alt="" />
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
                        }}
                        className="py-1 px-2"
                      />
                      <p
                        className="options py-3 mb-0 px-2"
                        onClick={() => {
                          setShowPhone(false);
                          setCode("");
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
                            setCode(phone?.phone_code);
                            setCodeError(false);
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
                value={phone}
                placeholder="Phone"
                className={`email ${phoneError ? "error" : ""}`}
                style={{ border: 0, height: "48px", outline: "none" }}
                onChange={(e) => {
                  setPhoneError(false);
                  setPhone(e.target.value);
                }}
              />
            </div>
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPasswordBorderError(false);
                setPassword(e.target.value);
              }}
              className={`email ${passwordBorderError ? "error" : ""}`}
              placeholder="Password"
            />
            {password && password.length < 8 && (
              <p className="text-danger mb-1 mt-1" style={{ fontSize: 12 }}>
                Password must be more than 8 characters
              </p>
            )}
            {password &&
              !password.match(/[-!@#$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/) && (
                <p
                  className="text mb-0 mt-1 text-danger"
                  style={{ fontSize: 12 }}
                >
                  Password must be at least one special character
                </p>
              )}
            <input
              type="password"
              name="confirmPassword"
              id="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPasswordBorderError(false);
                setConfirmPassword(e.target.value);
              }}
              className={`email mb-1 mt-4 ${
                confirmPasswordBorderError ? "error" : ""
              }`}
              placeholder="Confirm Password"
            />
            {confirmPassWordError && (
              <p className="text-danger" style={{ fontSize: 12 }}>
                Password Do not match
              </p>
            )}
            <div className="mt-4 d-flex w-100">
              <input
                type="radio"
                name="subscription"
                id="subscription1"
                checked={subscription}
                onChange={() => setSubscription(true)}
              />
              <label className="d-inline" htmlFor="subscription1">
                Yes, please opt me on to Fund&Trace emails.
              </label>
            </div>
            <div className="mt-4 d-flex w-100">
              <input
                type="radio"
                name="subscription"
                id="subscription2"
                checked={!subscription}
                onChange={() => setSubscription(false)}
              />
              <label className="d-inline" htmlFor="subscription2">
                No, thanks.
              </label>
            </div>
            <div className="mt-3 w-100 d-flex">
              <input
                type="checkbox"
                name="terms"
                id="terms"
                checked={agree}
                onChange={() => setAgree(!agree)}
              />
              <label htmlFor="terms" className="mb-0">
                I have read and agree to the{" "}
                <a
                  style={{
                    color: "var(--color-primary)",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                  className="mb-0"
                  href="/terms"
                  target="_blank"
                >
                  Terms of Service
                </a>
              </label>
            </div>
            <button
              className="btn mt-5"
              onClick={() => {
                handleSubmit();
              }}
            >
              {signUpState.signingIn ? (
                <Spinner
                  type="TailSpin"
                  width={25}
                  height={25}
                  color={"white"}
                />
              ) : (
                <p className="mb-0 text-white">Next</p>
              )}
            </button>
          </article>
          <div className="d-flex align-items-center justify-content-center mt-4 ">
            <p className="mb-0 mr-3">Already have an account?</p>
            <Link href="/SignUp/SignIn" passHref>
              <a className="mb-0" style={{ color: "var(--color-primary)" }}>
                Sign In
              </a>
            </Link>
          </div>
        </main>
        <TermsModal
          showModal={showModal}
          onModalClose={() => setShowModal(false)}
          setAgree={() => setAgree(true)}
          sendEmail={sendEmail}
          setSendEmail={() => setSendEmail(!sendEmail)}
        />
      </Wrapper>
    </Layout>
  );
}

const Select = styled.div`
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

const Wrapper = styled.div`
  min-height: 100vh;
  background: #f9f9f9;
  .header {
    height: 70px;
  }
  main {
    padding: 50px 0;

    @media screen and (max-width: 767px) {
      padding: 125px 15px 50px 15px;
    }
    article {
      box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
        2px 10px 24px rgba(50, 50, 71, 0.05);
      border-radius: 4px;
      width: 662px;
      @media screen and (max-width: 767px) {
        width: 100%;
        max-width: 500px;
        padding: 39px 15px;
      }
      padding: 39px 121px;
      background-color: white;

      .error {
        border: 0.5px solid red !important;
        
      }
      .name {
        width: 46%;
        height: 50px;
        padding: 13px 20px;
        border: 0.5px solid #c4c4c4;
        box-sizing: border-box;
        border-radius: 4px;
        &::placeholder {
          
          font-style: normal;
          font-weight: 300;
          font-size: 14px;
          line-height: 24px;
          /* identical to box height, or 171% */

          opacity: 0.9;
        }
      }
      .email {
        width: 100%;
        height: 50px;
        padding: 13px 20px;
        border: 0.5px solid #c4c4c4;
        box-sizing: border-box;
        border-radius: 4px;
        &::placeholder {
          
          font-style: normal;
          font-weight: 300;
          font-size: 14px;
          line-height: 24px;
          /* identical to box height, or 171% */

          opacity: 0.9;
        }
      }
      select {
        
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 24px;
        /* identical to box height, or 171% */

        opacity: 0.9;
      }
      button {
        background: var(--color-primary);
        box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
          0px 2px 2px rgba(50, 50, 71, 0.06);
        border-radius: 4px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 15px 30px;
      }

      
      input[type='radio'], input[type='checkbox'] {
        --active: #275EFE;
        --active-inner: #fff;
        --focus: 2px var(--color-primary);
        --border: #BBC1E1;
        --border-hover: #275EFE;
        --background: #fff;
        --disabled: #F6F8FF;
        --disabled-inner: #E1E6F9;
        -webkit-appearance: none;
        -moz-appearance: none;
        height: 21px;
        outline: none;
        display: inline-block;
        vertical-align: top;
        position: relative;
        margin: 0;
        cursor: pointer;
        border: 1px solid var(--bc, var(--border));
        background: white;
        transition: background .3s, border-color .3s, box-shadow .2s;
        &:after {
          content: '';
          display: block;
          left: 0;
          top: 0;
          position: absolute;
          transition: transform var(--d-t, .3s) var(--d-t-e, ease), opacity var(--d-o, .2s);
        }
        &:checked {
          --b: white;
          --bc: white;
          --d-o: .3s;
          --d-t: .6s;
          --d-t-e: cubic-bezier(.2, .85, .32, 1.2);
          box-shadow: 0 0 0 var(--focus);
        }
        &:disabled {
          --b: var(--disabled);
          cursor: not-allowed;
          opacity: .9;
          &:checked {
            --b: var(--disabled-inner);
            --bc: var(--border);
          }
          & + label {
            cursor: not-allowed;
          }
        }
        &:hover {
          &:not(:checked) {
            &:not(:disabled) {
              --bc: var(--border-hover);
            }
          }
        }
        &:focus {
          box-shadow: 0 0 0 var(--focus);
        }
        &:not(.switch) {
          min-width: 21px;
          &:after {
            opacity: var(--o, 0);
          }
          &:checked {
            --o: 1;
          }
        }
        & + label {
          font-size: 14px;
          
            font-style: normal;
            font-weight: 300;
            font-size: 16px;
            line-height: 24px;
            /* or 150% */

            color: #514949;

            opacity: 0.9;
        
          display: inline-block;
          vertical-align: top;
          cursor: pointer;
          margin-left: 15px;
          margin-top: -2px
        }
      }
      
      input[type='radio']{
        border-radius: 50%;
        
        &:after {
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: var(--color-primary);
          opacity: 0;
          transform: scale(var(--s, .7));
        }
        &:checked {
          --s: .5;
          background: var(--color-primary);
          border: 3px solid white
        }
      }

      input[type='checkbox'] {
        border-radius: 2px;
        &:after {
          width: 19px;
          height: 19px;
          border-radius: 2px;
          background: var(--color-primary);
          opacity: 0;
          transform: scale(var(--s, .7));
        }
        &:checked {
          --s: .5;
          background: var(--color-primary);
          border: 3px solid white
        }
      }
    }
    }
  }
`;
