import React from "react";
import DefaultModal from "../../composed/Modal/DefaultModal/DefaultModal";
import styled from "styled-components";
import Link from "next/link";

const categories = [
  {
    image: "/images/stories/medical_hope.jpg",
    title: "Medical",
    slug: "medical",
  },
  {
    image: "/images/event1.jpg",
    title: "Emergency",
    slug: "emergency",
  },
  {
    image: "/images/event2.jpg",
    title: "Non-Profit",
    slug: "nonprofit",
  },
  {
    image: "/images/news1.jpg",
    title: "Monthly Bills",
    slug: "bills",
  },
  {
    image: "/images/stories/tech_girls.jpg",
    title: "Education",
    slug: "education",
  },
  {
    image: "/images/childStories.jpg",
    title: "Memorial",
    slug: "memorial",
  },
  {
    image: "/images/stories/solar_eco.jpg",
    title: "Environment",
    slug: "environment",
  },
  {
    image: "/images/stories/water_story.jpg",
    title: "Family",
    slug: "family",
  },
];

export default function ExploreModal({ onModalClose, showModal }) {
  return (
    <DefaultModal
      onModalClose={onModalClose}
      showModal={showModal}
      onBlur={onModalClose}
      variant="large"
    >
      <div className="d-flex" style={{ paddingRight: "40px" }}>
        <img
          src="/images/ideas1.png"
          alt="explore banner"
          width="400px"
          style={{ objectFit: "cover", borderRadius: "4px 0 0 4px" }}
          className="d-none d-lg-block"
        />
        <div className="mt-4 ml-lg-4 w-100">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="text-blue mb-0 font-weight-bold" style={{ fontSize: 16 }}>
              EXPLORE CATEGORIES
            </h3>
            <Link href="/Categories" passHref>
              <a
                onClick={onModalClose}
                className="d-flex align-items-center text-blue"
                style={{ fontSize: 14, fontWeight: 600, textDecoration: "none" }}
              >
                <span className="mr-1">See All</span>
                <img src="/images/icons/blueRight.svg" width="12px" height="12px" alt="arrow" />
              </a>
            </Link>
          </div>

          <div className="d-flex justify-content-between flex-wrap">
            {categories.map((category, i) => (
              <ExploreItem key={i}>
                <Link href={`/category/${category.slug}`} passHref>
                  <a onClick={onModalClose} style={{ textDecoration: "none" }}>
                    <img src={category.image} width="100%" alt={category.title} />
                    <h3 className="mt-2 text-truncate">{category.title}</h3>
                  </a>
                </Link>
              </ExploreItem>
            ))}
          </div>
        </div>
      </div>
    </DefaultModal>
  );
}

const ExploreItem = styled.div`
  width: 22%;
  margin-bottom: 20px;
  @media screen and (max-width: 767px) {
    width: 46%;
  }
  img {
    height: 110px;
    border-radius: 4px;
    object-fit: cover;
    transition: transform 0.2s ease;
    &:hover {
      transform: scale(1.03);
    }
  }
  h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-heading);
    margin-bottom: 0;
    transition: color 0.2s ease;
  }
`;
