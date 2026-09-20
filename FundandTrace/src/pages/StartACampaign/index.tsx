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
import { selectAuthStateState } from "../../../store/slices/authSlice";
import Layout from "../../components/Layout";

export default function Category() {
  const router = useRouter();
  const cardData = [
    {
      category: "Personal Causes",
      name: "Personal Causes",
      image: "/images/stories/medical_hope.jpg",
    },
    {
      category: "Campaign",
      name: "Campaign or causes",
      image: "/images/stories/water_story.jpg",
    },
    {
      category: "Business",
      name: "Business",
      image: "/images/larry.jpg",
    },
    {
      category: "Charity",
      name: "Charity",
      image: "/images/stories/tech_girls.jpg",
    },
    {
      category: "Community",
      name: "Community Projects",
      image: "/images/stories/solar_eco.jpg",
    },
    {
      category: "Sports",
      name: "Sports",
      image: "/images/sports.jpg",
    },
    // {
    //   category: "Medical",
    //   name: "Medical",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1622836161/firefighter.jpg",
    // },
    // {
    //   category: "Emergency",
    //   name: "Emergency",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1622836157/emergency.png",
    // },
    // {
    //   category: "Education",
    //   name: "Education",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1622836178/school.jpg",
    // },
    // {
    //   category: "Memorial",
    //   name: "Memorial",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1622836167/memorial.png",
    // },
    // {
    //   category: "Environment",
    //   name: "Environment",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1622836158/environment.png",
    // },
    // {
    //   category: "Disaster",
    //   name: "Disaster Relief",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1622836175/disasterRelief.png",
    // },
    // {
    //   category: "Family",
    //   name: "Family",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1622836169/family.png",
    // },
    // {
    //   category: "Bills",
    //   name: "Bills",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1622836152/bills.png",
    // },
    // {
    //   category: "Business",
    //   name: "Business",
    //   image: "/images/larry.jpg",
    // },
    // {
    //   category: "Charity",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1632319345/cb36p6oukxijcmbj3vve.jpg",

    //   name: "Charity",
    // },
    // {
    //   category: "Politics/Activism",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1632319345/cb36p6oukxijcmbj3vve.jpg",

    //   name: "Politics/Activism",
    // },
    // {
    //   category: "Community",
    //   name: "Community Projects",
    //   image:
    //     "https://res.cloudinary.com/wisdomosara/image/upload/v1632319359/u4c4sv2wed3u42m3wafj.jpg",
    // },
  ];

  const [selected, setSelected] = useState("");
  const { profile, authenticated } = useSelector(selectAuthStateState);

  const handleSubmit = async () => {
    router.push(`/StartACampaign/type?category=${selected}`);
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
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-row-gap: 2rem;
        grid-column-gap: 2rem;
        @media screen and (max-width: 767px) {
          grid-template-columns: repeat(1, minmax(0, 1fr));
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
