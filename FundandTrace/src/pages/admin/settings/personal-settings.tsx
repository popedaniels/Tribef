import axios from "axios";
import { cloudinaryUploadUrl } from "../../../utils/cloudinary";
import { useRouter } from "next/router";
import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import {
  adminAuthStateActions,
  adminLogout,
  selectAdminAuthStateState,
} from "../../../../store/slices/adminAuthStateSlice";
import { logout } from "../../../../store/slices/authSlice";
import { toast } from "../../../../store/slices/ToastSlice";
import ChangePasswordModalModal from "../../../components/composed/Modal/DefaultModal/ChangePasswordModal";
import Spinner from "../../../components/composed/spinner/Spinner";
import {
  grabErrorMessage,
  grabErrorStatus,
} from "../../../components/helperFunctions/helperFunctions";
import AdminSettingsPageLayout from "./settingsLayout";
import { config } from "../../../../src/components/helperFunctions/helperFunctions";
import { useAppDispatch } from "./../../../../store/hooks";
import {
  getAllCountries as locationGetAllCountries,
  getStates as locationGetStates,
} from "../../../components/helperFunctions/locationFunctions";

interface CountryOption {
  name?: string;
  phone_code?: string;
  href: { flag: string };
}

interface StateOption {
  name?: string;
}

export default function AdminSettingsIndexPage() {
  const { adminProfile } = useSelector(selectAdminAuthStateState);
  const [selectedFile, setSelectedFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [states, setStates] = useState<StateOption[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [showCountries, setShowCountries] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [flag, setFlag] = useState("");
  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [allStates, setAllStates] = useState<StateOption[]>([]);
  const [allCountries, setAllCountries] = useState<CountryOption[]>([]);
  const [phones, setPhones] = useState<CountryOption[]>([]);
  const [update, setUpdate] = useState({
    profilePicture: adminProfile?.profilePicture,
    country: adminProfile?.country,
    city: adminProfile?.city,
    phone: adminProfile?.phone,
    language: adminProfile?.language,
    code: adminProfile?.code,
  });
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      const file = e.target.files![0];
      const formData = new FormData();
      formData.append("upload_preset", "campaignImage");
      formData.append("file", file);
      const url = await axios.post(
        cloudinaryUploadUrl(),
        formData
      );

      // dispatch(
      //   authStateActions.setEditProfile({
      //     profilePicture: url.data.secure_url,
      //   })
      // );
      setUpdate({ ...update, profilePicture: url.data.secure_url });
      previewFile(file);
      setLoading(false);
    } catch (error) {
    }
  };

  const previewFile = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setSelectedFile(reader.result);
      }
    };
  };

  const handleSubmit = async () => {
    try {
      if (
        update.city &&
        update.country &&
        update.phone &&
        update.language &&
        update.code
      ) {
        const res = await axios.post(
          process.env.NEXT_PUBLIC_API_URL +
            "/api/admin/updateProfile/" +
            adminProfile?._id,
          { profile: { ...adminProfile, ...update } },
          config()
        );
        res.data.data &&
          dispatch(adminAuthStateActions.setAdminProfile(res.data.data));
        res && dispatch(toast(true, "Profile Updated", "success"));
      } else {
        dispatch(toast(true, "Please Fill the mandatory fields", "error"));
      }
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(adminLogout());
      }
    }
  };

  const handleCancel = () => {
    router.reload();
  };

  const getPic = () => {
    if (selectedFile) {
      return selectedFile;
    }
    if (update.profilePicture) {
      return update.profilePicture;
    } else {
      return "/images/account.png";
    }
  };

  const getStates = useCallback(async () => {
    try {
      const data = await locationGetStates(update.country);
      setStates(data);
      setAllStates(data);
    } catch (err) {
    }
  }, [update.country]);

  const getCountries = async () => {
    try {
      const data = await locationGetAllCountries();
      setCountries(data);
      setAllCountries(data);
      setPhones(data);
    } catch (error) {
    }
  };

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
    getCountries();
  }, []);

  useEffect(() => {
    update.country && getStates();
  }, [update.country, getStates]);

  return (
    <AdminSettingsPageLayout currentPage={1}>
      <h3 className="text-medium-heading">Personal Settings</h3>
      <p>Customize your experience</p>
      <Div className="mt-5">
        <div
          style={{ position: "relative", width: 100, height: 100 }}
          className="d-flex align-items-center justify-content-center mb-4"
        >
          <img
            src={getPic()}
            width={100}
            height={100}
            style={{ borderRadius: "50%", objectFit: "cover" }}
            alt="profilePicture"
          />

          {loading && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <Spinner type="TailSpin" width={35} height={35} color={"blue"} />
            </div>
          )}
          <label
            className="d-flex align-items-center justify-content-center position-absolute"
            style={{
              cursor: "pointer",
              bottom: "-12px",
              right: 0,
              height: 30,
              width: 30,
              borderRadius: "50%",
              background: "var(--color-primary)",
            }}
          >
            <img
              src="/images/Frame.svg"
              width={16}
              height={16}
              className=""
              alt="dropdown icon"
            />
            <input
              type="file"
              className="d-none"
              name="pic"
              id="pic"
              accept="image/*"
              onChange={handleSelect}
            />
          </label>
        </div>

        <main>
          <article className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="left">
              <p className="text-small">First Name</p>
              <input type="text" value={adminProfile?.firstName} disabled />
            </div>
            <div className="right">
              <p className="text-small">Last Name</p>
              <input type="text" value={adminProfile?.lastName} disabled />
            </div>
          </article>
          <article className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="left">
              <p className="text-small">Email Address</p>
              <input type="email" value={adminProfile?.email} disabled />
            </div>
            <div className="right" style={{ position: "relative" }}>
              <p className="text-small">Phone Number</p>
              <div className="d-flex align-items-center bg-white">
                <Select
                  className="d-flex align-items-center"
                  style={{
                    background: "white",
                    position: "static",
                    width: "max-content",
                    paddingRight: 10,

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
                    <div className="d-flex align-items-center value">
                      {flag && (
                        <img
                          src={flag}
                          alt="flag"
                          width={15}
                          className="mr-2"
                        />
                      )}
                      <p className="mb-0 ">
                        {update?.code ? update?.code : "Phone"}
                      </p>
                    </div>
                    <img
                      src="/images/icons/dropdown.svg"
                      width={13}
                      height={8}
                      className="pt-0 ml-2"
                      alt="dropdown icon"
                    />
                  </button>

                  {showPhone && (
                    <div
                      onClick={() => setShowPhone(false)}
                      className="overlay"
                    ></div>
                  )}
                  {showPhone && (
                    <div className="dropdown bg-white">
                      <input
                        type="search"
                        autoFocus={true}
                        autoComplete="new-password"
                        placeholder="Search by country"
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
                          setCode("");
                          setFlag("");
                        }}
                        role="button"
                      >
                        Phone
                      </p>
                      {phones.map((phone, i) => (
                        <div
                          className="options py-3 mb-0 px-2 d-flex align-items-center"
                          key={i}
                          onClick={() => {
                            setUpdate({
                              ...update,
                              code: phone?.phone_code,
                            });
                            setShowPhone(false);
                            setFlag(phone?.href?.flag);
                          }}
                          role="button"
                        >
                          <img src={phone.href.flag} alt="" width={15} />
                          <p className="ml-2 mb-0">{phone?.phone_code}</p>
                          <p className="ml-2 mb-0">{phone?.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Select>
                <input
                  type="phone"
                  value={update.phone}
                  maxLength={10}
                  style={{ height: "48px", outline: "none" }}
                  onChange={(e) =>
                    setUpdate({ ...update, phone: e.target.value })
                  }
                />
              </div>
            </div>
          </article>
          <article className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="left">
              <p className="text-small">Country</p>

              <Select className="d-flex align-items-center justify-content-between name">
                <button
                  className="d-flex align-items-center justify-content-between"
                  onClick={() => setShowCountries(!showCountries)}
                  style={{
                    border: "none",
                    minWidth: "100%",
                    borderStyle: "none",
                    boxShadow: "none",
                    outline: "none",
                    background: "white",

                    padding: 0,
                  }}
                >
                  <p className="mb-0 value">
                    {update.country ? update.country : "Country"}
                  </p>
                  <img
                    src="/images/icons/dropdown.svg"
                    width={13}
                    height={8}
                    className="pt-0 ml-2"
                    alt="dropdown icon"
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
                        zIndex: 1000,
                      }}
                      className="py-1 px-2"
                    />
                    <p
                      className="options py-3 mb-0 px-2"
                      onClick={() => {
                        setShowCountries(false);
                        setUpdate({ ...update, country: "", city: "" });
                        setCode("");
                        setFlag("");
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
                          setUpdate({
                            ...update,
                            country: country?.name,
                            city: "",
                          });
                          setShowCountries(false);
                          // setUpdate({ ...update, city: "" });
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
            <div className="right">
              <p className="text-small">City</p>
              <Select className="d-flex align-items-center justify-content-between name">
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

                    padding: 0,
                  }}
                >
                  <p className="mb-0 value">
                    {update.city ? update.city : "State/City"}
                  </p>
                  <img
                    src="/images/icons/dropdown.svg"
                    width={13}
                    height={8}
                    className="pt-0 ml-2"
                    alt="dropdown icon"
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
                        zIndex: 1000,
                      }}
                      className="py-1 px-2"
                    />
                    <p
                      className="options py-3 mb-0 px-2"
                      onClick={() => {
                        setShowStates(false);
                        setUpdate({ ...update, city: "" });
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
                          setUpdate({ ...update, city: state?.name });
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
          </article>
          <article className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="left">
              <p className="text-small">Update Password</p>
              <button
                className="btn password-btn w-100 bg-transparent"
                style={{
                  color: "var(--color-primary)",
                  border: "0.5px solid var(--color-primary)",
                  boxShadow: "none",
                  height: 48,
                }}
                onClick={() => setShowModal(true)}
                role="button"
              >
                Update Password
              </button>
            </div>
            <div className="right">
              <p className="text-small">Language</p>
              <select
                name="language"
                id="language"
                value={update.language}
                onChange={(e) =>
                  setUpdate({ ...update, language: e.target.value })
                }
              >
                <option value="English">English</option>
                <option value="Chinese">Chinese</option>
                <option value="Espanoyol">Espanoyol</option>
                <option value="Arabic">Arabic</option>
              </select>
            </div>
          </article>
          <div className="d-flex align-items-center justify-content-center">
            <div className="d-flex flex-wrap w-100 d-md-none">
              <button
                className="button btn text-white"
                onClick={handleSubmit}
                style={{ background: "var(--color-primary)", borderRadius: "4px" }}
              >
                Save changes
              </button>
              <button
                className="button mb-0 btn bg-white btn-white text-danger"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
            <div className="d-md-flex d-none flex-wrap">
              <button
                className="btn text-white mr-4"
                onClick={handleSubmit}
                style={{ background: "var(--color-primary)", borderRadius: "4px" }}
              >
                Save changes
              </button>
              <button
                className="btn bg-white btn-white text-danger"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </main>
        <ChangePasswordModalModal
          showModal={showModal}
          onModalClose={() => setShowModal(false)}
        />
      </Div>
    </AdminSettingsPageLayout>
  );
}

const Select = styled.div`
  width: 100%;
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.1);;
  box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1), 0 4px 10px 0px rgba(0, 0, 0, 0.04), 0 7px 8px -5px rgba(255, 255, 255, 0.2);
  box-sizing: border-box;
  height: 46px;
  padding: 5px 15px;
  button{
    height: 44px !important
  }
  &:disabled {
    color: #b3b3b3;
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
    z-index: 1000000000;
    cursor: pointer;
    width: max-content;
    max-height: 300px;
    overflow-y: scroll;
    left: 0;
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

const Div = styled.div`
  width: 760px;
  @media screen and (max-width: 1100px) {
    width: 100%;
  }
  main {
    .button {
      @media screen and (max-width: 767px) {
        width: 100%;
        margin-bottom: 25px;
        margin-right: 0;
      }
    }
    .btn-white {
      border: 0.6px solid #ff647c !important;
      box-sizing: border-box;
      border-radius: 4px;
    }
    article {
      padding-top: 0 !important;
      padding-bottom: 43px !important;
      @media screen and (max-width: 767px) {
        padding-bottom: 0 !important;
        padding-top: 0 !important;
      }
      .left,
      .right {
        width: 45%;
        @media screen and (max-width: 767px) {
          width: 100%;
          margin-bottom: 43px;
        }
        input,
        select {
          width: 100%;
          background: #ffffff;
          border: 0.5px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 10px -10px rgba(255, 255, 255, 0.1),
            0 4px 10px 0px rgba(0, 0, 0, 0.04),
            0 7px 8px -5px rgba(255, 255, 255, 0.2);
          box-sizing: border-box;
          height: 46px;
          padding: 5px 15px;
          &:disabled {
            color: #b3b3b3;
          }
        }
      }
    }
  }
`;
