import React, { useState } from "react";
import styled from "styled-components";

interface HelpDropdownProps {
  title: string;
  children: React.ReactNode;
}

export default function HelpDropdown({ title, children }: HelpDropdownProps) {
  const [showDrop, setShowDrop] = useState(false);
  return (
    <Wrapper
      className="mb-4 border-bottom pb-3"
      style={{ borderColor: showDrop ? "black" : "" }}
    >
      <div
        className="d-flex align-items-center justify-content-between"
        role="button"
        onClick={() => setShowDrop(!showDrop)}
      >
        <p className="mb-0">{title}</p>
        <img
          src="/images/icons/dropdown.svg"
          alt="dropdown icon"
          width="13px"
          height="8px"
          style={{
            transform: showDrop ? "rotate(180deg)" : "",
            transition: "transform 0.3s ease",
          }}
        />
      </div>
      <div className={`${showDrop ? "show shadow" : "close"}`}>{children}</div>
    </Wrapper>
  );
}

const Wrapper = styled.article`
  .show {
    height: 100%;
    padding: 20px 15px;
    transition: height 0.3s ease;
    background: #f9f9f9;
    border-radius: 4px;
    margin-top: 20px;
  }
  .close {
    height: 0px;
    max-height: 0px;
    overflow-y: hidden;
    transition: height 0.3s ease;
  }
`;
