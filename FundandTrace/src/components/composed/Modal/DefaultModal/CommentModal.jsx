import React from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";
import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function CommentModal({ onModalClose, showModal, details }) {
  const [step, setStep] = useState("0");
  const [comment, setComment] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const res = axios.post(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/campaigns/campaign/addComment/" +
          details?.campaignId,
        { newComment: { ...details, comment: comment } }
      );
      res && setStep(1);
      res &&
        setTimeout(() => {
          onModalClose();
        }, 2000);
    } catch (error) {
    }
  };
  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column justify-content-center align-items-center">
        {step == "0" ? (
          <>
            {" "}
            <h2 className="text-heading mb-5 text-center">
              Would you like to leave any encouraging comments for the campaign?
            </h2>
            <textarea
              name="comment"
              id="comment"
              className="mb-4 p-3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%",
                height: 110,
                border: "0.5px solid #C4C4C4",
                borderRadius: 4,
                background: "#FAFAFA",
              }}
              placeholder="Leave a comment"
            ></textarea>
            <button
              className="btn submitBtn w-100 mb-4"
              onClick={() => handleSubmit()}
            >
              Submit
            </button>
            <a onClick={onModalClose} role="button">
              Skip
            </a>
          </>
        ) : (
          <div className="d-flex flex-column justify-content-center align-items-center">
            <h2 className="text-center text-medium-heading my-5">
              Your Comment has been successfully submitted
            </h2>
          </div>
        )}
      </Wrapper>
    </DefaultModal>
  );
}

const Wrapper = styled.section`
  width: 619px;
  border-radius: 4px;
  @media screen and (max-width: 767px) {
    width: 90vw;
    padding: 50px 20px;
  }
  padding: 60px;
  h2 {
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }
  p {
    margin-bottom: 60px;
  }
  .submitBtn {
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    color: white;
    padding: 15px 30px;
  }
`;
