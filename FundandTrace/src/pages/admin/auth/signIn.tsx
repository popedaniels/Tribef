import React, { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { toast } from "../../../../store/slices/ToastSlice";
import axios from "axios";
import {
  adminLogin,
  selectAdminAuthStateState,
} from "../../../../store/slices/adminAuthStateSlice";
import Spinner from "../../../components/composed/spinner/Spinner";
import { useAppDispatch } from "./../../../../store/hooks";

export default function AdminSignInPage() {
  const [password, setPassword] = useState("");
  //   const [error, setError] = useState("");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const { JWT, adminLoggingIn } = useSelector(selectAdminAuthStateState);

  const handleSubmit = async () => {
    try {
      const res = await dispatch(adminLogin(email, password));
    } catch (error) {
    }
  };

  useEffect(() => {
    JWT != "" &&
      setTimeout(() => {
        router.push("/admin");
      }, 1000);
  }, [JWT, router]);

  return (
    <Layout title="FundandTrace | Admin Sign In">
      <Wrapper>
        <header>
          <img
            src="/images/draftImage.png"
            alt="f&T logo"
            width="63px"
            height="45px"
          />
        </header>
        <section className="d-flex flex-column justify-content-center align-items-center mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <h2 className="text-medium-heading text-center mb-4">Fund&Trace</h2>
            <p className="text-center mb-5">
              Login to the dashboard with the form below
            </p>
            <div className="input-div  w-100">
              <label htmlFor="email">Email Address</label>
              <input
                type={"email"}
                value={email}
                className=" w-100"
                name="email"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <div
                className="error-div position-absolute"
                style={{ top: "100%" }}
              >
                {email && email?.length < 8 && (
                  <p className="text mb-0 mt-2">
                    Password must be at least 8 characters
                  </p>
                )}
              </div>
            </div>
            <div className="input-div  w-100 ">
              <label htmlFor="password">Password</label>
              <div className="d-flex align-items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  name="password"
                  id="password"
                  className=" w-100"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <div
                  className="img"
                  role="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.8817 18.297C15.1229 19.4126 13.0824 20.0033 10.9997 20C5.60766 20 1.12166 16.12 0.180664 11C0.610694 8.67072 1.78229 6.5429 3.52066 4.93401L0.391664 1.80801L1.80666 0.393005L21.6057 20.193L20.1907 21.607L16.8807 18.297H16.8817ZM4.93466 6.35001C3.57567 7.5856 2.62898 9.20879 2.22266 11C2.53496 12.3665 3.16193 13.6411 4.05367 14.7226C4.94541 15.804 6.07729 16.6624 7.35922 17.2293C8.64114 17.7962 10.0377 18.0561 11.4378 17.9881C12.8378 17.9202 14.2026 17.5264 15.4237 16.838L13.3957 14.81C12.5324 15.3538 11.5099 15.5881 10.4959 15.4744C9.48194 15.3608 8.53671 14.9059 7.81523 14.1844C7.09376 13.463 6.63889 12.5177 6.52523 11.5038C6.41156 10.4898 6.64585 9.46732 7.18966 8.60401L4.93466 6.35001ZM11.9137 13.328L8.67166 10.086C8.49373 10.5389 8.45185 11.034 8.55117 11.5104C8.65049 11.9867 8.88668 12.4238 9.23078 12.7679C9.57488 13.112 10.0119 13.3482 10.4883 13.4475C10.9647 13.5468 11.4597 13.5049 11.9127 13.327L11.9137 13.328ZM19.8067 15.592L18.3757 14.162C19.0441 13.2093 19.5201 12.1352 19.7767 11C19.5049 9.80973 18.9939 8.68715 18.2748 7.7005C17.5557 6.71385 16.6435 5.88373 15.5935 5.26061C14.5436 4.63749 13.378 4.23437 12.1674 4.07577C10.9568 3.91717 9.72667 4.00638 8.55166 4.33801L6.97366 2.76001C8.22066 2.27001 9.57966 2.00001 10.9997 2.00001C16.3917 2.00001 20.8777 5.88001 21.8187 11C21.5122 12.6657 20.8235 14.2376 19.8067 15.592ZM10.7227 6.50801C11.3592 6.46867 11.9968 6.56507 12.5932 6.79082C13.1896 7.01657 13.7313 7.36652 14.1822 7.81746C14.6332 8.2684 14.9831 8.81003 15.2088 9.40646C15.4346 10.0029 15.531 10.6405 15.4917 11.277L10.7217 6.50801H10.7227Z"
                      fill="#A0A2AF"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <button className="btn ml-auto">
              {adminLoggingIn ? (
                <Spinner
                  type="TailSpin"
                  width={25}
                  height={25}
                  color={"white"}
                />
              ) : (
                <p className="mb-0 text-white">Log In</p>
              )}
            </button>
          </form>
        </section>
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.main`
  background: url("/images/adminBackground.png");
  padding-bottom: 50px;
  min-height: 100vh;
  header {
    background: var(--color-primary);
    box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.06);
    padding: 21px 100px;
  }
  section {
    margin-top: 66px;
    box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
      2px 10px 24px rgba(50, 50, 71, 0.05);
    border-radius: 4px;
    width: 662px;
    @media screen and (max-width: 767px) {
      width: 100%;
      max-width: 500px;
      padding: 39px 15px;
    }
    padding: 60px 125px;
    background-color: white;
    .text {
      font-style: normal;
      font-weight: 300;
      font-size: 14px;
      line-height: 24px;
      /* or 133% */

      color: #514949;

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
      padding: 8px 30px;
    }

    form {
      width: 100%;
      .input-div {
        position: relative;
        .img {
          position: absolute;
          right: 14px;
          height: 21px;
          width: 21px;
          margin-top: -3px;
        }
        margin-bottom: 60px;
        input {
          border: 0.5px solid #c4c4c4;
          box-sizing: border-box;
          border-radius: 4px;
          height: 50px;
          padding: 13px 20px;
          &::placeholder {
            font-style: normal;
            font-weight: 300;
            font-size: 14px;
            line-height: 24px;
            color: #514949;
            opacity: 0.5;
          }
        }
      }
    }
  }
`;
