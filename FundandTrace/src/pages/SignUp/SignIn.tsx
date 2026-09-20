import Link from "next/link";
import React, { useEffect } from "react";
import styled from "styled-components";
import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { login, selectAuthStateState } from "../../../store/slices/authSlice";
import Spinner from "../../components/composed/spinner/Spinner";
import Layout from "../../components/Layout";
import { useAppDispatch } from "./../../../store/hooks";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { authenticated, loggingIn, logInFailed } =
    useSelector(selectAuthStateState);

  useEffect(() => {
    authenticated && router.back();
  }, [authenticated, router]);
  return (
    <Layout
      title="FundandTrace | Sign In"
      description="Sign In, The leading fundraising platform"
    >
      <Wrapper>
        <div className="w-100 bg-white">
          <header className="header d-md-flex justify-content-between align-items-center custom-container d-none">
            <Link href="/" passHref>
              <a>
                <img
                  src="/images/logo.png"
                  alt="fundandtraceLogo"
                  width={78}
                  height={55}
                />
              </a>
            </Link>
            <div className="d-flex align-items-center">
              <p className="mb-0 mr-3">Don't have an account?</p>
              <Link href="/SignUp">
                <a className="mb-0" style={{ color: "var(--color-primary)" }}>
                  Sign Up
                </a>
              </Link>
            </div>
          </header>
          <div className="d-block d-md-none">
            <Navbar />
          </div>
        </div>
        <main className="">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              dispatch(login(email, password));
            }}
            className="d-flex flex-column justify-content-center align-items-center mx-auto"
          >
            <p className="mb-4 text-blue">SIGN IN</p>
            <h2 className="text-heading mb-4">Welcome Back!</h2>

            {/* <Link href="/SignUp/SignIn" passHref>
            <button className="btn d-flex gmailBtn w-100 mb-4">
              <img
                src="/images/icons/gmail.svg"
                width="24px"
                height="18px"
                alt="gmailLogo"
              />
              <p className="mb-0 ml-3">Continue with gmail</p>
            </button>
          </Link>
          <Link href="/SignUp/SignIn" passHref>
            <button className="btn d-flex facebookBtn w-100 mb-2">
              <img
                src="/images/icons/facebookSignIn.svg"
                width="24px"
                height="18px"
                alt="facebookLogo"
              />
              <p className="mb-0 ml-3">Continue with Facebook</p>
            </button>
          </Link>
          <p className="text-small my-4">OR</p> */}
            <input
              type="email"
              name="email"
              id="email"
              required
              placeholder="Email Address"
              className="email mb-4"
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* <input
              type="password"
              name="password"
              id="password"
              required
              onChange={(e) => setPassword(e.target.value)}
            /> */}
            <div className="input-div w-100 d-flex align-items-center position-relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                name="password"
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                className="mb-2 email"
                placeholder="Password"
                required
              />

              <div
                className="img"
                role="button"
                style={{
                  position: "absolute",
                  width: "20px",
                  height: 20,
                  right: 14,
                  top: 10,
                }}
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
            {logInFailed.status && (
              <p className="text-danger">{logInFailed.error}</p>
            )}
            <Link href="/ForgotPassword" passHref>
              <a href="" className="mb-4 text-right w-100 text-dark">
                Forgot Password?
              </a>
            </Link>

            <button
              className="btn w-100"
              disabled={email && password ? false : true}
              onClick={() => dispatch(login(email, password))}
            >
              {loggingIn ? (
                <Spinner
                  type="TailSpin"
                  width={25}
                  height={25}
                  color={"white"}
                />
              ) : (
                <p className="mb-0 text-white">Sign In</p>
              )}
            </button>
          </form>
          <div className="d-flex align-items-center justify-content-center mt-4 ">
            <p className="mb-0 mr-3">Don't have an account?</p>
            <Link href="/SignUp" passHref>
              <a className="mb-0" style={{ color: "var(--color-primary)" }}>
                Sign Up
              </a>
            </Link>
          </div>
        </main>
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.div`
  background: #f9f9f9;
  min-height: 100vh;
  .header {
    height: 70px;
  }
  main {
    padding: 50px 0;

    @media screen and (max-width: 767px) {
      padding: 125px 15px 50px 15px;
    }
    form {
      box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
        2px 10px 24px rgba(50, 50, 71, 0.05);
      border-radius: 4px;
      width: 662px;
      @media screen and (max-width: 767px) {
        width: 100%;
        max-width: 500px;
        padding: 39px 15px;
      }
      padding: 39px 121px;
      background-color: white;
      .name {
        width: 46%;
        @media screen and (max-width: 767px) {
          width: 100%;
        }
        height: 50px;
        padding: 13px 20px;
        border: 0.5px solid #c4c4c4;
        box-sizing: border-box;
        border-radius: 4px;
        &::placeholder {
          font-style: normal;
          font-weight: 300;
          font-size: 14px;
          line-height: 24px;
          /* identical to box height, or 171% */

          opacity: 0.9;
        }
      }
      .email {
        width: 100%;
        height: 50px;
        padding: 13px 20px;
        border: 0.5px solid #c4c4c4;
        box-sizing: border-box;
        border-radius: 4px;
        &::placeholder {
          font-style: normal;
          font-weight: 400;
          font-size: 14px;
          line-height: 24px;
          /* identical to box height, or 171% */

          opacity: 0.9;
        }
      }
      select {
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 24px;
        /* identical to box height, or 171% */

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
        padding: 15px 30px;
      }
      .gmailBtn {
        color: #f44336 !important;
        background: white;
        box-shadow: none;

        border: 0.5px solid #f44336;
        box-sizing: border-box;
        border-radius: 4px;
      }
      .facebookBtn {
        color: white !important;
        background: #3b5998;
        border: 0.5px solid #3b5998;
        box-sizing: border-box;
        border-radius: 4px;
      }
    }
  }
`;
