import React from "react";
import styled from "styled-components";
import CommentComponent from "./CommentComponent";

export default function CampaignStoriesComponent({ campaign }) {
  return (
    <Wrapper>
      {campaign?.content?.campaignVideo && (
        <div style={{ position: "relative", marginBottom: 30 }}>
          {campaign?.content?.campaignVideo?.includes("youtube.com") ? (
            <Iframe style={{ marginBottom: 40 }}>
              <iframe
                className="iframe"
                src={campaign?.content?.campaignVideo}
              ></iframe>
            </Iframe>
          ) : (
            <video
              src={campaign?.content?.campaignVideo}
              alt="video"
              style={{
                width: "100%",
                objectFit: "cover",
                height: 450,
              }}
              controls
            />
          )}
        </div>
      )}
      {campaign?.content?.story?.map((para, i) => (
        <p
          className="mb-4"
          key={i}
          style={{
            whiteSpace: "pre-wrap",
          }}
        >
          {para}
        </p>
      ))}
      {campaign?.comments?.length ? (
        <div className="comments mt-5 mb-3">
          <h2 className="text-heading">
            Comments ({campaign?.comments?.length})
          </h2>
          {campaign?.comments.map((comment, i) => (
            <CommentComponent key={i} comment={comment} />
          ))}
        </div>
      ) : (
        <h2 className="text-heading">No comments yet!</h2>
      )}
    </Wrapper>
  );
}

const Iframe = styled.div`
  min-width: 100%;
  max-width: 100%;
  .iframe {
    min-width: 100%;
    max-width: 100%;
    height: 500px;
    @media screen and (max-width: 767px) {
      width: 100%;
      height: 400px;
    }
  }
`;

const Wrapper = styled.section``;
