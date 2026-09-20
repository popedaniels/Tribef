import Link from "next/link";
import React from "react";
import styled from "styled-components";

export default function StoriesCard({ story }) {
  if (!story) return null;

  return (
    <Link href={`/stories/${story.slug || story.id}`} passHref>
      <CardLink>
        <Wrapper className="w-100 h-100 d-flex flex-column">
          <div className="img-container position-relative">
            <img
              src={story.image || "/images/stories/water_story.jpg"}
              alt={story.title}
              className="card-img"
              loading="lazy"
            />
            {story.badge && (
              <span className="badge-pill position-absolute">
                <span className="dot"></span>
                {story.badge}
              </span>
            )}
            <span className="category-tag position-absolute">
              {story.category || "Impact Story"}
            </span>
          </div>

          <div className="card-content d-flex flex-column justify-content-between flex-grow-1 p-4">
            <div>
              <div className="d-flex align-items-center text-muted mb-2 metadata">
                <span>{story.publishedAt || "August 2026"}</span>
                <span className="mx-2">•</span>
                <span>{story.readTime || "4 min read"}</span>
              </div>

              <h3 className="card-title mb-2">
                {story.title}
              </h3>

              <p className="card-subtitle mb-3">
                {story.subtitle || story.leadParagraph}
              </p>
            </div>

            {story.stats && (
              <div className="impact-stats d-flex flex-wrap align-items-center pt-3 border-top">
                <div className="stat-item mr-4 mb-1">
                  <span className="stat-label">Impact: </span>
                  <strong className="stat-val">{story.stats.beneficiaries}</strong>
                </div>
                <div className="stat-item mb-1">
                  <span className="stat-label">Raised: </span>
                  <strong className="stat-val">{story.stats.amountRaised}</strong>
                </div>
              </div>
            )}

            <div className="card-footer-author d-flex align-items-center justify-content-between pt-3 mt-2">
              <div className="d-flex align-items-center">
                <div className="author-avatar mr-2">
                  <img
                    src={story.author?.avatar || "/images/about/aboutStory.png"}
                    alt={story.author?.name || "Author"}
                  />
                </div>
                <div>
                  <h5 className="author-name mb-0">{story.author?.name || "Fund&Trace Contributor"}</h5>
                  <p className="author-role mb-0">{story.author?.role || "Field Specialist"}</p>
                </div>
              </div>

              <span className="read-more-link d-inline-flex align-items-center">
                Read Story
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1 arrow-icon"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </span>
            </div>
          </div>
        </Wrapper>
      </CardLink>
    </Link>
  );
}

const CardLink = styled.a`
  text-decoration: none !important;
  color: inherit !important;
  display: block;
  height: 100%;
`;

const Wrapper = styled.article`
  background: #ffffff;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #eef0f7;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 36px rgba(105, 121, 248, 0.12);
    border-color: #dbe0fc;

    .card-img {
      transform: scale(1.05);
    }

    .read-more-link {
      color: var(--color-primary-hover);
      .arrow-icon {
        transform: translateX(4px);
      }
    }
  }

  .img-container {
    height: 240px;
    overflow: hidden;
    background: #f1f3f9;

    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .badge-pill {
      top: 14px;
      left: 14px;
      background: rgba(16, 185, 129, 0.92);
      backdrop-filter: blur(8px);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

      .dot {
        width: 6px;
        height: 6px;
        background: #ffffff;
        border-radius: 50%;
        margin-right: 6px;
      }
    }

    .category-tag {
      bottom: 14px;
      left: 14px;
      background: rgba(23, 28, 53, 0.85);
      backdrop-filter: blur(8px);
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 4px;
    }
  }

  .metadata {
    font-size: 13px;
    letter-spacing: 0.01em;
  }

  .card-title {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.35;
    color: var(--color-text-heading);
    letter-spacing: -0.02em;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-subtitle {
    font-size: 14.5px;
    color: #555b70;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .impact-stats {
    font-size: 13px;
    color: #4b5563;

    .stat-label {
      color: #717688;
    }

    .stat-val {
      color: var(--color-text-heading);
      font-weight: 600;
    }
  }

  .author-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    background: #e5e7eb;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .author-name {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--color-text-heading);
  }

  .author-role {
    font-size: 11.5px;
    color: #717688;
  }

  .read-more-link {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--color-primary);
    transition: all 0.2s ease;

    .arrow-icon {
      transition: transform 0.2s ease;
    }
  }
`;
