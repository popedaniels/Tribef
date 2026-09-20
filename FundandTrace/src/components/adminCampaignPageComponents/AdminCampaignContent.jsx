import Link from "next/link";
import React, { useState } from "react";
import styled from "styled-components";
import DonationsModal from "../composed/Modal/DefaultModal/DonationsModal";
import { getTimeDiff } from "../helperFunctions/helperFunctions";

export default function AdminCampaignContent({ campaign }) {
  const [showDonationModal, setShowDonationModal] = useState(false);

  return (
    <Wrapper className="d-flex flex-column flex-md-row bottom justify-content-between mx-auto">
      <div className="w-100 stories">
        {campaign?.content?.campaignVideo && (
          <div style={{ position: "relative", marginBottom: 30 }}>
            {campaign?.content?.campaignVideo?.includes("youtube.com") ? (
              <Iframe style={{ marginBottom: 40 }}>
                <iframe
                  className="iframe"
                  src={campaign?.content?.campaignVideo}
                ></iframe>
              </Iframe>
            ) : (
              <video
                src={campaign?.content?.campaignVideo}
                alt="video"
                style={{
                  width: "100%",
                  objectFit: "cover",
                  height: 450,
                }}
                controls
              />
            )}
          </div>
        )}
        {campaign?.content?.story.map((para, i) => (
          <p
            className="mb-4"
            key={i}
            style={{
              whiteSpace: "pre-wrap",

              fontWeight: 300,
              opacity: 0.9,
            }}
          >
            {para}
          </p>
        ))}
        {campaign?.comments?.length ? (
          <div className="comments mt-5 mb-3">
            <h2 className="text-heading">
              Comments ({campaign?.comments?.length})
            </h2>
            {campaign?.comments.map((comment, i) => (
              <div className="comment d-flex mb-4" key={i}>
                <div
                  className="d-flex align-items-center justify-content-center mr-3"
                  style={{
                    minWidth: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: "#F0F0F0",
                    color: "#A0A2AF",
                    opacity: 0.9,
                  }}
                >
                  {comment?.name?.split(" ")?.length > 1
                    ? `${comment?.name.split(" ")[0]?.charAt(0)}${comment?.name
                        ?.split(" ")[1]
                        ?.charAt(0)}`
                    : `${comment?.name[0]}${comment?.name[1]}`}
                </div>
                <div>
                  <div className="d-flex mb-2 align-items-center">
                    <p className="mb-0 mr-2" style={{ fontWeight: 500 }}>
                      {comment?.name}
                    </p>
                    <p
                      className="mb-0"
                      style={{
                        fontWeight: 300,
                        opacity: 0.9,
                        fontSize: 14,
                      }}
                    >
                      {getTimeDiff(comment?.time)}
                    </p>
                  </div>
                  <p
                    className="mb-0"
                    style={{
                      fontWeight: 300,

                      opacity: 0.9,
                    }}
                  >
                    {comment?.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <h2 className="text-heading">No comments yet!</h2>
        )}
      </div>
      <div className="mb-4 mb-md-0 donors">
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <p className="mb-0" style={{ fontWeight: 400 }}>
              DONORS
            </p>
            <p
              className="text-blue mb-0"
              style={{ cursor: "pointer" }}
              onClick={() => setShowDonationModal(true)}
              role="button"
            >
              See All +
            </p>
          </div>
          {campaign?.donations?.length ? (
            campaign?.donations.slice(0, 4).map((donation, i) => (
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
                      {donation?.donorName}
                    </p>
                  </div>

                  <p className="mb-0 text-small mt-3">
                    {campaign?.funding?.currency == "USD"
                      ? "$"
                      : campaign?.funding?.currency == "GBP"
                      ? "£"
                      : "₦"}
                    {Math.round(donation?.amount)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <h2 className="text-medium-heading">No Donations Yet!</h2>
          )}
        </div>
      </div>
      <DonationsModal
        donations={campaign?.donations}
        campaignId={campaign?._id}
        showModal={showDonationModal}
        onModalClose={() => setShowDonationModal(false)}
        campaign={campaign}
      />
    </Wrapper>
  );
}

const Iframe = styled.div`
  min-width: 100%;
  max-width: 100%;
  .iframe {
    min-width: 100%;
    max-width: 100%;
    height: 400px;
    @media screen and (max-width: 767px) {
      width: 100%;
      height: 400px;
    }
  }
`;

const Wrapper = styled.section`
  .stories {
    max-width: 60%;
    padding: 10px 0 0 0;
    @media screen and (min-width: 768px) and (max-width: 1023px) {
      max-width: 55%;
      padding: 30px 0 !important;
    }
    @media screen and (max-width: 767px) {
      order: 10;
      padding: 30px 0 !important;
      border-right: none;
      width: 100%;
      max-width: 100%;
    }
  }
  .donors {
    width: 36%;
    position: sticky;
    top: 10px;
    height: 100%;
    padding: 30px;
    box-shadow: 0px 12px 12px rgba(50, 50, 71, 0.08),
      0px 16px 24px rgba(50, 50, 71, 0.08);
    @media screen and (min-width: 768px) and (max-width: 1023px) {
      width: 42%;
    }
    @media screen and (max-width: 767px) {
      border-left: none !important;
      padding: 30px 0 !important;
      position: static;
      width: 100%;
      height: auto;
      box-shadow: none;
      order: 1;
    }
  }
`;
