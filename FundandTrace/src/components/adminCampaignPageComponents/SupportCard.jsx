import dayjs from "dayjs";
import React from "react";
import styled from "styled-components";

export default function SupportCard({ support, setSupport }) {
  return (
    <Wrapper
      className="d-flex align-items-start pt-3 pl-3 pb-3 border-top"
      role="button"
      onClick={() => setSupport(support)}
    >
      <img src="/images/larry.jpg" alt="sender's image" className="pt-1" />
      <div className="d-flex flex-column ml-3" style={{ width: "78%" }}>
        <div className="d-flex align-items-center justify-content-between mb-2 w-100">
          <h4 className="mb-0 text-truncate">{support?.fullName}</h4>
          <p className="mb-0">{dayjs(support.submittedAt).format("hh:mma")}</p>
        </div>
        <h5
          className="mb-2 text-truncate w-100"
          style={{
            width: "100%",
            wordBreak: "break-word",
            wordWrap: "break-word",
          }}
        >
          {support?.subject}
        </h5>
        <p
          className="mb-0 text-truncate w-100"
          style={{
            width: "100%",
            wordBreak: "break-word",
            wordWrap: "break-word",
          }}
        >
          {support?.message}
        </p>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.article`
  width: 350px;
  &:hover {
    background: #f0f1fe;
  }

  word-break: break-word;
  word-wrap: break-word;
  img {
    border-radius: 50%;
    width: 40px;
  }
  h5 {
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 30px;
    color: #514949;
    word-break: break-word;
    word-wrap: break-word;
  }
  h4 {
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 30px;
    color: #514949;
    word-break: break-word;
    word-wrap: break-word;
  }
  p {
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 30px;
    color: #a3a3a3;
    word-break: break-word;
    word-wrap: break-word;
  }
`;
