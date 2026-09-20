import React from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";
import { useState } from "react";
import axios from "axios";
import Spinner from "../../spinner/Spinner";
import { config } from "../../../helperFunctions/helperFunctions";

export default function AdminSendEmailModal({
  onModalClose,
  showModal,
  userEmail,
  userName,
}) {
  const [step, setStep] = useState("1");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSend = async () => {
    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/sendMail`,
        { email: userEmail, message: message, userName },
        config()
      );
      res && setStep("2");
      res && setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column p-5">
        {step == "1" ? (
          <div className="d-flex flex-column">
            <h2 className="text-medium-heading mb-3">Send Email</h2>
            <p className="text-small mb-3">
              Send {userName} an email about this campaign
            </p>
            <textarea
              name="decline"
              id="decline"
              cols="30"
              rows="7"
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <div className="d-flex ml-auto mt-5">
              <button className="btn cancelBtn" onClick={() => onModalClose()}>
                <p className="mb-0" style={{ color: "var(--color-primary)" }}>
                  Cancel
                </p>
              </button>
              <button
                className="btn approveBtn ml-4"
                onClick={() => handleSend()}
              >
                {loading ? (
                  <Spinner
                    type="TailSpin"
                    width={20}
                    height={20}
                    color={"white"}
                  />
                ) : (
                  <p className="mb-0 text-white">Send</p>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column justify-content-center align-items-center">
            <h2 className="text-center text-medium-heading my-5">Mail Sent</h2>
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
                setStep("1");
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
