import React from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";

export default function TermsModal({
  onModalClose,
  showModal,
  setAgree,
  sendEmail,
  setSendEmail,
}) {
  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column justify-content-center align-items-center p-3 p-md-5">
        <div
          className="d-flex align-items-center justify-content-between mb-3 w-100 bg-white pb-3"
          style={{ position: "sticky", top: 0, height: "50px", zIndex: 1000 }}
        >
          <h2 className="text-medium-heading mb-0">Terms of Service</h2>
          <button
            type="button"
            onClick={onModalClose}
            className="ft-plain closeBtn"
            aria-label="Close terms of service"
          >
            &times;
          </button>
        </div>
        <div className="d-flex flex-column socials" tabIndex={0} aria-label="Terms summary">
          <p>
            This is a summary of the key points. By agreeing you accept the
            full{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </p>
          <h3>Donations are held in escrow</h3>
          <p>
            Money donated to a campaign is held by Fund&amp;Trace and released
            only through approved funding requests. Organisers must explain what
            each request is for and may be asked for receipts or invoices.
          </p>
          <h3>Organisers must verify their identity</h3>
          <p>
            Before funds can be released, organisers complete identity checks
            (KYC) and provide accurate payout details. Misrepresenting a cause or
            misusing funds leads to suspension and may be reported to the
            authorities.
          </p>
          <h3>Payouts are public</h3>
          <p>
            Approved payouts — amount, date and purpose — are shown on the
            campaign&rsquo;s public tracker so donors can follow their money.
            Bank details are encrypted and never published.
          </p>
          <h3>Disputes can freeze a campaign</h3>
          <p>
            Donors may raise a dispute about a campaign they supported. If enough
            disputes are raised, payouts are frozen while our trust and safety
            team investigates; if fraud is confirmed, remaining funds are
            refunded to donors.
          </p>
          <h3>Fees</h3>
          <p className="mb-0">
            Fund&amp;Trace charges no platform fee. Payment providers charge
            their own processing fees.
          </p>
        </div>
        <div className="d-flex justify-content-between align-items-center w-100 mt-4">
          <div className="d-flex">
            <input
              type="checkbox"
              name="sendEmail"
              id="sendEmail"
              className="mr-3 mt-1"
              checked={sendEmail}
              onChange={setSendEmail}
            />
            <label htmlFor="sendEmail" className="mb-0">
              <span
                style={{
                  color: "var(--color-primary)",

                  cursor: "pointer",
                }}
                className="mb-0"
              >
                Send copy to my email
              </span>
            </label>
          </div>
          <button
            className="btn shareBtn"
            onClick={() => {
              setAgree();
              onModalClose();
            }}
          >
            I AGREE
          </button>
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

  .socials {
    max-height: 320px;
    overflow-y: auto;
    padding-right: 8px;
    line-height: 1.6;
    color: var(--color-text-secondary, #4a5170);
  }

  .socials h3 {
    font-size: 15px;
    font-weight: 600;
    margin: 16px 0 4px;
    color: var(--color-text-primary, #151a30);
  }

  .socials a {
    color: var(--color-primary);
    text-decoration: underline;
  }

  .closeBtn {
    border: 0;
    background: transparent;
    font-size: 28px;
    line-height: 1;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    color: inherit;
    cursor: pointer;
  }

  .closeBtn:hover,
  .closeBtn:focus-visible {
    background: rgba(105, 121, 248, 0.1);
  }

  .shareBtn {
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    color: white;
    padding: 15px 30px;
  }

`;
