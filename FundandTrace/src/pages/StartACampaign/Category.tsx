import Link from "next/link";
import React, { useEffect } from "react";
import styled from "styled-components";

import { useRouter } from "next/router";
import { useState } from "react";
import SelectionCard from "../../components/SelectionCard/SelectionCard";
import Navbar from "../../components/Navbar/Navbar";
import { useSelector } from "react-redux";
// import {
//   loadStartCampaign,
//   selectStartCampaignState,
//   startCampaignActions,
// } from "../../../store/slices/startCampaignSlice";
import axios from "axios";
import { logout, selectAuthStateState } from "../../../store/slices/authSlice";
import Layout from "../../components/Layout";
import { toast } from "../../../store/slices/ToastSlice";
import { useAppDispatch } from "./../../../store/hooks";
import {
  grabErrorMessage,
  grabErrorStatus,
} from "../../components/helperFunctions/helperFunctions";

export default function Category() {
  const router = useRouter();
  const cardData = [
    {
      category: "Medical",
      name: "Medical",
      image: "/images/stories/medical_hope.jpg",
    },
    {
      category: "Emergency",
      name: "Emergency",
      image: "/images/event1.jpg",
    },
    {
      category: "Education",
      name: "Education",
      image: "/images/stories/tech_girls.jpg",
    },
    {
      category: "Memorial",
      name: "Memorial",
      image: "/images/childStories.jpg",
    },
    {
      category: "Environment",
      name: "Environment",
      image: "/images/stories/solar_eco.jpg",
    },
    {
      category: "Disaster",
      name: "Disaster Relief",
      image: "/images/news2.jpg",
    },
    {
      category: "Family",
      name: "Family",
      image: "/images/stories/water_story.jpg",
    },
    {
      category: "Bills",
      name: "Bills",
      image: "/images/news1.jpg",
    },
    {
      category: router?.query?.type == "Individual" ? "Business" : "Charity",
      name: router?.query?.type == "Individual" ? "Business" : "Charity",
      image: "/images/larry.jpg",
    },
    {
      category: "Politics/Activism",
      image: "/images/news3.jpg",
      name: "Politics/Activism",
    },
    {
      category: "Community",
      name: "Community Projects",
      image: "/images/event3.jpg",
    },
  ];

  const [selected, setSelected] = useState("");

  const dispatch = useAppDispatch();
  const { profile, authenticated } = useSelector(selectAuthStateState);

  const handleSubmit = async () => {
    try {
      const { type } = router.query;
      const startCampaign = {
        campaignType: type,
        category: selected,
        organizer: `${profile.firstName} ${profile.lastName}`,
        organizerId: profile._id,
      };
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/startCampaign/",
        startCampaign,
        { withCredentials: true }
      );
      res && localStorage.setItem("campaignId", res.data.data._id);
      res &&
        router.push(
          `/StartACampaign/BasicInformation?type=${type}&category=${selected}`
        );
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };

  useEffect(() => {
    !authenticated && router.push("/SignUp");
  }, [authenticated, router]);

  useEffect(() => {
    !profile?.verified && router.push("/SignUp/Verify");
  }, [profile, router]);

  return (
    <Layout title="Start a campaign | Category" showFooter>
      <Wrapper>
        <div>
          <Navbar />
        </div>
        <main className="d-flex justify-content-center align-items-center">
          <article className="d-flex flex-column justify-content-center align-items-center mt-5 custom-container">
            <p className="text-blue mb-4" style={{ fontSize: 18 }}>
              Choose your category
            </p>
            <h2 className="text-heading mb-4">Let us create your campaign</h2>
            <div className="grid mb-5">
              {cardData.map((category, i) => (
                <SelectionCard
                  key={i}
                  showSelect={true}
                  color={selected === category.category ? "var(--color-primary)" : "white"}
                  name={category?.name}
                  onClick={() => {
                    selected == category.category
                      ? setSelected("")
                      : setSelected(category.category);
                  }}
                  image={category.image}
                  empty={selected == "" && true}
                  selected={selected === category.category ? true : false}
                  category={category.category}
                />
              ))}
            </div>

            <button
              className="btn"
              // style={{ opacity: selected ? 1 : 0.5 }}
              disabled={!selected}
              onClick={handleSubmit}
            >
              <p className="mb-0 text-white">Next</p>
            </button>
          </article>
        </main>
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.div`
  min-height: 100vh;
  background: #f9f9f9;
  .header {
    background-color: white;
    height: 70px;
  }
  main {
    padding: 70px 100px;
    @media screen and (max-width: 767px) {
      width: 100%;
      padding: 100px 15px 50px 15px;
    }
    @media screen and (min-width: 768px) and (max-width: 1100px) {
      padding: 50px;
    }
    article {
      box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
        2px 10px 24px rgba(50, 50, 71, 0.05);
      border-radius: 4px;
      width: 988px;
      @media screen and (max-width: 767px) {
        width: 100%;
        padding: 39px 15px;
      }
      @media screen and (min-width: 768px) and (max-width: 1100px) {
        padding: 50px;
      }
      padding: 50px 88px;
      background-color: white;
      .grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        grid-row-gap: 1.5rem;
        grid-column-gap: 1rem;
        @media screen and (max-width: 767px) {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      button {
        background: var(--color-primary);
        box-shadow: 0px 2px 4px rgba(50, 50, 71, 0.06),
          0px 2px 2px rgba(50, 50, 71, 0.06);
        border-radius: 4px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 15px 30px;
      }
    }
  }
`;
