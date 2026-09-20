import axios from "axios";
import React from "react";
import styled from "styled-components";
import type { GetServerSidePropsContext } from "next";

interface CharityInfo {
  charityName?: string;
}

interface CharityProps {
  charity?: CharityInfo;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const charityId = context.query.id;
  try {
    const charitydata = await axios.get<{ data?: CharityInfo }>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/charities/charity/${charityId}`,
      { timeout: 3000 }
    );
    const charity = charitydata?.data?.data || null;

    return {
      props: { charity },
    };
  } catch {
    return { props: { charity: null } };
  }
}

export default function Charity({ charity }: CharityProps) {
  return <Wrapper>This page belongs to {`${charity?.charityName}`}</Wrapper>;
}

const Wrapper = styled.main``;
