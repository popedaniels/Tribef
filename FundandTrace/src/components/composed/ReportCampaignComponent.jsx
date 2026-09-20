import axios from "axios";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { toast } from "../../../store/slices/ToastSlice";
import { uploadImage } from "../helperFunctions/helperFunctions";
import SelectComponent from "./SelectComponent";

export default function ReportCampaignComponent({ submitted }) {
  const [value, setValue] = useState("");
  const values = [
    "The campaign encourages illicit action",
    "The campaign may be misleading",
    "The owner of the campaign isn't who it says",
  ];
  const dispatch = useDispatch();
  const [evidence, setEvidence] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    fullName: "",
    message: "",
  });

  const handleSubmit = async () => {
    const report = { ...reportData, evidence, subject: value };
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports`,
        { report }
      );
      res && dispatch(toast(true, "Report sent!", "success"));
      submitted();
    } catch (error) {
      dispatch(
        toast(
          true,
          error?.response?.data?.error || "Unable to send the report. Please try again.",
          "error"
        )
      );
    }
  };

  const handleSelect = async (e) => {
    try {
      setLoading(true);
      const file = e.target.files[0];
      const res = await uploadImage(file);

      res && setEvidence(res?.url.data.secure_url);

      setLoading(false);
      res && setSelectedFile(res?.file);
    } catch (error) {
      setLoading(false);
      dispatch(toast(true, "Unable to upload evidence. Please try again.", "error"));
    }
  };

  return (
    <Wrapper id="report">
      <h3 className="text-heading mb-4">Report this campaign</h3>
      <p className="mb-2">
        Our community is brilliant to warn us if a project does not follow our
        guidelines. Please choose one of the three reasons below and provide
        your reasoning when you think the <b>“You Campaign Title” </b> should be
        notified to us.
      </p>
      <ul className="mb-4">
        <li className="mb-3">
          The campaign encourages illicit action - it shows that the project
          concerns illegal activity or criminal inquiry, for example.
        </li>
        <li className="mb-3">
          {" "}
          The campaign may be misleading — you have evidence that the project is
          false, for example.
        </li>
        <li className="mb-3">
          The owner of the campaign isn't who it says — you have evidence that
          the owner of the project is false.
        </li>
      </ul>
      <p className="mb-5">
        If you have any other form of enquiry, fill the form below and our
        amazing Customer Happiness team will get back to you as soon as
        possible!
      </p>
      <div className="mb-5">
        <label htmlFor="name" className="mb-3">
          Your Name
        </label>
        <br />
        <input
          type="text"
          id="name"
          onChange={(e) =>
            setReportData({ ...reportData, fullName: e.target.value })
          }
        />
      </div>
      <div className="mb-5">
        <label htmlFor="name" className="mb-3">
          Subject
        </label>
        <br />
        <SelectComponent
          values={values}
          value={value}
          placeholder="Select.."
          handleSelect={(value) => setValue(value)}
        />
      </div>
      <div className="mb-5">
        <label htmlFor="message" className="mb-3">
          Message
        </label>
        <br />
        <textarea
          name="message"
          id="message"
          cols="30"
          rows="10"
          onChange={(e) =>
            setReportData({ ...reportData, message: e.target.value })
          }
        ></textarea>
      </div>
      <label htmlFor="image">Upload Evidence</label>
      {evidence == "" && !selectedFile && (
        <div className="file d-flex align-items-center justify-content-center">
          <label
            className="d-flex flex-column align-items-center"
            style={{ cursor: "pointer" }}
            htmlFor="pic"
          >
            <img
              src="/images/icons/uploadImage.svg"
              alt="fundandtraceLogo"
              width={32}
              height={32}
              className="mb-2"
            />
            <p className="text-blue mb-0">Upload Image</p>
            <input
              type="file"
              className="d-none"
              name="pic"
              id="pic"
              accept="image/*"
              onChange={handleSelect}
            />
          </label>
        </div>
      )}
      <div className="d-flex align-items-md-center flex-column flex-md-row mb-4">
        <div
          className="file mt-3"
          style={{
            height: "auto",
            border: "none",
            borderRadius: "none",
            background: "transparent",
          }}
        >
          {loading && <p className="text-blue">Uploading...</p>}

          {evidence != "" && !selectedFile ? (
            <img
              src={evidence}
              alt="image"
              style={{ width: "100%", objectFit: "cover", maxHeight: 200 }}
            />
          ) : (
            selectedFile && (
              <img
                src={selectedFile}
                alt="image"
                style={{ width: "100%", objectFit: "cover", maxHeight: 200 }}
              />
            )
          )}
        </div>
        {evidence != "" && (
          <div className="ml-0 ml-md-4 mt-4 mt-md-0">
            <div
              role="button"
              className="d-flex align-items-center"
              onClick={() => {
                setEvidence("");
                setSelectedFile("");
              }}
            >
              <img
                src="/images/icons/deleteIcon.svg"
                alt="delete"
                width={20}
                height={20}
              />
              <p className="text-small text-danger mb-0 ml-3">Delete</p>
            </div>
            <label className="d-flex align-items-center mt-3" htmlFor="pic">
              <img
                src="/images/icons/uploadImage.svg"
                alt="fundandtraceLogo"
                width={20}
                height={20}
                className=""
              />
              <p className="text-small text-blue mb-0 ml-3">Upload Image</p>
              <input
                type="file"
                className="d-none"
                accept="image/*"
                name="pic"
                id="pic"
                onChange={handleSelect}
              />
            </label>
          </div>
        )}
      </div>
      <button className="submit btn" onClick={handleSubmit}>
        Report this campaign
      </button>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  max-width: 600px;
  input {
    height: 50px;
  }
  label {
    font-weight: 500;
  }
  input,
  textarea {
    padding: 20px;
    width: 100%;
    background: #ffffff;
    border: 0.5px solid #c4c4c4;
    box-sizing: border-box;
    border-radius: 4px;
  }
  .submit {
    color: white;
    width: 293px;
    height: 54px;
    @media screen and (max-width: 767px) {
      width: 100%;
    }
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
  }
  .file {
    max-width: 400px;
    width: 100%;
    height: 200px;
    background: #fafafa;
    border: 0.5px dashed #c4c4c4;
    box-sizing: border-box;
    border-radius: 4px;
    input {
      background: transparent !important;
      border-style: none;
      box-shadow: 0px 2px 2px rgba(50, 50, 71, 0.06);
      width: 100px;
    }
  }
`;
