import React from "react";
import styled from "styled-components";

const RefundsDetailsHeader = ({ single }) => {
  return (
    <Wrapper className="d-flex">
      <div className="id mr-3" style={{ width: 150 }}>
        <p className="mb-0 text-left">Campaign Id</p>
      </div>
      <div className="title mr-3" style={{ width: 150 }}>
        <p className="mb-0 text-left">Title</p>
      </div>

      <div className="organizer mr-3" style={{ width: 150 }}>
        <p className="mb-0 text-left">Payment Method</p>
      </div>
      <div className="ending mr-3" style={{ width: 200 }}>
        <p className="mb-0 text-left">Date</p>
      </div>
      <div className="raised mr-3" style={{ width: 110 }}>
        <p className="mb-0 text-left">{single ? "Donation" : "Balance"}</p>
      </div>
      <div className="prog mr-3" style={{ width: 110 }}>
        <p className="mb-0 text-left">Status</p>
      </div>
      <div className="category" style={{ width: 200 }}>
        <p className="mb-0 text-left">Action</p>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.article`
  width: 100%;
  padding: 22px 25px;
  background: rgba(0, 0, 0, 0.01);
  border-radius: 4px 4px 0 0;
  p {
    color: #998a8a;
    font-size: 14px;
  }
  div {
    box-sizing: border-box;
  }
`;

export default RefundsDetailsHeader;
