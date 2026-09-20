import axios from "axios";
import { useRouter } from "next/router";
import React from "react";

import styled from "styled-components";
import { toast } from "../../../store/slices/ToastSlice";
import ForgotPasswordLayout from "./ForgotPasswordLayout";
import { useAppDispatch } from "./../../../store/hooks";

export default function ForgotPasswordMail() {
  const router = useRouter();
  const { email } = router.query;
  const dispatch = useAppDispatch();

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/resetPassword/sendResetMail/" +
          email
      );

      res && dispatch(toast(true, "Password reset mail sent!", "success"));
    } catch (error) {
      dispatch(toast(true, "Something went wrong, try again", "error"));
    }
  };
  return (
    <ForgotPasswordLayout>
      <Article className="d-flex flex-column justify-content-center align-items-center mx-auto">
        <p className="mb-3 text-blue">PASSWORD SENT</p>
        <h2 className="text-heading mb-3 text-center">Check your email</h2>

        <p className="mb-3 text text-center">
          We have sent the password recover instructions to your email Dididn’t
          receive the email? Chek your spam folder, or resend the mail
        </p>
        <img src="/images/mail.png" width="194px" className="mb-4" alt="" />
        <button className="btn" onClick={handleSubmit}>
          <p className="mb-0">Resend</p>
        </button>
      </Article>
    </ForgotPasswordLayout>
  );
}

const Article = styled.article`
  button {
    width: 100%;
    font-size: 16px;
    color: var(--color-primary) !important;
    background: #ffffff !important;
    border: 0.5px solid var(--color-primary);
    box-sizing: border-box;
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
  }
`;
