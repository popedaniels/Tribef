import DomPortal from "../../Domportal/DomPortal";
import classNames from "classnames";
import styles from "./DefaultModal.module.scss";

const DefaultModal = ({ onModalClose, children, showModal, variant = undefined }) => {
  const modalContentClasses = classNames(
    styles["cr-modal-content"],
    showModal && variant == "large"
      ? styles["cr-modal-showLarge"]
      : showModal && variant != "large"
      ? styles["cr-modal-show"]
      : styles["cr-modal-hide"]
  );

  return (
    <DomPortal>
      <section
        className={modalContentClasses}
        style={{
          width: variant === "large" ? "100%" : "",
          top: variant == "large" ? 75 : "50%",
        }}
      >
        <section>{children}</section>
      </section>

      <div
        className={classNames(styles["cr-modal-backdrop"])}
        onClick={() => onModalClose()}
        style={{
          display: showModal ? "flex" : "none",
          top: variant == "large" ? "90px" : 0,
        }}
      />
    </DomPortal>
  );
};

export default DefaultModal;
