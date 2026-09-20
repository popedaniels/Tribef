import Link from "next/link";
import React from "react";
import styled from "styled-components";

export default function EventsCard({ event }) {
  if (!event) return null;

  return (
    <Link href={`/events/${event.slug || event.id}`} passHref>
      <CardLink>
        <Wrapper className="w-100 h-100 d-flex flex-column">
          <div className="img-container position-relative">
            <img
              src={event.image || "/images/event1.jpg"}
              alt={event.title}
              className="card-img"
              loading="lazy"
            />
            <span className="date-badge position-absolute">
              <span className="cal-icon">📅</span>
              {event.date}
            </span>
            <span className="category-tag position-absolute">
              {event.category || "Event"}
            </span>
          </div>

          <div className="card-content d-flex flex-column justify-content-between flex-grow-1 p-4">
            <div>
              <div className="d-flex align-items-center text-muted mb-2 metadata">
                <span>📍 {event.location}</span>
              </div>

              <h3 className="card-title mb-2">
                {event.title}
              </h3>

              <p className="card-subtitle mb-3">
                {event.subtitle || event.leadParagraph}
              </p>
            </div>

            <div className="card-footer-author d-flex align-items-center justify-content-between pt-3 border-top mt-2">
              <div className="attendee-chip">
                <span>👥 {event.attendees || "Open registration"}</span>
              </div>

              <span className="read-more-link d-inline-flex align-items-center">
                Event Details
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
    height: 220px;
    overflow: hidden;
    background: #f1f3f9;

    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .date-badge {
      top: 14px;
      left: 14px;
      background: rgba(23, 28, 53, 0.9);
      backdrop-filter: blur(8px);
      color: #ffffff;
      font-size: 11.5px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;

      .cal-icon {
        margin-right: 5px;
        font-size: 12px;
      }
    }

    .category-tag {
      bottom: 14px;
      left: 14px;
      background: rgba(105, 121, 248, 0.9);
      backdrop-filter: blur(8px);
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 4px;
    }
  }

  .metadata {
    font-size: 12.5px;
    font-weight: 500;
    color: #6b7280;
  }

  .card-title {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
    color: var(--color-text-heading);
    letter-spacing: -0.015em;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-subtitle {
    font-size: 14px;
    color: #555b70;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .attendee-chip {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    background: #f3f4f6;
    padding: 4px 10px;
    border-radius: 4px;
  }

  .read-more-link {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-primary);
    transition: all 0.2s ease;

    .arrow-icon {
      transition: transform 0.2s ease;
    }
  }
`;
