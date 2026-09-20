import React from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  getCurrency,
  getTimeDiff,
} from "../../../helperFunctions/helperFunctions";

export default function DonationsModal({
  onModalClose,
  showModal,
  donations,
  campaignId,
  campaign,
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column justify-content-center align-items-center position-relative">
        {" "}
        <div
          className="d-flex align-items-center justify-content-between mb-3 w-100 bg-white py-5"
          style={{ position: "sticky", top: 0, height: "50px", zIndex: 1000 }}
        >
          <h2 className="text-medium-heading mb-0">
            Donations({donations?.length})
          </h2>
          <p
            onClick={onModalClose}
            className="mb-0"
            style={{ fontWeight: 500, cursor: "pointer" }}
            role="button"
          >
            X
          </p>
        </div>
        <div className="w-100">
          {donations?.length ? (
            donations.map((donation, i) => (
              <div className="mb-4 d-flex align-items-start" key={i}>
                <h5 className="mb-0" style={{ width: 30 }}>
                  {i + 1}
                </h5>
                <div className="d-flex flex-column ml-3">
                  <div
                    className="d-flex align-items-center "
                    style={{ width: 240 }}
                  >
                    <img
                      src="/images/icons/profile.svg"
                      width={24}
                      height={24}
                      alt="profile"
                    />
                    <p className="ml-2 mb-0" style={{ fontWeight: 400 }}>
                      {donation?.anonymous ? "Anonymous" : donation.donorName}
                    </p>
                  </div>

                  <div className="d-flex aligm-items-center mt-3">
                    <p className="mb-0 text-small">
                      {getCurrency(campaign?.funding?.currency)}
                      {Math.round(donation?.amount)}
                    </p>
                    <p className="mb-0 ml-2 text-small">
                      {" "}
                      - {getTimeDiff(donation?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <h2 className="text-medium-heading">No Donations Yet!</h2>
          )}

          <div
            style={{
              position: "sticky",
              bottom: 0,
              zIndex: 1000,
            }}
            className="bg-white py-3 w-100"
          >
            <Link href={`/donate/${campaignId}`} passHref>
              <a>
                <button className="btn deleteBtn w-100">Donate Now</button>
              </a>
            </Link>
          </div>
        </div>
      </Wrapper>
    </DefaultModal>
  );
}

const Wrapper = styled.section`
  width: 500px;
  @media screen and (max-width: 767px) {
    width: 90vw;
    padding: 0 20px 50px 20px;
  }
  padding: 0 50px 0 50px;

  p {
    margin-bottom: 60px;
  }
  .deleteBtn {
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    color: white;
    padding: 15px 30px;
  }
`;
