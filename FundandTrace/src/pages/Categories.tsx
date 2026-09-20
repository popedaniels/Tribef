import styled from "styled-components";
import Header from "../components/HeaderComponent/Header";
import StartFunding from "../components/homepageComponents/StartFundingSection/StartFunding";
import Link from "next/link";
import Layout from "../components/Layout";
import FeaturesGrid from "../components/homepageComponents/FeaturesGrid/FeaturesGrid";

const cardData = [
  {
    category: "Medical",
    link: "Medical",
    image: "/images/stories/medical_hope.jpg",
  },
  {
    category: "Emergency",
    link: "Emergency",
    image: "/images/event1.jpg",
  },
  {
    category: "Non-Profit/Charity",
    link: "nonprofit",
    image: "/images/event2.jpg",
  },
  {
    category: "Education",
    link: "Education",
    image: "/images/stories/tech_girls.jpg",
  },
  {
    category: "Business",
    link: "Business",
    image: "/images/larry.jpg",
  },
  {
    category: "Memorial",
    link: "Memorial",
    image: "/images/childStories.jpg",
  },
  {
    category: "Environment",
    link: "Environment",
    image: "/images/stories/solar_eco.jpg",
  },
  {
    category: "Family",
    link: "Family",
    image: "/images/stories/water_story.jpg",
  },
  {
    category: "Bills",
    link: "Bills",
    image: "/images/news1.jpg",
  },
  {
    category: "Disaster Relief",
    link: "Disaster",
    image: "/images/news2.jpg",
  },
  {
    category: "Community Projects",
    link: "Community",
    image: "/images/event3.jpg",
  },
  {
    category: "Politics/Activism",
    link: "Politics",
    image: "/images/news3.jpg",
  },
];

export default function Categories() {
  

  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg" title="Fund&Trace | All Categories" showFooter>
      <Wrapper>
        <div>
          <Header
            blueText={"FUNDRASING CATEGORIES"}
            headingText={"Fundraising categories you care about and can donate"}
            paddingTop="50px"
          />
        </div>

        <div className="card-holder custom-container">
          {cardData.map((card, i) => (
            <Link href={`/category/${card.link}`} passHref key={i}>
              <a style={{ textDecoration: "none" }}>
                <div className="card">
                  <img src={card.image} alt="categoriesCardImage" />
                  <div className="card-bottom d-flex pl-3 align-items-center text-medium font-weight-bold">
                    {card.category}
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>

        <FeaturesGrid />

        <StartFunding />
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.div`
  .card-holder {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    row-gap: 1rem;
    column-gap: 1rem;

    @media screen and (min-width: 768px) and (max-width: 1023px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media screen and (max-width: 767px) {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
    margin-bottom: 100px;
    .card {
      box-shadow: 0px 4px 4px rgba(50, 50, 71, 0.08),
        0px 4px 8px rgba(50, 50, 71, 0.06);
      transition: all ease-in-out 0.3s;
      border-radius: 4px;
      &:hover {
        box-shadow: 0px 24px 24px rgba(50, 50, 71, 0.1),
          0px 40px 48px rgba(50, 50, 71, 0.25);
      }
      img {
        height: 225px;
        width: 100%;
        object-fit: cover;
        border-radius: 4px 4px 0 0;
      }
      .card-bottom {
        height: 92px;
      }
    }
  }
`;
