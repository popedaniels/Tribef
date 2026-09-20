import React from "react";
import styles from "./SelectionCard.module.scss";

export default function SelectionCard({
  showSelect,
  image,
  category,
  onClick,
  color,
  selected,
  empty,
  name,
}) {
  return (
    <div
      className={[
        "relative",
        empty
          ? styles.container
          : selected
          ? styles.selected
          : styles.not_selected,
      ].join(" ")}
      onClick={onClick}
      role="button"
    >
      {showSelect && (
        <div
          className="absolute rounded-circle d-flex justify-content-center align-items-center shadow"
          style={{
            backgroundColor: color,
            width: 24,
            height: 24,
            top: 10,
            right: 10,
            position: "absolute",
          }}
        >
          {selected ? (
            <img
              src="/images/icons/check.svg"
              width="12px"
              style={{ height: 10 }}
              alt="checkIcon"
            />
          ) : null}
        </div>
      )}

      <div className={styles.overlay}></div>
      <img
        src={image}
        alt=""
        width="100%"
        height="250px"
        style={{ objectFit: "cover", height: 160 }}
      />
      <div className="d-flex align-items-center pl-4" style={{ height: 58 }}>
        <p className="mb-0">{name}</p>
      </div>
    </div>
  );
}
