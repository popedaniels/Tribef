import React from "react";
import DefaultModal from "../../composed/Modal/DefaultModal/DefaultModal";
import styled from "styled-components";
import Link from "next/link";

export default function HowItWorksModal({ onModalClose, showModal }) {
  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      variant="large"
    >
      <div className="p-3">
        <h3 className="text-blue mb-4 font-weight-bold" style={{ fontSize: 18 }}>
          HOW FUND&amp;TRACE WORKS
        </h3>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between">
          <HowItem>
            <Link href="/workings" passHref>
              <a onClick={onModalClose} style={{ textDecoration: "none" }}>
                <img
                  src="/images/stories/water_story.jpg"
                  width="100%"
                  alt="How it works"
                  style={{ borderRadius: 4, height: 160, objectFit: "cover" }}
                />
                <h4 className="mt-3">The Milestone Lifecycle</h4>
                <p>Learn how phased disbursements and automated statements protect every donation.</p>
              </a>
            </Link>
          </HowItem>

          <HowItem>
            <Link href="/fees" passHref>
              <a onClick={onModalClose} style={{ textDecoration: "none" }}>
                <img
                  src="/images/stories/medical_hope.jpg"
                  width="100%"
                  alt="Pricing and Fees"
                  style={{ borderRadius: 4, height: 160, objectFit: "cover" }}
                />
                <h4 className="mt-3">0% Platform Fees</h4>
                <p>See why Fund&amp;Trace is 100% free for organizers and how gateways process payouts.</p>
              </a>
            </Link>
          </HowItem>

          <HowItem>
            <Link href="/fundraisingIdeas" passHref>
              <a onClick={onModalClose} style={{ textDecoration: "none" }}>
                <img src="/images/how2.png" width="100%" alt="Fundraising Ideas" />
                <h4 className="mt-3">Fundraising Strategy</h4>
                <p>Tips, guides, and templates to organize a viral, transparent crowdfunding campaign.</p>
              </a>
            </Link>
          </HowItem>
        </div>
      </div>
    </DefaultModal>
  );
}

const HowItem = styled.div`
  width: 31%;
  margin-bottom: 20px;
  background: var(--color-surface, #fbfcfe);
  border: 1px solid var(--color-border, #e8ecf8);
  border-radius: 4px;
  padding: 16px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(23, 28, 53, 0.08);
    border-color: var(--color-primary);
  }

  @media screen and (max-width: 767px) {
    width: 100%;
  }

  img {
    height: 180px;
    border-radius: 4px;
    object-fit: cover;
  }

  h4 {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-heading);
    margin-bottom: 6px;
  }

  p {
    font-size: 13px;
    color: var(--color-text-muted, #788099);
    line-height: 1.5;
    margin: 0;
  }
`;
