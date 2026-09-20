import React from "react";
import { getTimeDiff } from "../helperFunctions/helperFunctions";

export default function CommentComponent({ comment }) {
  return (
    <div className="comment d-flex mb-4">
      <div
        className="d-flex align-items-center justify-content-center mr-3"
        style={{
          minWidth: 50,
          height: 50,
          borderRadius: "50%",
          background: "#F0F0F0",
          color: "#A0A2AF",
          opacity: 0.9,
        }}
      >
        {comment?.name?.split(" ")?.length > 1
          ? `${comment?.name.split(" ")[0]?.charAt(0)}${comment?.name
              ?.split(" ")[1]
              ?.charAt(0)}`
          : `${comment?.name[0]}${comment?.name[1]}`}
      </div>
      <div>
        <div className="d-flex mb-2 align-items-center">
          <p className="mb-0 mr-2" style={{ fontWeight: 500 }}>
            {comment.name}
          </p>
          <p
            className="mb-0"
            style={{
              fontWeight: 400,
              opacity: 0.9,
              fontSize: 14,
            }}
          >
            {getTimeDiff(comment?.time)}
          </p>
        </div>
        <p
          className="mb-0"
          style={{
            fontWeight: 300,

            opacity: 0.9,
          }}
        >
          {comment?.comment}
        </p>
      </div>
    </div>
  );
}
