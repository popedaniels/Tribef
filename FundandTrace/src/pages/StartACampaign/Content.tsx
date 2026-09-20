import React, { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import StartLayout from "./StartLayout";
import { useState } from "react";
import axios from "axios";
import { cloudinaryUploadUrl } from "../../utils/cloudinary";
import { useSelector } from "react-redux";
import {
  loadStartCampaign,
  selectStartCampaignState,
  startCampaignActions,
} from "../../../store/slices/startCampaignSlice";
import { logout, selectAuthStateState } from "../../../store/slices/authSlice";
import { toast } from "../../../store/slices/ToastSlice";
import {
  selectCampaignErrorState,
  setShowCampaignError,
} from "../../../store/slices/startcampaignErrorSlice";
import styled from "styled-components";
import { useAppDispatch } from "./../../../store/hooks";
import {
  grabErrorMessage,
  grabErrorStatus,
} from "../../components/helperFunctions/helperFunctions";

export default function Content() {
  const router = useRouter();
  const { email } = router.query;
  const [story, setStory] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const dispatch = useAppDispatch();
  const [campaignId, setCampaignId] = useState("");
  const { startCampaign } = useSelector(selectStartCampaignState);
  const { authenticated } = useSelector(selectAuthStateState);
  const [campError, setCampError] = useState(false);
  const { showCampaignError } = useSelector(selectCampaignErrorState);
  const [youtubeLink, setYoutubeLink] = useState(
    startCampaign?.content?.campaignVideo.includes("youtube.com")
      ? startCampaign?.content?.campaignVideo
      : ""
  );

  useEffect(() => {
    !authenticated && router.push("/SignUp");
  }, [authenticated, router]);

  useEffect(() => {
    const storedCampaignId = localStorage.getItem("campaignId") || "";
    setCampaignId(storedCampaignId);
    dispatch(loadStartCampaign(storedCampaignId));
  }, [dispatch]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      const file = e.target.files![0];
      const formData = new FormData();
      formData.append("upload_preset", "campaignVideo");
      formData.append("file", file);
      const url = await axios.post<{ secure_url: string }>(
        cloudinaryUploadUrl("wisdomosara", "auto"),
        formData
      );
      setLoading(false);
      dispatch(
        startCampaignActions.setContent({
          campaignVideo: url.data.secure_url,
        })
      );
      previewFile(file);
    } catch (error) {
    }
  };

  const previewFile = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setSelectedFile(reader.result as string);
    };
  };

  const handleSubmit = async () => {
    try {
      let newArr: string[] = [];
      if (typeof startCampaign?.content?.story === "string") {
        const arr = /\n/g.test(startCampaign?.content?.story)
          ? startCampaign?.content?.story.split(/\n/)
          : [startCampaign?.content?.story];

        newArr = arr.filter((arrr: string) => arrr.length);
      } else {
        newArr = startCampaign?.content?.story;
      }

      let data = {
        story: newArr,
        campaignVideo: startCampaign?.content?.campaignVideo,
      };
      let startCampaignContent = { content: data, id: campaignId };

      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/startCampaign/content",
        startCampaignContent,
        { withCredentials: true }
      );
      res && router.push("/StartACampaign/Team");
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };

  const setErrorandRemoveError = useCallback(() => {
    setCampError(true);
    setTimeout(() => {
      dispatch(setShowCampaignError(false));
    }, 1500);
  }, [dispatch]);

  useEffect(() => {
    showCampaignError && setErrorandRemoveError();
  }, [showCampaignError, setErrorandRemoveError]);

  return (
    <StartLayout active={2} page={"CONTENT"}>
      <div className="mb-5">
        <h2 className="text-heading mb-4">Content</h2>
        <p className="mb-4">
          Provide more information about the campaign in order to reach a wider
          audience. Add videos, images and other information for your campaign.
        </p>
      </div>
      <div className="mb-5">
        <h2 className="text-medium mb-4">Story</h2>
        <div className="mb-4">
          <p className="mb-1">
            Why are you fundraising? Our fundraiser expert advice providing the
            following information:
          </p>
          <p
            className="mb-1 italic"
            style={{ fontSize: 14, fontStyle: "italic" }}
          >
            • Share your story.{" "}
          </p>
          <p
            className="mb-1 italic"
            style={{ fontSize: 14, fontStyle: "italic" }}
          >
            • Describe how funds will be used?
          </p>
          <p
            className="mb-1 italic"
            style={{ fontSize: 14, fontStyle: "italic" }}
          >
            • Who will benefit and impact?
          </p>
        </div>
        <textarea
          className="texta"
          name=""
          id=""
          value={startCampaign?.content?.story}
          cols={30}
          rows={10}
          style={{
            padding: 20,
            border:
              campError && !startCampaign?.content?.story
                ? "1px solid red"
                : "",
          }}
          onChange={(e) =>
            dispatch(startCampaignActions.setContent({ story: e.target.value }))
          }
        ></textarea>
      </div>
      <div className="mb-5">
        <h2 className="text-medium mb-4">Pitch Video/Image</h2>
        <div className="mb-4">
          <p className="mb-1">
            Add videos and images to convey your campaign better. Videos should
            be 2-3 minutes.
          </p>
          <p
            className="mb-1 italic"
            style={{ fontSize: 14, fontStyle: "italic" }}
          >
            • Use high-quality photo or video to help convey your story and
            built trust with donors.
          </p>
          <p
            className="mb-1 italic"
            style={{ fontSize: 14, fontStyle: "italic" }}
          >
            • Real Images reduce the gap between donors and beneficiaries.
          </p>
        </div>
        <div className="d-flex flex-column flex-md-row align-items-center w-100">
          {!startCampaign?.content?.campaignVideo?.includes("youtube.com") && (
            <div className="file d-flex align-items-center justify-content-center mr-md-1">
              <label
                className="d-flex flex-column align-items-center"
                style={{ cursor: "pointer" }}
              >
                <img
                  src="/images/icons/uploadVideo.svg"
                  alt="fundandtraceLogo"
                  width={32}
                  height={32}
                  className="mb-2"
                />
                <p className="text-blue mb-0">Upload Video</p>
                <input
                  type="file"
                  accept="video/mp4,video/x-m4v,video/*"
                  className="d-none"
                  onChange={handleSelect}
                />
              </label>
            </div>
          )}
          {!startCampaign?.content?.campaignVideo?.includes("youtube.com") && (
            <div className="mx-md-2 mt-2 mt-md-0" style={{ minWidth: 30 }}>
              <h2 className="text-medium-heading" style={{ fontSize: 18 }}>
                OR
              </h2>
            </div>
          )}
          <div className="file px-3">
            <div className="w-100 pt-4">
              <p className="mb-4">Enter Youtube link</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const embed = youtubeLink.replace("/watch?v=", "/embed/");
                  dispatch(
                    startCampaignActions.setContent({
                      campaignVideo: embed,
                    })
                  );
                }}
              >
                <input
                  type="text"
                  className="w-100 mb-3 border"
                  value={youtubeLink}
                  style={{ borderRadius: 4 }}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                />
                <button className="btn text-white">Preview</button>
              </form>
            </div>
          </div>
        </div>

        <div
          className="file mt-3 d-flex flex-column flex-md-row align-items-center"
          style={{
            height: "auto",
            border:
              campError && !startCampaign?.content?.campaignVideo
                ? "1px solid red"
                : "none",
            borderRadius: "none",
            background: "transparent",
          }}
        >
          {loading && <p className="text-blue">Uploading...</p>}
          {startCampaign?.content?.campaignVideo != "" &&
            !selectedFile &&
            (startCampaign?.content?.campaignVideo?.includes("youtube.com") ? (
              <Iframe style={{ marginBottom: 40 }}>
                <iframe
                  className="iframe"
                  src={startCampaign?.content?.campaignVideo}
                ></iframe>
              </Iframe>
            ) : (
              <video
                src={startCampaign?.content?.campaignVideo}
                autoPlay
                style={{ width: "100%", objectFit: "cover" }}
                controls
              />
            ))}
          {selectedFile && !loading && (
            <video
              src={selectedFile}
              autoPlay
              style={{ width: "100%", objectFit: "cover" }}
              controls
            />
          )}
          {startCampaign?.content?.campaignVideo && (
            <div
              role="button"
              className="d-flex align-items-center ml-4"
              onClick={() => {
                dispatch(
                  startCampaignActions.setContent({
                    campaignVideo: "",
                  })
                );
                setSelectedFile("");
                setYoutubeLink("");
              }}
            >
              <img
                src="/images/icons/deleteIcon.svg"
                alt="delete"
                width={20}
                height={20}
              />
              <p className="text-small text-danger mb-0 ml-md-3">Delete</p>
            </div>
          )}
        </div>
      </div>

      <button className="btn text-white mobileBtn-full" onClick={handleSubmit}>
        Save and Continue
      </button>
    </StartLayout>
  );
}

const Iframe = styled.div`
  min-width: 100%;
  max-width: 100%;
  .iframe {
    min-width: 100%;
    max-width: 100%;
    height: 300px;
    @media screen and (max-width: 767px) {
      width: 100%;
      height: 400px;
    }
  }
`;
