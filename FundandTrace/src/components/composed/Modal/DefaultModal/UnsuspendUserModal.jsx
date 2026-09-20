import React from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";
import { useState } from "react";
import axios from "axios";
import { toast } from "../../../../../store/slices/ToastSlice";
import { useDispatch } from "react-redux";
import { config } from "../../../helperFunctions/helperFunctions";
import Spinner from "../../spinner/Spinner";

export default function UnsuspendUserModal({
  onModalClose,
  showModal,
  profile,
}) {
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleUnsuspendUser = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/unsuspendUser/${profile._id}`,
        {
          profile,
          message,
        },
        config()
      );
      res && setLoading(false);
      res && setStep(3);
    } catch (error) {
      setLoading(false);
      dispatch(toast(true, error?.response?.data?.error, "error"));
    }
  };

  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column p-5">
        {step === 1 ? (
          <>
            {" "}
            <h2 className="text-medium-heading mb-3">
              Suspend {profile?.firstName} {profile?.lastName}
            </h2>
            <p className="text-small mb-5">
              Are you sure you want to unsuspend this User?
            </p>
            <div className="d-flex ml-auto">
              <button className="btn cancelBtn" onClick={onModalClose}>
                Cancel
              </button>
              <button className="btn deleteBtn ml-4" onClick={() => setStep(2)}>
                Unsuspend
              </button>
            </div>
          </>
        ) : step === 2 ? (
          <div className="d-flex flex-column">
            <h2 className="text-medium-heading mb-3">Send Email</h2>
            <p className="text-small mb-3">
              {` Would you like to inform ${profile?.firstName} ${profile?.lastName} the reasons
              why the account is being unsuspended?`}
            </p>
            <textarea
              name="message"
              id="message"
              cols="30"
              rows="7"
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <div className="d-flex ml-auto mt-5">
              <button
                className="btn cancelBtn"
                onClick={() => handleUnsuspendUser()}
              >
                {loading ? (
                  <Spinner
                    type="TailSpin"
                    width={20}
                    height={20}
                    color={"white"}
                  />
                ) : (
                  <p className="mb-0" style={{ color: "var(--color-primary)" }}>
                    Skip
                  </p>
                )}
              </button>
              <button
                className="btn approveBtn ml-4"
                onClick={() => handleUnsuspendUser()}
              >
                {loading ? (
                  <Spinner
                    type="TailSpin"
                    width={20}
                    height={20}
                    color={"white"}
                  />
                ) : (
                  <p className="mb-0 text-white">Unsspend</p>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column justify-content-center align-items-center">
            <h2 className="text-center text-medium-heading my-5">
              {profile?.firstName} {profile?.lastName} unsuspended
            </h2>
            <button
              className="text-white btn"
              style={{
                background: "var(--color-primary)",
                borderRadius: "4px",
                width: 124,
                height: 36,
                outline: "none",
              }}
              onClick={() => {
                onModalClose();
              }}
            >
              Continue
            </button>
          </div>
        )}
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
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 27px;
    /* identical to box height, or 169% */

    color: black;
  }

  textarea {
    background: #fafafa;
    border: 0.5px solid #c4c4c4;
    box-sizing: border-box;
    border-radius: 4px;
    padding: 10px;
  }

  .approveBtn {
    background: var(--color-primary);
    border-radius: 4px;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    outline: none;
    border: none;
    line-height: 143%;
    text-align: center;
    width: 124px;
    height: 36px;
    color: #ffffff;
  }

  .cancelBtn {
    background: #f0f1fe;
    border: 0.5px solid var(--color-primary);
    box-sizing: border-box;
    border-radius: 4px;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 16px;
    text-align: center;
    outline: none;
    width: 124px;
    height: 36px;
    color: var(--color-primary);
  }

  .deleteBtn {
    background: #f8444f;
    border-radius: 4px;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    outline: none;
    border: none;
    line-height: 143%;
    text-align: center;
    width: 124px;
    height: 36px;
    color: #ffffff;
  }
`;
