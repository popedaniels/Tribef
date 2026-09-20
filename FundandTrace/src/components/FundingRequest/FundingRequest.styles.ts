import styled from "styled-components";

export const Custom = styled.div`
  padding: 0 50px;
  @media screen and (max-width: 767px) {
    padding: 0 15px 0 30px;
  }
`;

export const Div = styled.div`
  width: 100%;
  max-width: 409px;
  justify-content: space-between;
  .btn1 {
    width: 47%;
    padding: 0;
    height: 50px;
  }
  .btn2 {
    width: 47%;
    padding: 0;
    height: 50px;
  }
`;

export const Wrapper = styled.div`
  width: 100%;
  padding-right: 18% !important;
  @media screen and (max-width: 1100px) {
    width: 100%;
    padding-right: 0 !important;
  }

  @media screen and (max-width: 767px) {
    padding-right: 0 !important;
  }
  .bluebtn {
    @media screen and (max-width: 767px) {
      width: 100% !important;
    }
  }
  input::placeholder {
    font-style: normal;
    font-weight: 300;
    font-size: 14px;
    line-height: 24px;
    color: #b3b3b3;
    opacity: 0.9;
  }
  .whitebtn {
    border: 0.7px solid var(--color-primary);
    box-sizing: border-box;
    border-radius: 4px;
    color: var(--color-primary);
  }
  article {
    .thirdparty {
      .thirdinput {
        width: 46%;
        @media screen and (max-width: 767px) {
          width: 100%;
        }
        input {
          width: 100%;
          margin-bottom: 40px;
          background: white;
          border: none;
          box-sizing: border-box;
          border-radius: 4px;
          height: 50px;
        }
      }
    }
  }
`;

export const Main = styled.div`
  margin-top: 50px;
  justify-content: space-between;
  @media screen and (min-width: 1090px) {
    flex-direction: row;
  }
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  .debitCard {
    width: max-content;
    min-width: 60%;
    margin-bottom: 30px;
    width: @media screen and (max-width: 767px) {
      width: 100%;
    }
    background: #f0f1fe;
    border: 0.5px solid var(--color-primary);
    box-sizing: border-box;
    border-radius: 4px;
    @media screen and (min-width: 1090px) {
      // margin-right: 76px;
    }
    .text-xs {
      font-style: normal;
      font-weight: 400;
      font-size: 12px;
      line-height: 14px;

      color: #514949;
    }
    .text-bigger {
      font-style: normal;
      font-weight: 500;
      font-size: 32px;
      line-height: 38px;
      /* identical to box height */

      color: var(--color-primary);
    }
    .text-donations {
      font-style: normal;
      font-weight: 500;
      font-size: 14px;
      line-height: 17px;
      /* identical to box height */

      color: #514949;
    }
    .text-blur {
      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 17px;
      /* identical to box height */

      color: #a0a2af;
    }
  }
  .idCard {
    width: 300px;
    margin-bottom: 30px;
    img {
      height: 100%;
      max-height: 200px;
      width: 100%;
      @media screen and (max-width: 767px) {
        height: 100%;
      }
    }
    @media screen and (max-width: 767px) {
      width: 100%;
      max-width: 430px;
    }

    box-sizing: border-box;
  }
`;
