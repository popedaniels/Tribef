import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";
import DefaultModal from "./DefaultModal";
import { getApiBaseUrl } from "../../../../utils/api";

/**
 * "Leave a message of support" after donating. The API needs a signed-in
 * user, so the request is awaited and failures are shown — previously the
 * un-awaited promise always showed "submitted", even when nothing was saved.
 */
export default function CommentModal({ onModalClose, showModal, details }) {
  const [comment, setComment] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!comment.trim()) {
      setError("Write a short message first.");
      setState("error");
      return;
    }
    setState("sending");
    try {
      await axios.post(
        `${getApiBaseUrl()}/api/campaigns/campaign/addComment/${details?.campaignId}`,
        { newComment: { ...details, comment: comment.trim() } },
        { withCredentials: true }
      );
      setState("done");
      setTimeout(() => onModalClose(), 1800);
    } catch (err) {
      const status = err?.response?.status;
      setError(
        status === 401
          ? "Please sign in to post a message. Your donation is already complete."
          : err?.response?.data?.error || "We couldn't post your message. Please try again."
      );
      setState("error");
    }
  };

  return (
    <DefaultModal onModalClose={onModalClose} showModal={showModal}>
      <Wrapper>
        {state === "done" ? (
          <p className="done" role="status">Thanks, your message is posted on the campaign page.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id="comment-title">Leave a message of support</h2>
            <p className="hint">The organiser and other donors will see it on the campaign page.</p>
            <label htmlFor="comment" className="sr-only">Your message</label>
            <textarea
              id="comment"
              className="form-control"
              rows={4}
              maxLength={500}
              value={comment}
              aria-invalid={state === "error"}
              aria-describedby={state === "error" ? "comment-error" : undefined}
              onChange={(e) => {
                setComment(e.target.value);
                if (state === "error") setState("idle");
              }}
            />
            {state === "error" && (
              <p id="comment-error" className="error" role="alert">
                {error}
              </p>
            )}
            <div className="actions">
              <button type="button" className="ft-btn ft-btn--secondary" onClick={onModalClose}>
                Not now
              </button>
              <button type="submit" className="ft-btn ft-btn--primary" disabled={state === "sending"}>
                {state === "sending" ? "Posting…" : "Post message"}
              </button>
            </div>
          </form>
        )}
      </Wrapper>
    </DefaultModal>
  );
}

const Wrapper = styled.section`
  width: 560px;
  max-width: 92vw;
  padding: 32px;
  h2 {
    font-size: 20px !important;
    line-height: 1.3 !important;
    margin-bottom: 6px;
  }
  .hint {
    color: var(--color-text-muted);
    font-size: 14.5px;
    margin-bottom: 16px;
  }
  textarea {
    border-radius: 6px;
    font-size: 16px;
  }
  .error {
    color: #b42318;
    font-weight: 600;
    font-size: 14px;
    margin: 8px 0 0;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 16px;
  }
  .done {
    margin: 16px 0;
    font-size: 17px;
    font-weight: 600;
    color: #146c43;
    text-align: center;
  }
`;
