import React from "react";
import styled from "styled-components";

export default function CampaignDetailsHeader() {
  return (
    <Wrapper className="d-flex">
      <div className="check mr-2" style={{ width: 20 }}></div>
      <div className="image mx-3" style={{ width: 110 }}></div>
      <div className="id mx-3" style={{ width: 110 }}>
        <p className="mb-0">Campaign Id</p>
      </div>
      <div className="title mx-3" style={{ width: 110 }}>
        <p className="mb-0">Title</p>
      </div>
      <div className="category mx-3" style={{ width: 110 }}>
        <p className="mb-0">Category</p>
      </div>
      <div className="organizer mx-3" style={{ width: 110 }}>
        <p className="mb-0">Organizer</p>
      </div>
      <div className="ending mx-3" style={{ width: 110 }}>
        <p className="mb-0">Balance</p>
      </div>
      <div className="raised mx-3" style={{ width: 110 }}>
        <p className="mb-0">Amount Raised</p>
      </div>
      <div className="prog" style={{ width: 110 }}>
        <p className="mb-0">Progress</p>
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
