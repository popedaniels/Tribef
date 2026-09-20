import React, { useState } from "react";
import DashboardLayout from "../../DashboardLayout";
import styled from "styled-components";
import Link from "next/link";
import SettingsComp from "../../../../components/SettingsComp";
import SwitchComponent from "../../../../components/composed/SwitchComponent";

export default function SupportedCampaigns() {
  const [checkTarget, setCheckTarget] = useState(true);
  const [checkFunding, setCheckFunding] = useState(true);
  return (
    <DashboardLayout hideMobileNav page="Settings">
      <div className="d-flex d-md-none custom-container align-items-center py-4">
        <Link href="/dashboard/settings/notifications" passHref>
          <a style={{ textDecoration: "none" }}>
            <img
              src="/images/icons/back.svg"
              width={16}
              height={16}
              alt="slideIcon"
              className="mr-4"
            />
          </a>
        </Link>
        <h2 className="mb-0 text-medium-heading">Supported Campaigns</h2>
      </div>
      <section className="">
        <Wrapper
          className="d-flex flex-column mt-5 align-items-center mx-auto"
          style={{ maxWidth: 1140 }}
        >
          <h2 className="text-heading mb-5 d-none d-md-block">Settings</h2>
          <div className="d-flex main-holder">
            <div className="d-none d-md-flex">
              <SettingsComp />
            </div>
            <div
              className="d-none d-md-block"
              style={{ height: "auto", width: 1, background: "#CCCCCC" }}
            ></div>
            <Main className="bg-white p-3">
              <div className="align-items-center py-3 d-none d-md-flex">
                <Link href="/dashboard/settings/notifications" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <img
                      src="/images/icons/back.svg"
                      width={16}
                      height={16}
                      alt="slideIcon"
                      className="mr-4"
                    />
                  </a>
                </Link>
                <h2 className="mb-0 text-medium-heading">
                  Supported campaigns
                </h2>
              </div>
              <article className="d-flex justify-content-between align-items-center py-3">
                <div>
                  <p className="mb-2">Target</p>
                  <p
                    className="mb-0"
                    style={{ color: "#A0A2AF", fontSize: 12 }}
                  >
                    {checkTarget
                      ? "You’ll receive notifications from Fund&Trace via emails when campaign reaches its traget"
                      : "You won't receive notifications from Fund&Trace via emails when campaign reaches its traget"}
                  </p>
                </div>
                <SwitchComponent
                  checked={checkTarget}
                  toggleCheck={() => setCheckTarget(!checkTarget)}
                />
              </article>

              <article className="d-flex justify-content-between align-items-center py-3">
                <div>
                  <p className="mb-2">Funding requests</p>
                  <p
                    className="mb-0"
                    style={{ color: "#A0A2AF", fontSize: 12 }}
                  >
                    {checkFunding
                      ? "You’ll receive notifications from Fund&Trace via emails when a funding request is approved"
                      : "You won't receive notifications from Fund&Trace via emails when a funding request is approved"}
                  </p>
                </div>
                <SwitchComponent
                  checked={checkFunding}
                  toggleCheck={() => setCheckFunding(!checkFunding)}
                />
              </article>
            </Main>
          </div>
        </Wrapper>
      </section>
    </DashboardLayout>
  );
}

const Wrapper = styled.div`
  .main-holder {
    @media screen and (max-width: 767px) {
      width: 100%;
      padding: 30px 15px;
    }
  }
`;

const Main = styled.div`
  width: 440px;
  box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
    2px 10px 24px rgba(50, 50, 71, 0.05);
  @media screen and (max-width: 767px) {
    width: 100%;
  }
  @media screen and (min-width: 768px) and (max-width: 1000px) {
    width: 350px;
  }
`;
