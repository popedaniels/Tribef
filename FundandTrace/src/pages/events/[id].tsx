import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import styled from "styled-components";
import Navbar from "../../components/Navbar/Navbar";
import Layout from "../../components/Layout";
import { eventsList } from "../../data/storiesData";
import EventsCard from "../../components/composed/EventsCard";

export default function EventPage() {
  const router = useRouter();
  const { id } = router.query;
  const [registered, setRegistered] = useState(false);
  const [email, setEmail] = useState("");

  const currentEvent =
    eventsList.find((e) => e.slug === id || e.id === id) || eventsList[0];

  const relatedEvents = eventsList.filter(
    (e) => e.id !== currentEvent.id
  ).slice(0, 2);

  const handleRSVP = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email) {
      setRegistered(true);
    }
  };

  return (
    <Layout
      description={currentEvent.subtitle}
      title={`${currentEvent.title} | Fund&Trace Events`}
      showFooter
    >
      <Wrapper>
        <Navbar />

        {/* Event Header */}
        <header className="article-header custom-container">
          <div className="breadcrumb-nav mb-3">
            <Link href="/fundraising-stories?view=Events">
              <a className="breadcrumb-link">← All Community Events</a>
            </Link>
            <span className="mx-2 text-muted">/</span>
            <span className="category-chip">{currentEvent.category}</span>
          </div>

          <h1 className="article-title mb-3">{currentEvent.title}</h1>
          <p className="article-lead mb-4">{currentEvent.subtitle}</p>

          <div className="event-meta-bar d-flex flex-wrap align-items-center justify-content-between pt-3 border-top border-bottom py-3">
            <div className="d-flex flex-wrap align-items-center mb-2 mb-sm-0">
              <div className="event-pill mr-3 mb-1">
                <span className="icon">📅</span>
                <span>{currentEvent.date}</span>
              </div>
              <div className="event-pill mr-3 mb-1">
                <span className="icon">⏰</span>
                <span>{currentEvent.time || "02:00 PM UTC"}</span>
              </div>
              <div className="event-pill mb-1">
                <span className="icon">📍</span>
                <span>{currentEvent.location}</span>
              </div>
            </div>

            <div className="share-actions d-flex align-items-center">
              <span className="share-label mr-2">Share:</span>
              <button
                className="share-btn"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Event link copied to clipboard!");
                  }
                }}
                title="Copy Link"
              >
                🔗
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(currentEvent.title)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank"
                rel="noreferrer"
                className="share-btn"
                title="Share on Twitter"
              >
                𝕏
              </a>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <section className="custom-container article-hero-img-wrap mb-5">
          <div className="hero-img-container">
            <img
              src={currentEvent.image}
              alt={currentEvent.title}
              className="article-img"
            />
          </div>
        </section>

        {/* Event Body & RSVP Sidebar */}
        <section className="custom-container article-body-section mb-5">
          <div className="row">
            <div className="col-lg-8 pr-lg-5">
              <div className="article-content">
                <p className="lead-dropcap mb-4">{currentEvent.leadParagraph}</p>

                <div className="mb-4">
                  <h2 className="section-h2 mb-3">Event Agenda & Highlights</h2>
                  <ul className="event-highlights-list pl-3">
                    <li className="mb-2"><strong>Keynote Session:</strong> Transparent escrow architecture and real-time vendor verification.</li>
                    <li className="mb-2"><strong>Interactive Workshop:</strong> Case studies from top-performing medical and emergency relief campaigns.</li>
                    <li className="mb-2"><strong>Live Q&A:</strong> Direct discussions with nonprofit directors, auditors, and engineering leaders.</li>
                    <li><strong>Networking Mixer:</strong> Connect with fellow philanthropists and grassroots organizers.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="sidebar-sticky">
                <div className="rsvp-card p-4 mb-4">
                  <h4 className="rsvp-title mb-2">Reserve Your Free Spot</h4>
                  <p className="rsvp-attendees mb-3">
                    👥 <strong>{currentEvent.attendees}</strong> already attending
                  </p>

                  {registered ? (
                    <div className="rsvp-success p-3 text-center">
                      <span className="success-icon">🎉</span>
                      <h5 className="mb-1 text-success font-weight-bold">Registration Confirmed!</h5>
                      <p className="mb-0 text-muted" style={{ fontSize: 13 }}>
                        Check your inbox for calendar invites and streaming links.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleRSVP}>
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Your Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="name@organization.com"
                          className="form-control rsvp-input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn rsvp-btn w-100">
                        RSVP Now (Free)
                      </button>
                    </form>
                  )}
                </div>

                <div className="cta-card p-4 text-center">
                  <h4 className="cta-title mb-2">Want to Host an Event?</h4>
                  <p className="cta-desc mb-3">
                    Partner with Fund&Trace to host a community fundraiser workshop or charity run.
                  </p>
                  <Link href="/aboutUs" passHref>
                    <a className="btn start-btn w-100">Partner With Us</a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <section className="related-section py-5 border-top">
            <div className="custom-container">
              <h2 className="related-heading mb-4">More Upcoming Events</h2>
              <div className="related-grid">
                {relatedEvents.map((event) => (
                  <EventsCard event={event} key={event.id} />
                ))}
              </div>
            </div>
          </section>
        )}
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.main`
  background: #ffffff;
  padding-top: 100px;

  .article-header {
    max-width: 900px;
    margin: 0 auto;
    padding-top: 30px;

    .breadcrumb-link {
      color: var(--color-primary);
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .category-chip {
      background: #eef1fe;
      color: var(--color-primary);
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 12px;
    }

    .article-title {
      font-size: 38px;
      font-weight: 800;
      color: var(--color-text-heading);
      line-height: 1.25;
      letter-spacing: -0.025em;

      @media screen and (max-width: 767px) {
        font-size: 28px;
      }
    }

    .article-lead {
      font-size: 18px;
      color: #555b70;
      line-height: 1.6;
    }

    .event-pill {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--color-text-heading);
      background: #f3f4f8;
      padding: 6px 14px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .share-label {
      font-size: 13px;
      font-weight: 600;
      color: #717688;
    }

    .share-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 8px;
      color: #374151;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
        transform: translateY(-2px);
      }
    }
  }

  .article-hero-img-wrap {
    max-width: 1040px;
    margin: 0 auto;

    .hero-img-container {
      position: relative;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);

      .article-img {
        width: 100%;
        max-height: 480px;
        object-fit: cover;
      }
    }
  }

  .article-body-section {
    max-width: 1040px;
    margin: 0 auto;

    .lead-dropcap {
      font-size: 18px;
      line-height: 1.7;
      color: #2e354b;
    }

    .section-h2 {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-heading);
      letter-spacing: -0.015em;
    }

    .event-highlights-list {
      font-size: 16px;
      line-height: 1.7;
      color: #4b5563;
    }

    .sidebar-sticky {
      position: sticky;
      top: 100px;
    }

    .rsvp-card {
      background: #fcfdfe;
      border: 1px solid #e5e9f5;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);

      .rsvp-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--color-text-heading);
      }

      .rsvp-attendees {
        font-size: 13.5px;
        color: #059669;
      }

      .rsvp-input {
        padding: 10px 14px;
        border-radius: 4px;
        border: 1px solid #d1d5db;
        font-size: 14px;
      }

      .rsvp-btn {
        background: var(--color-primary);
        color: #ffffff;
        font-weight: 700;
        border-radius: 4px;
        padding: 11px;
        transition: background 0.2s ease;

        &:hover {
          background: var(--color-primary-hover);
        }
      }

      .rsvp-success {
        background: #ecfdf5;
        border-radius: 4px;

        .success-icon {
          font-size: 28px;
          display: block;
          margin-bottom: 6px;
        }
      }
    }

    .cta-card {
      background: linear-gradient(135deg, var(--color-text-heading) 0%, #252e50 100%);
      border-radius: 4px;
      color: #ffffff;

      .cta-title {
        font-size: 17px;
        font-weight: 700;
      }

      .cta-desc {
        font-size: 13.5px;
        color: #cbd5e1;
        line-height: 1.5;
      }

      .start-btn {
        background: var(--color-primary);
        color: #ffffff;
        font-weight: 700;
        border-radius: 4px;
        padding: 10px;
        text-decoration: none;
        display: inline-block;
        transition: background 0.2s ease;

        &:hover {
          background: var(--color-primary-hover);
        }
      }
    }
  }

  .related-section {
    background: #f9fafb;

    .related-heading {
      font-size: 26px;
      font-weight: 800;
      color: var(--color-text-heading);
      letter-spacing: -0.02em;
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 28px;

      @media screen and (max-width: 767px) {
        grid-template-columns: 1fr;
      }
    }
  }
`;
