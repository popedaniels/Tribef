import React from "react";
import styled from "styled-components";

export default function AdminUsersHeader() {
  return (
    <Wrapper className="d-flex">
      <div className="check mr-2" style={{ width: 20 }}></div>
      <div className="d-flex align-items-center">
        <div className="id mx-3" style={{ width: 140 }}>
          <p className="mb-0">First Name</p>
        </div>
        <div className="title mx-3" style={{ width: 140 }}>
          <p className="mb-0">Last Name</p>
        </div>
        <div className="category mx-3" style={{ width: 240 }}>
          <p className="mb-0">Email Address</p>
        </div>
        <div className="organizer mx-3" style={{ width: 140 }}>
          <p className="mb-0">Phone No.</p>
        </div>
        <div className="ending mx-3" style={{ width: 140 }}>
          <p className="mb-0">Country</p>
        </div>

        <div className="prog" style={{ width: 100 }}>
          <p className="mb-0">Campaigns</p>
        </div>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.article`
  width: 100%;
  padding: 22px 25px;
  background: rgba(0, 0, 0, 0.01);
  border-radius: 4px 4px 0 0;
  p {
    color: #998a8a;
    font-size: 14px;
  }
`;
