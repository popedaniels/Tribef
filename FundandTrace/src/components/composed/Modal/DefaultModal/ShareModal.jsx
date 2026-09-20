import React from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";
import { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";

export default function ShareModal({ onModalClose, showModal, campaign }) {
  const socials1 = [
    {
      social: "facebook",
      icon: "/images/icons/facebook2.svg",
      link: `https://fundandtrace.com/campaign/${
        campaign?._id
      }/${campaign?.basicInformation?.campaignTitle.split(" ").join("%")}`,
    },
  ];

  const [copied, setCopied] = useState(false);

  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column justify-content-center align-items-center">
        <h2 className="text-medium-heading mb-3 text-center">
          Help raise awareness for this campaign
        </h2>
        <p className="text-small text-center">
          Have a faster social reach by sharing the link to others on social
          media
        </p>
        <div className="d-flex flex-wrap socials">
          <a
            target="_blank" rel="noopener noreferrer"
            href={`https://www.facebook.com/dialog/share?app_id=210654824436090&display=popup&href=https%3A%2F%2Ffundandtrace.com%2Fcampaign%2F${campaign?._id}&redirect_uri=https%3A%2F%2Ffundandtrace.com%2Fcampaign%2F${campaign?._id}&quote=wisdomosss
            `}
          >
            <div
              className="d-flex flex-column align-items-center "
              style={{ width: 64 }}
            >
              <img
                src="/images/icons/facebook2.svg"
                width={20}
                height={32}
                alt="facebookIcon"
              />
              <p className="text-small">Facebook</p>
            </div>
          </a>
          <a
            target="_blank" rel="noopener noreferrer"
            href={`https://twitter.com/intent/tweet?text=Please Donate to this cause - https://fundandtrace.com/campaign/${
              campaign?._id
            }?title=${campaign?.basicInformation?.campaignTitle
              .split(" ")
              .join("")}`}
          >
            <div
              className="d-flex flex-column align-items-center "
              style={{ width: 64 }}
            >
              <img
                src="/images/icons/twitter2.svg"
                width={20}
                height={32}
                alt="twitterIcon"
              />
              <p className="text-small">Twitter</p>
            </div>
          </a>
          <a
            target="_blank" rel="noopener noreferrer"
            href={`https://api.whatsapp.com/send?text=Please Donate to this cause - https://fundandtrace.com/campaign/${
              campaign?._id
            }?title=${campaign?.basicInformation?.campaignTitle
              .split(" ")
              .join("")}`}
          >
            <div
              className="d-flex flex-column align-items-center "
              style={{ width: 64 }}
            >
              <img
                src="/images/icons/whatsapp.svg"
                width={20}
                height={32}
                alt="Whatsapp Icon"
              />
              <p className="text-small">Whatsapp</p>
            </div>
          </a>
        </div>

        <p className="text-small text-center mb-0">
          Share this link to your friends!
        </p>
        <input
          type="text"
          name=""
          id=""
          className="my-3"
          value={`https://fundandtrace.com/campaign/${
            campaign?._id
          }?title=${campaign?.basicInformation?.campaignTitle
            .split(" ")
            .join("%")}`}
        />
        <div className="d-flex">
          <CopyToClipboard
            text={`https://fundandtrace.com/campaign/${
              campaign?._id
            }?title=${campaign?.basicInformation?.campaignTitle
              .split(" ")
              .join("%")}`}
            onCopy={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 4000);
            }}
          >
            <button className="btn shareBtn">
              {copied ? "copied" : "Copy Link"}
            </button>
          </CopyToClipboard>
        </div>
      </Wrapper>
    </DefaultModal>
  );
}

const Wrapper = styled.section`
  width: 619px;
  @media screen and (max-width: 767px) {
    width: 90vw;
    padding: 50px 20px;
  }
  padding: 50px 0;
  h2 {
    width: 300px;
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }
  p {
    margin-bottom: 30px;
  }
  .socials {
    width: 300px;
    justify-content: space-between;
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }
  .socials2 {
    justify-content: space-evenly;
  }
  .shareBtn {
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    color: white;
    padding: 15px 30px;
  }
  input {
    background: #fafafa;
    border: 0.5px solid #c4c4c4;
    box-sizing: border-box;
    border-radius: 4px;
    height: 50px;
    width: 100%;
    padding: 10px 30px 13px 30px;
    max-width: 489px;
  }
  a {
    text-decoration: none;
  }
`;
