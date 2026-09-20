import Link from "next/link";
import React from "react";
import styled from "styled-components";

export default function AdminUsersDetailCard({ user, count, index }) {
  return (
    <Wrapper
      className="d-flex"
      style={{
        cursor: "pointer",
        background: index % 2 == 0 ? "#f9f9f9" : "white",
      }}
    >
      <div className="check mr-2" style={{ width: 20 }}>
        <input type="checkbox" name="campaign" id="campaign" />
      </div>
      <Link href={`/admin/users/${user?._id}`} passHref>
        <div className="d-flex align-items-center">
          <div className="id mx-3" style={{ width: 140 }}>
            <p className="mb-0">{user?.firstName}</p>
          </div>
          <div className="title mx-3" style={{ width: 140 }}>
            <p className="mb-0">{user?.lastName}</p>
          </div>
          <div className="category mx-3" style={{ width: 240 }}>
            <p className="mb-0">{user?.email}</p>
          </div>
          <div className="organizer mx-3" style={{ width: 140 }}>
            <p className="mb-0">
              {user?.code}
              {user?.phone}
            </p>
          </div>
          <div className="ending mx-3" style={{ width: 140 }}>
            <p className="mb-0">{user?.country}</p>
          </div>

          <div className="prog" style={{ width: 100 }}>
            <p className="mb-0">{count}</p>
          </div>
        </div>
      </Link>
    </Wrapper>
  );
}

const Wrapper = styled.article`
min-width: 100%;
max-width: 100%;
  padding: 22px 25px;
  background: rgba(0, 0, 0, 0.01);
  border-radius: 4px 4px 0 0;
  div {
      word-break: break-word
  }

  p {
    w
    color: #998a8a;
    font-size: 14px;
  }
`;
