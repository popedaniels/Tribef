import React, { useState, useEffect } from "react";

import StartLayout from "./StartLayout";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  loadStartCampaign,
  selectStartCampaignState,
  startCampaignActions,
} from "../../../store/slices/startCampaignSlice";
import { useRouter } from "next/router";
import axios from "axios";
import { logout, selectAuthStateState } from "../../../store/slices/authSlice";
import { toast } from "../../../store/slices/ToastSlice";
import { useAppDispatch } from "./../../../store/hooks";
import {
  grabErrorMessage,
  grabErrorStatus,
} from "../../components/helperFunctions/helperFunctions";

export default function Content() {
  const dispatch = useAppDispatch();
  const { startCampaign } = useSelector(selectStartCampaignState);
  const [campaignId, setCampaignId] = useState("");
  const router = useRouter();

  const { authenticated } = useSelector(selectAuthStateState);

  useEffect(() => {
    !authenticated && router.push("/SignUp");
  }, [authenticated, router]);

  useEffect(() => {
    const storedCampaignId = localStorage.getItem("campaignId") || "";
    setCampaignId(storedCampaignId);
    dispatch(loadStartCampaign(storedCampaignId));
  }, [dispatch]);

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/startCampaign/settings",
        { settings: startCampaign?.settings, id: campaignId },
        { withCredentials: true }
      );

      res && router.push("/StartACampaign/Prelaunch");
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };

  return (
    <StartLayout active={5} page={"SETTINGS"} handle={handleSubmit}>
      <div className="mb-5">
        <h2 className="text-heading mb-4">Campaign Settings</h2>
        <p className="mb-4">
          We provide additional features for you that can help bolster your
          campaign. Configure the optional campaign settings below.
        </p>
      </div>
      <div className="mb-5">
        <h2 className="text-medium mb-4">Post Funding</h2>

        <div className="mb-4 d-flex">
          <input
            type="radio"
            name="postfunding"
            id="postfunding1"
            value={startCampaign?.settings?.postFunding ? "true" : "false"}
            checked={startCampaign?.settings?.postFunding ? true : false}
            onChange={() =>
              dispatch(startCampaignActions.setSettings({ postFunding: true }))
            }
          />
          <label className="d-inline" htmlFor="postfunding1">
            Keep on raising funds even after campaign ends
          </label>
        </div>
        <div className="mb-4 d-flex">
          <input
            type="radio"
            name="postfunding"
            id="postfunding2"
            value={startCampaign?.settings?.postFunding ? "false" : "true"}
            checked={startCampaign?.settings?.postFunding ? false : true}
            onChange={() =>
              dispatch(startCampaignActions.setSettings({ postFunding: false }))
            }
          />
          <label className="d-inline" htmlFor="postfunding2">
            Don’t receive funds after campaign ends
          </label>
        </div>
      </div>
      <div className="mb-5">
        <h2 className="text-medium mb-4">Updates</h2>

        <div className="mb-4 d-flex">
          <input
            type="radio"
            name="updates"
            id="updates1"
            value={startCampaign?.settings?.publicUpdates ? "true" : "false"}
            checked={startCampaign?.settings?.publicUpdates ? true : false}
            onChange={() =>
              dispatch(
                startCampaignActions.setSettings({ publicUpdates: true })
              )
            }
          />
          <label className="d-inline" htmlFor="updates1">
            Allow sending updates of the campaign to the public when raising
            funds
          </label>
        </div>
        <div className="mb-4 d-flex">
          <input
            type="radio"
            name="updates"
            id="updates2"
            value={startCampaign?.settings?.publicUpdates ? "false" : "true"}
            checked={startCampaign?.settings?.publicUpdates ? false : true}
            onChange={() =>
              dispatch(
                startCampaignActions.setSettings({ publicUpdates: false })
              )
            }
          />
          <label className="d-inline" htmlFor="updates2">
            Don’t allow sending updates of the campaign to the public when
            raising funds
          </label>
        </div>
      </div>

      <button className="btn text-white mobileBtn-full" onClick={handleSubmit}>
        Review and Launch!
      </button>
    </StartLayout>
  );
}
