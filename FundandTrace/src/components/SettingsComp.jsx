import React from "react";
import styled from "styled-components";
import Link from "next/link";

export default function SettingsComp() {
  return (
    <>
      <Main className="bg-white p-3">
        <Link href="/dashboard/settings/notifications" passHref>
          <a style={{ textDecoration: "none" }}>
            <article className="d-flex justify-content-between align-items-center py-3">
              <p className="mb-0">Notifications</p>
              <img
                src="/images/icons/slidefrontgray.svg"
                width={8}
                height={13}
                alt="slideIcon"
              />
            </article>
          </a>
        </Link>
        <Link href="/dashboard/edit-profile" passHref>
          <a style={{ textDecoration: "none" }}>
            <article className="d-flex justify-content-between align-items-center py-3">
              <p className="mb-0">Security and account access</p>
              <img
                src="/images/icons/slidefrontgray.svg"
                width={8}
                height={13}
                alt="slideIcon"
              />
            </article>
          </a>
        </Link>
        <Link href="/dashboard/settings/privacy" passHref>
          <a style={{ textDecoration: "none" }}>
            <article className="d-flex justify-content-between align-items-center py-3">
              <p className="mb-0">Privacy and Safety</p>
              <img
                src="/images/icons/slidefrontgray.svg"
                width={8}
                height={13}
                alt="slideIcon"
              />
            </article>
          </a>
        </Link>
        {/* <article className="d-flex justify-content-between align-items-center py-3">
          <p className="mb-0">Accessibility</p>
          <img
            src="/images/icons/slidefrontgray.svg"
            width={8}
            height={13}
            alt="slideIcon"
          />
        </article> */}
      </Main>
    </>
  );
}

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
