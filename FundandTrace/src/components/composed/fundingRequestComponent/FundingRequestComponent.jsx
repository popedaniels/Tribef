import React from "react";
import styles from "./FundingRequestsComponent.module.scss";

export default function FundingRequestsComponent({ fundingRequest, campaign }) {
  return (
    <div className="mx-auto" style={{ maxWidth: 1000 }}>
      <div className={styles.receipt}>
        <p>
          Funding statement of {campaign?.basicInformation?.campaignTitle} as at{" "}
          {new Date(Date.now()).toDateString()}
        </p>
        <div>
          <div
            className={["d-flex align-items-start", styles.statement].join(" ")}
          >
            <div className={styles.statement__left}>
              <p className="mb-0 text-small">Transaction Date</p>
            </div>
            <div className={styles.statement__right}>
              <p className="mb-0 text-small">
                {new Date(fundingRequest?.approvedAt).toDateString()}
              </p>
            </div>
          </div>
          <div
            className={["d-flex align-items-start", styles.statement].join(" ")}
          >
            <div className={styles.statement__left}>
              <p className="mb-0 text-small">Account Number</p>
            </div>
            <div className={styles.statement__right}>
              <p className="mb-0 text-small">
                {fundingRequest?.fundingType == "third-party"
                  ? `${fundingRequest?.thirdPartyAccountNumber
                      ?.toString()
                      ?.substring(
                        0,
                        4
                      )}XXX${fundingRequest?.thirdPartyAccountNumber
                      ?.toString()
                      ?.substring(7)}`
                  : `${campaign?.funding?.accountNumber
                      ?.toString()
                      ?.substring(0, 4)}XXX${campaign?.funding?.accountNumber
                      ?.toString()
                      ?.substring(7)}`}
              </p>
            </div>
          </div>
          <div
            className={["d-flex align-items-start", styles.statement].join(" ")}
          >
            <div className={styles.statement__left}>
              <p className="mb-0 text-small">Amount</p>
            </div>
            <div className={styles.statement__right}>
              <p className="mb-0 text-small">
                {fundingRequest?.currency == "USD"
                  ? "$"
                  : fundingRequest?.currency == "GBP"
                  ? "£"
                  : "₦"}
                {fundingRequest?.amount}
              </p>
            </div>
          </div>
          <div
            className={[
              "d-flex align-items-start flex-column flex-md-row",
              styles.statement,
            ].join(" ")}
          >
            <div className={styles.statement__left}>
              <p className="mb-0 text-small">Purpose of funding</p>
            </div>
            <div className={styles.statement__right}>
              <p className="mb-0 text-small">
                {fundingRequest?.purposeOfFunding}
              </p>
            </div>
          </div>
          {fundingRequest?.proofOfFunding && (
            <div
              className={[
                "d-flex align-items-start flex-column flex-md-row",
                styles.statement,
              ].join(" ")}
            >
              <div className={styles.statement__left}>
                <p className="mb-0 text-small">Proof of funding</p>
              </div>
              <div className={styles.statement__right}>
                <div className={styles.image__div}>
                  <img
                    src={fundingRequest?.proofOfFunding}
                    alt="proofofpayment"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
