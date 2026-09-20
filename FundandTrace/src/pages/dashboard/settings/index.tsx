import React from "react";
import DashboardLayout from "../DashboardLayout";
import styled from "styled-components";
import Link from "next/link";
import SettingsComp from "../../../components/SettingsComp";

export default function Settings() {
  return (
    <DashboardLayout active={4} page="Settings">
      <section className="custom-container">
        <Wrapper className="d-flex flex-column mt-5 align-items-center">
          <h2 className="text-heading mb-5">Settings</h2>
          <SettingsComp />
        </Wrapper>
      </section>
    </DashboardLayout>
  );
}

const Wrapper = styled.div``;
