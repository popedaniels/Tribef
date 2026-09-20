import React, { useEffect } from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";
import { useState } from "react";
import { selectAuthStateState } from "../../../../../store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "../../../../../store/slices/ToastSlice";

export default function ChangePasswordModalModal({ onModalClose, showModal }) {
  const dispatch = useDispatch();

  const { profile } = useSelector(selectAuthStateState);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setError("");
      if (newPassword === confirmPassword) {
        const res = await axios.post(
          process.env.NEXT_PUBLIC_API_URL +
            "/api/auth/changePassword/" +
            profile?.email,
          { oldPassword: oldPassword, newPassword: newPassword },
          { withCredentials: true }
        );
        res &&
          dispatch(toast(true, "Password changed successfully", "success"));
        res && onModalClose();
      } else {
        setError("Password do not match");
      }
    } catch (error) {
      dispatch(toast("true", error.response.data.error, "error"));
    }
  };

  useEffect(() => {
    setOldPassword("");
    setConfirmPassword("");
    setNewPassword("");
  }, []);

  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column justify-content-center align-items-center">
        {" "}
        <p className="mb-5" style={{ color: "#3E3E3E", fontWeight: "bold" }}>
          Change password
        </p>
        <div className="mb-4">
          <p className="text-small mb-2">Old password</p>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <p className="text-small mb-2">New password</p>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <p className="text-small mb-2">Confirm password</p>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <p className="mb-0">{error}</p>}
        </div>
        <div className="d-flex justify-content-center">
          <button className="btn saveBtn mr-4" onClick={handleSubmit}>
            Save
          </button>
          <button className="btn cancelBtn" onClick={onModalClose}>
            Cancel
          </button>
        </div>
      </Wrapper>
    </DefaultModal>
  );
}

const Wrapper = styled.section`
  width: 700px;
  @media screen and (max-width: 767px) {
    width: 90vw;
    padding: 35px 20px;
  }
  padding: 35px 0 50px 0;

  p {
    margin-bottom: 60px;
  }
  div {
    width: 379px;
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }
  input {
    background: #ffffff;
    border: 1px solid #c4c4c4;
    box-sizing: border-box;
    width: 379px;
    height: 46px;
    padding: 15px 20px;
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }
  .saveBtn {
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    color: white;
    width: 153px;
    // @media screen and (max-width: 767px) {
    //   width: auto;
    // }
  }
  .cancelBtn {
    border: 0.6px solid #ff647c;
    box-sizing: border-box;
    border-radius: 4px;
    color: #ff647c;
    padding: 15px 30px;
    width: 153px;
  }
`;
