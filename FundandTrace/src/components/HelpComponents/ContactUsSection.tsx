import Link from "next/link";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import styled from "styled-components";

export default function ContactUsSection() {
  const { authenticated } = useSelector(selectAuthStateState);
  return (
    <Wrapper>
      <div className="custom-container d-flex align-items-center justify-content-center flex-column">
        <h1 className="text-heading mb-4">Still can’t find what you need?</h1>
        <Link href="/contact" passHref>
          <a>
            <button
              className={[
                "d-flex align-items-center justify-content-center px-3 py-2 text-white btn rounded",
              ].join(" ")}
            >
              <p className="mb-0">Contact Support</p>
            </button>
          </a>
        </Link>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  background: #f0f1fe;
  padding: 83px 0 83px 0;
  margin-top: 80px;
  button {
    background: var(--color-primary);
    height: 54px;
    box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
      0px 2px 2px rgba(50, 50, 71, 0.06);
    border-radius: 4px;
    &:hover {
      box-shadow: 0px 12px 12px rgba(50, 50, 71, 0.08),
        0px 16px 24px rgba(50, 50, 71, 0.08);
    }
    p {
      color: white !important;
    }
  }
`;
