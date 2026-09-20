import React from "react";
import DefaultModal from "./DefaultModal";
import styled from "styled-components";
import { useState } from "react";

export default function TermsModal({
  onModalClose,
  showModal,
  setAgree,
  sendEmail,
  setSendEmail,
}) {
  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
    >
      <Wrapper className="d-flex flex-column justify-content-center align-items-center p-3 p-md-5">
        <div
          className="d-flex align-items-center justify-content-between mb-3 w-100 bg-white pb-3"
          style={{ position: "sticky", top: 0, height: "50px", zIndex: 1000 }}
        >
          <h2 className="text-medium-heading mb-0">Terms of Service</h2>
          <p
            onClick={onModalClose}
            className="mb-0"
            style={{ fontWeight: 500, cursor: "pointer" }}
            role="button"
          >
            X
          </p>
        </div>
        <div className="d-flex flex-wrap socials">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
            commodo, ultrices enim augue pulvinar elit pretium. Interdum ut eget
            feugiat non felis eu fringilla. Vulputate vitae tellus elit sed leo
            urna. Ut amet, nunc sit malesuada morbi. Sagittis, venenatis gravida
            massa lorem sit sed. Donec aliquam blandit ut aliquam ut. Diam vel
            massa, enim, sed vulputate ipsum habitant ut diam. Eu cursus risus,
            vivamus habitasse ultrices scelerisque elementum. Mollis integer leo
            aliquam, non sodales sit. Urna nunc sed semper scelerisque
            consectetur. Ullamcorper ultrices molestie lacus urna sollicitudin
            fames fringilla diam. Rutrum nibh molestie purus et. Auctor sit mi
            duis purus sit id. Pharetra auctor aliquet senectus ultrices eget
            volutpat et id. Sed lobortis libero, habitant in netus tortor,
            libero aliquam. In id ut ultricies ultricies imperdiet lectus ut
            bibendum. Varius viverra nec cursus tempus arcu in amet. Commodo
            tortor nibh euismod a pulvinar mi mattis urna pretium. Tellus
            porttitor imperdiet tellus vestibulum orci. Turpis vitae ultricies
            at tempor laoreet ut diam, sed lectus. Ultricies sit in ut amet
            risus. Gravida at fringilla convallis{" "}
          </p>
        </div>
        <div className="d-flex justify-content-between align-items-center w-100 mt-4">
          <div className="d-flex">
            <input
              type="checkbox"
              name="sendEmail"
              id="sendEmail"
              className="mr-3 mt-1"
              checked={sendEmail}
              onChange={setSendEmail}
            />
            <label htmlFor="sendEmail" className="mb-0">
              <span
                style={{
                  color: "var(--color-primary)",

                  cursor: "pointer",
                }}
                className="mb-0"
              >
                Send copy to my email
              </span>
            </label>
          </div>
          <button
            className="btn shareBtn"
            onClick={() => {
              setAgree();
              onModalClose();
            }}
          >
            I AGREE
          </button>
        </div>
      </Wrapper>
    </DefaultModal>
  );
}

const Wrapper = styled.section`
  width: 619px;
  @media screen and (max-width: 767px) {
    width: 90vw;
    padding: 50px 20px;
  }
  padding: 50px 0;
  h2 {
    width: 300px;
    @media screen and (max-width: 767px) {
      width: 100%;
    }
  }

  .socials {
    height: 280px;
    overflow-y: scroll;
  }

  .shareBtn {
    background: var(--color-primary);
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    color: white;
    padding: 15px 30px;
  }

  a {
    text-decoration: none;
  }
`;
