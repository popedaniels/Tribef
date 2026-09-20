import React from "react";
import styled from "styled-components";

export default function AdminFundingRequestsDetailsHeader() {
  return (
    <Wrapper className="d-flex">
      <div className="check mr-2" style={{ width: 20 }}></div>
      <div className="image mx-3" style={{ width: 110 }}></div>
      <div className="id mx-3" style={{ maxWidth: 150, minWidth: 150 }}>
        <p className="mb-0">Campaign Id</p>
      </div>
      <div className="title mx-3" style={{ width: 150 }}>
        <p className="mb-0">Campaign Title</p>
      </div>
      <div className="category mx-3" style={{ width: 150 }}>
        <p className="mb-0">Funding Category</p>
      </div>
      <div className="organizer mx-3" style={{ width: 150 }}>
        <p className="mb-0">Organizer</p>
      </div>
      <div className="ending mx-3" style={{ width: 110 }}>
        <p className="mb-0">Status</p>
      </div>
      <div className="raised mx-3" style={{ width: 150 }}>
        <p className="mb-0">Amount Requested</p>
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
