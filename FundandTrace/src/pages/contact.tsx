import React, { useState } from "react";
import Header from "../components/HeaderComponent/Header";
import styled from "styled-components";
import Layout from "../components/Layout";

import { toast } from "../../store/slices/ToastSlice";
import axios from "axios";
import { useAppDispatch } from "./../../store/hooks";

const emptyState = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const dispatch = useAppDispatch();
  const [support, setSupport] = useState(emptyState);

  const handleSubmit = async () => {
    if (!support.fullName || !support.email || !support.message) {
      dispatch(toast(true, "Please fill in your name, email and message.", "error"));
      return;
    }
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/supports",
        { support }
      );
      res && setSupport(emptyState);
      res && dispatch(toast(true, "Message Sent with thanks!", "success"));
    } catch (error) {
      // Graceful fallback: if the server is unreachable, hand off to the
      // visitor's email client so their message is never lost.
      const subject = encodeURIComponent(support.subject || "Support request");
      const body = encodeURIComponent(
        `From: ${support.fullName} <${support.email}>\n\n${support.message}`
      );
      window.location.href = `mailto:support@fundandtrace.com?subject=${subject}&body=${body}`;
      dispatch(
        toast(
          true,
          "Our contact service is offline — your message has been opened in your email app instead.",
          "error"
        )
      );
    }
  };

  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg" title="Fund&Trace | Contact Us" showFooter>
      <Wrapper>
        <Header height={550} />
        <div className="custom-container d-flex flex-column flex-md-row contact">
          <div
            className="title text-center text-md-left mx-auto"
            style={{ width: "max-content" }}
          >
            <p className="text-blue">CONTACT US</p>
            <h2>Let's talk</h2>
            <h2 style={{ color: "var(--color-primary)" }}>about you</h2>
          </div>
          <Section>
            <h2 className="heading text-heading">Send Us A Message</h2>
            <div>
              <p>Full Name</p>
              <input
                type="text"
                value={support?.fullName}
                onChange={(e) =>
                  setSupport({ ...support, fullName: e.target.value })
                }
              />
            </div>
            <div>
              <p>Email</p>
              <input
                type="email"
                value={support?.email}
                onChange={(e) =>
                  setSupport({ ...support, email: e.target.value })
                }
              />
            </div>
            <div>
              <p>Subject</p>
              <input
                type="text"
                value={support?.subject}
                onChange={(e) =>
                  setSupport({ ...support, subject: e.target.value })
                }
              />
            </div>
            <div>
              <p>Message</p>
              <textarea
                name="message"
                value={support?.message}
                id="message"
                onChange={(e) =>
                  setSupport({ ...support, message: e.target.value })
                }
              ></textarea>
            </div>
            <button className="btn" onClick={handleSubmit}>
              Send{" "}
              <img
                src="/images/icons/contactSend.svg"
                width={15}
                height={16}
                alt="sendIcon"
                className="ml-3"
              />
            </button>
          </Section>
        </div>
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.section`
  .contact {
    margin-bottom: 144px;
    width: 100%;
    margin-top: -520px;
    @media screen and (max-width: 767px) {
      margin-top: -400px;
    }
    .title {
      width: 40%;
      padding-top: 150px;
      h2 {
        font-style: normal;
        font-weight: bold;
        font-size: 32px;
        line-height: 48px;
        /* or 150% */

        color: #514949;
      }
      @media screen and (max-width: 767px) {
        width: 100%;
        padding-top: 0;
        margin-bottom: 70px;
      }
    }
  }
`;

const Section = styled.section`
  width: 60%;
  background: #ffffff;
  padding: 40px 5%;
  box-shadow: 0px 4px 12px -6px rgba(24, 39, 75, 0.06),
    0px 4px 24px -4px rgba(24, 39, 75, 0.06);
  border-radius: 4px;
  @media screen and (max-width: 767px) {
    width: 100%;
  }
  .heading {
    margin-bottom: 31px;
  }
  p {
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 28px;
    /* identical to box height, or 175% */
    margin-bottom: 18px;
    color: #514949;
  }
  input,
  textarea {
    background: #ffffff;
    border: 0.5px solid #c4c4c4;
    box-sizing: border-box;
    border-radius: 4px;
    width: 100%;
    padding: 0 15px;
    margin-bottom: 50px;
  }
  input {
    height: 50px;
  }
  textarea {
    height: 172px;
    padding: 15px;
  }
  button {
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    width: 154px;
    height: 54px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    color: white !important;
    padding: 15px 30px;
  }
`;
