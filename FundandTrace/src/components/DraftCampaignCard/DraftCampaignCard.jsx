import Image from "next/image";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../../store/slices/authSlice";
import { toast } from "../../../store/slices/ToastSlice";
import { grabErrorStatus } from "../helperFunctions/helperFunctions";
import styles from "./DraftCampaignCard.module.scss";

export default function DraftCampaignCard({ campaign, reload }) {
  const dispatch = useDispatch();

  const handleDelete = async () => {
    try {
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/draft/delete/${campaign?._id}`,
        { withCredentials: true }
      );
      res && dispatch(toast(true, res?.data?.data, "success"));
      res && reload();
    } catch (error) {
      dispatch(toast(true, error?.response?.data?.error));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };

  const router = useRouter();

  return (
    <a
      style={{ textDecoration: "none" }}
      href={`/StartACampaign/BasicInformation`}
      onClick={(e) => {
        localStorage.setItem("campaignId", campaign?._id);
      }}
      role="button"
    >
      <div className={[styles.container, "d-flex w-100 flex-column"].join(" ")}>
        <div
          style={{
            background: "#F2F2F2",
            borderRadius: "4px 4px 0 0",
            width: "100%",
            height: 166,
          }}
          className="d-flex align-items-center justify-content-center"
        >
          <Image
            className={styles.card_img}
            src="/images/draftImage.png"
            alt="campaign"
            width={100}
            height={77}
            style={{ objectFit: "contain" }}
          />
        </div>

        <div className="px-4 py-4">
          <div className="mt-1">
            <h3 className="text-medium mb-4 text-truncate">
              {campaign?.basicInformation?.campaignTitle
                ? campaign?.basicInformation?.campaignTitle
                : "My Campaign Title"}
            </h3>

            <div className="d-flex align-items-center">
              <div className="d-flex align-items-center mr-3">
                <img
                  src="/images/icons/editBlue.svg"
                  alt="time"
                  width="17.5px"
                  height="17.5px"
                  className="mr-2"
                />
                <p className="mb-0" style={{ color: "var(--color-primary)" }}>
                  Edit
                </p>
              </div>
              <div
                className="d-flex align-items-center"
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
              >
                <a className="mb-0" style={{ color: "#FF5050" }}>
                  Delete
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
