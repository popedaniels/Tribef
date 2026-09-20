import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "../components/Navbar/Navbar";
import { useSelector } from "react-redux";
import {
  authStateActions,
  selectAuthStateState,
} from "../../store/slices/authSlice";
import Spinner from "../components/composed/spinner/Spinner";
import { toast } from "../../store/slices/ToastSlice";
import axios from "axios";
import Layout from "../components/Layout";
import { useAppDispatch } from "./../../store/hooks";

export default function Verification() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const { authenticated, loggingIn, logInFailed } =
    useSelector(selectAuthStateState);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      dispatch(
        authStateActions.setLogInFailed({
          status: false,
          error: "",
        })
      );
      dispatch(authStateActions.setLoggingIn(true));
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/auth/login",
        {
          email,
          password,
        },
        { withCredentials: true }
      );
      res &&
        dispatch(authStateActions.setProfile(res?.data?.data?.userProfile));
      res && dispatch(authStateActions.loginSuccess(true));
      res && dispatch(authStateActions.setLoggingIn(false));
      res && dispatch(toast(true, "Sign In successful", "success"));
      res && router.push("/dashboard");
      res && setLoading(false);
    } catch (error) {
      dispatch(toast(true, "Login Failed", "error"));
      dispatch(authStateActions.setLoggingIn(false));
      dispatch(
        authStateActions.setLogInFailed({
          status: true,
          error: error?.response?.data?.error,
        })
      );
      setLoading(false);
      return console.error(error.message);
    }
  };

  const handleSubmit = () => {
    try {
      setLoading(true);
      login(email, password);
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg" title="Fund&Trace | Verification">
      <Wrapper>
        <div className="w-100 bg-white">
          <header className="header d-md-flex justify-content-between align-items-center custom d-none">
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
          </header>
          <div className="d-block d-md-none">
            <Navbar />
          </div>
        </div>
        <main className="d-flex justify-content-between align-items-center custom flex-column flex-md-row">
          <div className="left">
            <p className="text-blue mb-3">SIGN UP SUCCESSFUL</p>
            <h2 className="text-heading">
              Welcome to Fund&Trace, the top crowdfunding platform!
            </h2>
            <p className="text-small">
              Kindly sign in to your account to get started.
            </p>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Email"
              className="mb-4 p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              className="mb-4 p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {logInFailed.status && (
              <p className="text-danger">{logInFailed.error}</p>
            )}
            <p
              className="text-right text-small"
              style={{ textDecoration: "underline", cursor: "pointer" }}
            >
              Forgot Your Password?
            </p>
            <button className="btn" onClick={handleSubmit}>
              {loading ? (
                <Spinner
                  type="TailSpin"
                  width={25}
                  height={25}
                  color={"white"}
                />
              ) : (
                <p className="mb-0"> Log In</p>
              )}
            </button>
          </div>
          <div className="right">
            <img
              src="https://res.cloudinary.com/wisdomosara/image/upload/v1622836194/verification.png"
              alt="verificationImage"
              width="100%"
              height="100%"
            />
          </div>
        </main>
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.div`
.custom{
 
  @media screen and (max-width: 767px) {
    padding-left: 15px;
    padding-right: 15px;
  }
  @media screen and (min-width: 768px) {
    padding-left: 50px;
    padding-right: 50px;
  }
  @media screen and (min-width: 1280px) {
    padding-left: 140px;
    padding-right: 140px;
  }
  @media screen and (min-width: 1440px) {
    padding-left: 13%;
    padding-right: 13%;
  };
  max-width: 1440px;
  margin-left :auto;
  margin-right: auto
}
  min-height: 100vh;
  @media screen and (max-width: 767px) {
    min-height: auto
  }

  .header {
    height: 100px;
  }
  main {
    @media screen and (max-width: 767px) {
        padding-top: 130px
    }
    margin-bottom: 80px;
    .left {
      min-width: 420px;
      @media screen and (max-width: 767px) {
        width: 100%;
        min-width: 100%
      }
      max-width: 420px;
      @media screen and (min-width: 768px) and (max-width: 899px) {
        min-width: 45%;
        margin-right: 40px
      }
      @media screen and (min-width: 900px) {
        margin-right: 40px
      }
      input {
        border: 0.5px solid #c4c4c4;
        box-sizing: border-box;
        border-radius: 4px;
        height: 50px;
        width: 100%;
        &::placeholder{
          color: #514949;

        opacity: 0.5;
        }
      }
    }
    .right {
      max-width: 500px;
      @media screen and (max-width: 767px) {
        display: none
      }
    }
  }
  button {
    width: 100%;
    color: white !important;
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06), 0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 15px 30px;
  }
`;
