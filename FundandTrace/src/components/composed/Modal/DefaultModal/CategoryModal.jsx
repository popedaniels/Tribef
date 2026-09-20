import React from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";

export default function CategoryModal({
  onModalClose,
  showModal,
  category,
  type,
  categoryText = "",
}) {
  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column justify-content-center align-items-center position-relative">
        {" "}
        <h6 className="mb-3 text-center">Your selection</h6>
        <h4 className="mb-3 text-center text-uppercase">{type}</h4>
        <h2 className="mb-3 text-center text-uppercase">{category}</h2>
        <p className="mb-3 text-center">
          This category entails campaigns that are tagreted at medical needs -
          surgery, cancer, etc. Click the button below to begin
        </p>
        <button className="btn text-white" onClick={() => onModalClose()}>
          Start
        </button>
      </Wrapper>
    </DefaultModal>
  );
}

const Wrapper = styled.section`
  width: 500px;
  @media screen and (max-width: 767px) {
    width: 90vw;
    max-width: 564px;
    padding: 30px 20px 30px 20px;
  }
  padding: 30px 50px 40px 50px;
  h4 {
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 28px;
    /* identical to box height, or 175% */

    color: var(--color-primary);

    opacity: 0.9;
  }
  h2 {
    font-style: normal;
    font-weight: bold;
    font-size: 18px;
    line-height: 28px;
    /* identical to box height, or 156% */

    color: #514949;
  }
  h6 {
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 28px;
    color: black;
  }

  p {
    font-style: normal;
    font-weight: 300;
    font-size: 16px;
    line-height: 24px;
    text-align: center;

    color: black;

    opacity: 0.9;
  }
  button {
    padding: 15px 30px;
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
  }
`;
