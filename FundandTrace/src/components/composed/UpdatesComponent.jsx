import React from "react";
import styled from "styled-components";
import { apiUrl } from "../../utils/evidence";

export default function UpdateComponent({ update }) {
  return (
    <Wrapper className="mb-4">
      <div
        className="d-flex align-items-baseline pb-1 mb-2 heading"
        style={{
          width: "max-content",
        }}
      >
        <h2 className="text-heading-medium mb-0 mr-2">
          {new Date(update?.datePosted).toDateString()},{" "}
          <span className="mb-0"> posted by {update?.addedBy}(Organizer)</span>
        </h2>
      </div>

      {update?.evidenceSessionId && <span className="ft-chip ft-chip--ok mb-2">⛨ Captured live · sealed</span>}
      {update?.story && <p>{update.story}</p>}
      {update?.image && <img src={apiUrl(update.image)} alt={update?.story ? `Update: ${update.story.slice(0, 80)}` : "Update photo"} loading="lazy" />}
      {update?.video && <video src={apiUrl(update.video)} controls playsInline preload="metadata" />}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 0 !important;
  width: 100%;
  .heading {
    width: max-content;
    max-width: 100%;
    h2 {
      font-size: 17px;
      word-break: break-word;
    }
    span {
      font-weight: 400;
      font-size: 15px;
    }
  }
  p {
    font-size: 16px;
    font-weight: 400;
    color: black;
  }

  img,
  video {
    display: block;
    width: 100%;
    max-width: 360px;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: 10px;
    margin-bottom: 20px;
    background: #0f1419;
  }
`;
