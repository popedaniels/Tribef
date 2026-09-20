import { useState } from "react";
import styles from "./DisbursementCard.module.scss";

export default function DisbursementCard({ disbursement, last }) {
  const [showDropdown, setShowDropdown] = useState(false);

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
          src={`/images/icons/approved.svg`}
          width="20"
          height="20"
          alt="PaymentHistoryIcon"
        />
      </div>

      <div
        className="pb-2 pl-2 pl-md-0"
        role="button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="d-flex flex-wrap align-items-start justify-content-between">
          <div>
            <div className="mb-3">
              <h2 className={styles.bold}>
                {disbursement?.amount} {disbursement?.currency}
              </h2>
              <p className="text-small mb-0">
                {new Date(disbursement?.dateDisbursed).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="align-items-center d-flex">
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
        <div className="mb-4">
          <h2 className="text-medium">Beneficiary information</h2>
          <p className="text-small mb-3" style={{ whiteSpace: "pre-wrap" }}>
            Bank Name: <b>{disbursement?.bankName}</b>
          </p>
          <p className="text-small mb-3" style={{ whiteSpace: "pre-wrap" }}>
            Account Name: <b>{disbursement?.accountName}</b>
          </p>
          <p className="text-small mb-3" style={{ whiteSpace: "pre-wrap" }}>
            Account Number: <b>{disbursement?.accountNumber}</b>
          </p>
          <img
            src={disbursement?.receipt}
            alt="receipt"
            width="200px"
            height="100%"
          />
        </div>

        {/* */}
      </div>
    </div>
  );
}
