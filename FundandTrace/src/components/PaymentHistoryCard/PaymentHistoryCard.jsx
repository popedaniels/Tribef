import { useState } from "react";
import ApproveCampaignModal from "../composed/Modal/DefaultModal/ApproveCampaignModal";
import DeclineCampaignModal from "../composed/Modal/DefaultModal/DeclineCampaignModal";
import styles from "./PaymentHistoryCard.module.scss";

export default function PaymentHistoryCard({
  fundingRequest,
  last,
  admin = false,
  campaignDetail = null,
  reload = () => {},
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [declineModal, setDeclineModal] = useState(false);

  return (
    <div
      className="w-100 pb-5 pl-4 pl-md-5"
      style={{
        cursor: "pointer",
        borderLeft: last ? "none" : "1px solid #D8DAFA",
        position: "relative",
      }}
    >
      <div className={styles.icon}>
        <img
          src={`/images/icons/${
            fundingRequest?.status == "Approved"
              ? "approved"
              : fundingRequest?.status == "Pending"
              ? "pending"
              : "rejected"
          }.svg`}
          width="20"
          height="20"
          alt="PaymentHistoryIcon"
        />
      </div>

      <div
        className="pb-3 pl-2 pl-md-0"
        role="button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="d-flex flex-wrap align-items-start justify-content-between">
          <div>
            <div className="mb-3">
              <h2 className={styles.bold}>
                {fundingRequest?.amount} {fundingRequest?.currency}
              </h2>
              <p className="text-small mb-0">
                {new Date(fundingRequest?.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="d-flex align-items-center d-md-none">
              <div
                className={[
                  "text-small mb-0 mr-3 d-flex align-items-center",
                  styles.state,
                ].join(" ")}
                style={{
                  background:
                    fundingRequest?.status == "Approved"
                      ? "#17D37B"
                      : fundingRequest?.status == "Pending"
                      ? "#EFC109"
                      : "#FF5050",
                }}
              >
                <img
                  src={`/images/icons/${
                    fundingRequest?.status == "Approved"
                      ? "checkWhite"
                      : fundingRequest?.status == "Pending"
                      ? "pendingWhite"
                      : "rejectedWhite"
                  }.svg`}
                  width="15"
                  height="13"
                  alt="PaymentHistoryIcon"
                  className="mr-2 mr-md-3"
                />
                <p className="mb-0">{fundingRequest?.status}</p>
              </div>
            </div>
          </div>
          <div className="align-items-center d-none d-md-flex">
            <div
              className={[
                "text-small mb-0 mr-3 d-flex align-items-center",
                styles.state,
              ].join(" ")}
              style={{
                background:
                  fundingRequest?.status == "Approved"
                    ? "#17D37B"
                    : fundingRequest?.status == "Pending"
                    ? "#EFC109"
                    : "#FF5050",
              }}
            >
              <img
                src={`/images/icons/${
                  fundingRequest?.status == "Approved"
                    ? "checkWhite"
                    : fundingRequest?.status == "Pending"
                    ? "pendingWhite"
                    : "rejectedWhite"
                }.svg`}
                width="15"
                height="13"
                alt="PaymentHistoryIcon"
                className="mr-2 mr-md-3"
              />
              <p className="mb-0">{fundingRequest?.status}</p>
            </div>
            {showDropdown ? (
              <img
                src="/images/icons/blueup.svg"
                alt=""
                width={15}
                height={16}
              />
            ) : (
              <img
                src="/images/icons/dropdown.svg"
                alt=""
                width={15}
                height={16}
              />
            )}
          </div>
          <div className="d-md-none">
            {showDropdown ? (
              <img
                src="/images/icons/blueup.svg"
                alt=""
                width={15}
                height={16}
              />
            ) : (
              <img
                src="/images/icons/dropdown.svg"
                alt=""
                width={15}
                height={16}
              />
            )}
          </div>
        </div>
      </div>

      <div className={showDropdown ? styles.showdropdown : styles.hidedropdown}>
        <div className="d-flex align-items-center mb-4">
          <div className="w-50">
            <h2 className={styles.bold}>Amount</h2>
            <p className="text-small mb-0">
              {" "}
              {fundingRequest?.amount} {fundingRequest?.currency}
            </p>
          </div>
        </div>
        <div className="mb-4">
          <h2 className={styles.bold}>Purpose of Funding</h2>
          <p className="text-small mb-0" style={{ whiteSpace: "pre-wrap" }}>
            {fundingRequest?.purposeOfFunding}
          </p>
        </div>
        <div>
          <h2 className={styles.bold}>Proof of Funding</h2>
          <div className={styles.image__div}>
            <img src={fundingRequest?.proofOfFunding} alt="" />
          </div>
        </div>
        {/* */}
        {fundingRequest?.declineReason && fundingRequest?.declineReason != "" && (
          <div className="mt-5">
            <h2 className={styles.bold}>Reason for decline</h2>
            <p className="text-small mb-0" style={{ whiteSpace: "pre-wrap" }}>
              {fundingRequest?.declineReason}
            </p>
          </div>
        )}
        {admin && fundingRequest?.status == "Pending" && (
          <div className="d-flex align-items-center mt-4">
            <button
              className={styles.acceptbutton}
              onClick={() => setApproveModal(true)}
            >
              Approve
            </button>
            <button
              className={styles.deletebutton}
              onClick={() => setDeclineModal(true)}
            >
              Decline
            </button>
          </div>
        )}
      </div>
      <ApproveCampaignModal
        showModal={approveModal}
        fundingRequest={fundingRequest}
        reload={() => reload()}
        onModalClose={() => setApproveModal(false)}
      />
      <DeclineCampaignModal
        showModal={declineModal}
        organizer={campaignDetail?.organizer}
        organizerId={fundingRequest?.organizerId}
        id={fundingRequest._id}
        reload={() => reload()}
        onModalClose={() => setDeclineModal(false)}
      />
    </div>
  );
}
