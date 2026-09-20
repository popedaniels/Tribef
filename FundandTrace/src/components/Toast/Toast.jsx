import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectToastState, toast } from "../../../store/slices/ToastSlice";
import DomPortal from "../composed/Domportal/DomPortal";
import styles from "./Toast.module.scss";

export default function Toast() {
  const { showToast } = useSelector(selectToastState);
  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setTimeout(() => {
      dispatch(toast(false, ""));
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [showToast, dispatch]);

  return (
    <>
      <DomPortal>
        <div
          className={[
            `${showToast?.show && styles.show} shadow ${
              showToast?.type == "success" ? "bg-success" : "bg-danger"
            }`,
            styles.toast,
          ].join(" ")}
        >
          <p className="mb-0 text-center">{showToast.text}</p>
        </div>
      </DomPortal>
    </>
  );
}
