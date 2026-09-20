import React from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";
import { useState } from "react";
import { logout } from "../../../../../store/slices/authSlice";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";

export default function LogoutModal({ onModalClose, showModal }) {
  const dispatch = useDispatch();
  const router = useRouter();
  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column justify-content-center align-items-center">
        {" "}
        <p className="text-blue mb-5">LOG OUT</p>
        <h2 className="text-medium-heading mb-5 text-center">
          Are you sure you want to log out?
        </h2>
        <div className="d-flex">
          <button
            className="btn deleteBtn mr-4"
            onClick={() => {
              dispatch(logout());
              router.push("/");
            }}
          >
            Logout
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
  width: 619px;
  @media screen and (max-width: 767px) {
    width: 90vw;
    padding: 50px 20px;
  }
  padding: 50px 0;
  h2 {
    width: 300px;
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }
  p {
    margin-bottom: 60px;
  }
  .deleteBtn {
    border: 0.6px solid #ff647c;
    box-sizing: border-box;
    filter: drop-shadow(0px 2px 4px rgba(50, 50, 71, 0.06)),
      drop-shadow(0px 2px 2px rgba(50, 50, 71, 0.06));
    border-radius: 4px;
    color: #ff647c;
    padding: 15px 30px;
  }
  .cancelBtn {
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    color: white;
    padding: 15px 30px;
  }
`;
