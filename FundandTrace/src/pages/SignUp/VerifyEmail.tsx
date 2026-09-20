import axios from "axios";
import { useRouter } from "next/router";
import React from "react";
import { useState } from "react";

import styled from "styled-components";
import { toast } from "../../../store/slices/ToastSlice";
import Spinner from "../../components/composed/spinner/Spinner";
import ForgotPasswordLayout from "../ForgotPassword/ForgotPasswordLayout";
import { useAppDispatch } from "./../../../store/hooks";

export default function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useAppDispatch();
  //   const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/auth/signup/verifyEmail/" +
          email
      );
      res && setLoading(false);
      res && dispatch(toast(true, "Verification Mail sent!", "success"));
    } catch (error) {
      setLoading(false);
      dispatch(toast(true, "Server Error", "error"));
    }
  };
  return (
    <ForgotPasswordLayout>
      <Article className="d-flex flex-column justify-content-center align-items-center mx-auto">
        <p className="mb-4 text-blue">VERIFICATION</p>
        <h2 className="text-heading mb-4 text-center">
          {" "}
          You have not verified your account yet.
        </h2>

        <p
          className="mb-5 text text-center"
          style={{ fontWeight: 300, color: "black", opacity: 1, fontSize: 16 }}
        >
          Your account has not been verified yet. Kindly click the button below
          to send a verification link to your mail.
        </p>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <input
            type="email"
            name="email"
            id="email"
            className="w-100 mb-5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
          />
          <button className="btn mx-auto w-100" type="submit">
            {loading ? (
              <Spinner type="TailSpin" width={25} height={25} color={"white"} />
            ) : (
              <p className="mb-0 text-white">Send verification mail</p>
            )}
          </button>
        </Form>
      </Article>
    </ForgotPasswordLayout>
  );
}

const Form = styled.form`
  width: 100%;
  @media screen and (max-width: 767px) {
    width: 100%;
  }
  input {
    height: 50px;
    width: 100%;
    border: 0.5px solid #c4c4c4;
    box-sizing: border-box;
    border-radius: 4px;
    padding: 13px 20px;
    &::placeholder {
      color: #514949;
      opacity: 0.5;
    }
  }
`;

const Article = styled.article``;
