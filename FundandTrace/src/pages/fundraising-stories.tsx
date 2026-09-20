import { useRouter } from "next/router";
import React, { useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import EventsCard from "../components/composed/EventsCard";
import NewsCard from "../components/composed/NewsCard";
import StoriesCard from "../components/composed/StoriesCard";
import Layout from "../components/Layout";
import Navbar from "../components/Navbar/Navbar";
import { storiesList, newsList, eventsList } from "../data/storiesData";

export default function FundraisingStories() {
  const router = useRouter();
  const [view, setView] = useState(
    router.query.view ? router.query.view : "All"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const featuredStory = storiesList[0];
  const regularStories = storiesList.slice(1);

  const filteredStories = storiesList.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = newsList.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = eventsList.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout
      description="Inspirational chronicles of transparent giving, verified milestones, and life-changing community impact across the globe on Fund&Trace."
      title="Stories, News & Events | Fund&Trace"
      showFooter
    >
      <Wrapper>
        <Navbar />

        {/* Hero Banner */}
        <section className="stories-hero">
          <div className="custom-container hero-inner">
            <span className="hero-eyebrow">Impact Chronicles & News</span>
            <h1 className="hero-title">Real Lives Changed, 100% Verified</h1>
            <p className="hero-subtitle">
              Explore authentic donor-funded transformations, verified milestone audits, platform news, and upcoming community workshops.
            </p>

            {/* Quick Stats Bar */}
            <div className="stats-row d-flex flex-wrap align-items-center justify-content-center">
              <div className="stat-pill">
                <span className="icon">🛡️</span>
                <strong>100% Verified Escrow</strong>
              </div>
              <div className="stat-pill">
                <span className="icon">💧</span>
                <strong>14,000+ Clean Water Beneficiaries</strong>
              </div>
              <div className="stat-pill">
                <span className="icon">🏥</span>
                <strong>Direct Hospital Settlement</strong>
              </div>
              <div className="stat-pill">
                <span className="icon">⚡</span>
                <strong>Zero Platform Fees on Medical</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="custom-container main-content-container pb-5">
          {/* Featured Hero Story (when on All or Stories and no search active) */}
          {(view === "All" || view === "Stories") && !searchQuery && featuredStory && (
            <div className="featured-section mb-5">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="section-title mb-0">Featured Impact Story</h2>
                <span className="verified-badge-label">🏆 Top Verified Campaign</span>
              </div>

              <Link href={`/stories/${featuredStory.slug}`} passHref>
                <a className="featured-card-link">
                  <div className="featured-card">
                    <div className="featured-img-wrap">
                      <img
                        src={featuredStory.image}
                        alt={featuredStory.title}
                        className="featured-img"
                      />
                      <span className="featured-badge">{featuredStory.badge}</span>
                    </div>

                    <div className="featured-content">
                      <div className="d-flex align-items-center text-muted mb-2 metadata">
                        <span className="category-pill">{featuredStory.category}</span>
                        <span className="mx-2">•</span>
                        <span>{featuredStory.publishedAt}</span>
                        <span className="mx-2">•</span>
                        <span>{featuredStory.readTime}</span>
                      </div>

                      <h3 className="featured-title">{featuredStory.title}</h3>
                      <p className="featured-subtitle">{featuredStory.subtitle}</p>

                      {featuredStory.stats && (
                        <div className="featured-stats-grid">
                          <div className="stat-card">
                            <span className="label">Beneficiaries</span>
                            <span className="val">{featuredStory.stats.beneficiaries}</span>
                          </div>
                          <div className="stat-card">
                            <span className="label">Funds Raised</span>
                            <span className="val">{featuredStory.stats.amountRaised}</span>
                          </div>
                          <div className="stat-card">
                            <span className="label">Milestone Audit</span>
                            <span className="val text-success font-weight-bold">{featuredStory.stats.milestonesCompleted}</span>
                          </div>
                        </div>
                      )}

                      <div className="d-flex align-items-center justify-content-between pt-4 border-top">
                        <div className="d-flex align-items-center">
                          <img
                            src={featuredStory.author.avatar}
                            alt={featuredStory.author.name}
                            className="author-avatar mr-2"
                          />
                          <div>
                            <p className="author-name mb-0">{featuredStory.author.name}</p>
                            <p className="author-role mb-0">{featuredStory.author.role}</p>
                          </div>
                        </div>

                        <span className="featured-cta">
                          Read Full Chronicle →
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          )}

          {/* Filter Bar & Search */}
          <div className="controls-bar d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-3 border-bottom">
            <div className="tab-filters d-flex align-items-center mb-3 mb-md-0">
              {["All", "Stories", "News", "Events"].map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${view === tab ? "active" : ""}`}
                  onClick={() => setView(tab)}
                >
                  {tab}
                  <span className="count-tag">
                    {tab === "All"
                      ? storiesList.length + newsList.length + eventsList.length
                      : tab === "Stories"
                      ? storiesList.length
                      : tab === "News"
                      ? newsList.length
                      : eventsList.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="search-box position-relative">
              <input
                type="text"
                placeholder="Search articles, news, causes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          {/* Stories Section */}
          {(view === "All" || view === "Stories") && (
            <section className="mb-5 pt-3">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h2 className="section-title mb-1">
                    {view === "All" ? "Recent Impact Stories" : "All Impact Stories"}
                  </h2>
                  <p className="section-desc mb-0">
                    Transparent records of projects funded through milestone escrow.
                  </p>
                </div>
                {view === "All" && (
                  <button className="view-all-btn" onClick={() => setView("Stories")}>
                    Explore All Stories ({storiesList.length}) →
                  </button>
                )}
              </div>

              <div className="stories-grid">
                {(view === "All" ? regularStories : filteredStories).map((story) => (
                  <StoriesCard story={story} key={story.id} />
                ))}
              </div>
            </section>
          )}

          {/* News Section */}
          {(view === "All" || view === "News") && (
            <section className="mb-5 pt-4 border-top">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h2 className="section-title mb-1">Platform News & Releases</h2>
                  <p className="section-desc mb-0">
                    Official updates, governance announcements, and security reports.
                  </p>
                </div>
                {view === "All" && (
                  <button className="view-all-btn" onClick={() => setView("News")}>
                    View All News ({newsList.length}) →
                  </button>
                )}
              </div>

              <div className="news-grid">
                {filteredNews.map((news) => (
                  <NewsCard news={news} key={news.id} />
                ))}
              </div>
            </section>
          )}

          {/* Events Section */}
          {(view === "All" || view === "Events") && (
            <section className="mb-5 pt-4 border-top">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h2 className="section-title mb-1">Community Events & Workshops</h2>
                  <p className="section-desc mb-0">
                    Live masterclasses, transparency summits, and direct action drives.
                  </p>
                </div>
                {view === "All" && (
                  <button className="view-all-btn" onClick={() => setView("Events")}>
                    View All Events ({eventsList.length}) →
                  </button>
                )}
              </div>

              <div className="events-grid">
                {filteredEvents.map((event) => (
                  <EventsCard event={event} key={event.id} />
                ))}
              </div>
            </section>
          )}

          {/* Newsletter Subscribe Banner */}
          <div className="newsletter-banner p-4 p-md-5 mt-5">
            <div className="row align-items-center">
              <div className="col-lg-7 mb-4 mb-lg-0">
                <span className="newsletter-tag">Stay Informed</span>
                <h3 className="newsletter-title mb-2">
                  Get Verified Impact Stories in Your Inbox
                </h3>
                <p className="newsletter-desc mb-0">
                  Join 35,000+ donors receiving our bi-weekly dispatch of milestone audits, verified case studies, and transparent giving insights.
                </p>
              </div>
              <div className="col-lg-5">
                <div className="newsletter-form d-flex">
                  <input
                    type="email"
                    placeholder="Enter your email address..."
                    className="newsletter-input flex-grow-1"
                  />
                  <button className="newsletter-btn">Subscribe</button>
                </div>
                <span className="privacy-note">No spam. 1-click unsubscribe anytime.</span>
              </div>
            </div>
          </div>
        </section>
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.main`
  background: #fcfdfe;

  .stories-hero {
    background: linear-gradient(180deg, #f3f5ff 0%, #ffffff 100%);
    padding: 140px 0 50px;
    text-align: center;
    border-bottom: 1px solid #edf0f8;

    .hero-eyebrow {
      display: inline-block;
      background: #e9ecfe;
      color: var(--color-primary);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .hero-title {
      font-size: 44px;
      font-weight: 800;
      color: var(--color-text-heading);
      letter-spacing: -0.03em;
      line-height: 1.2;
      max-width: 800px;
      margin: 0 auto 16px;

      @media screen and (max-width: 767px) {
        font-size: 32px;
      }
    }

    .hero-subtitle {
      font-size: 17px;
      color: #555b70;
      max-width: 680px;
      margin: 0 auto 32px;
      line-height: 1.6;
    }

    .stats-row {
      gap: 12px;

      .stat-pill {
        background: #ffffff;
        border: 1px solid #e2e6f4;
        padding: 8px 16px;
        border-radius: 30px;
        font-size: 13.5px;
        color: var(--color-text-heading);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
    }
  }

  .main-content-container {
    max-width: 1240px;
    margin: 0 auto;
    padding-top: 40px;
  }

  /* Featured Card */
  .featured-section {
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-heading);
    }

    .verified-badge-label {
      font-size: 13px;
      font-weight: 600;
      color: #059669;
      background: #ecfdf5;
      padding: 4px 12px;
      border-radius: 4px;
    }

    .featured-card-link {
      text-decoration: none !important;
      color: inherit !important;
      display: block;
    }

    .featured-card {
      background: #ffffff;
      border-radius: 4px;
      border: 1px solid #e5e9f5;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      @media screen and (max-width: 991px) {
        grid-template-columns: 1fr;
      }

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(105, 121, 248, 0.12);
        border-color: #c9d2fc;

        .featured-img {
          transform: scale(1.04);
        }

        .featured-cta {
          color: #4b5df5;
        }
      }

      .featured-img-wrap {
        position: relative;
        height: 100%;
        min-height: 380px;
        overflow: hidden;

        .featured-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .featured-badge {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(16, 185, 129, 0.95);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 4px;
          backdrop-filter: blur(8px);
        }
      }

      .featured-content {
        padding: 36px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .category-pill {
          background: #eef1fe;
          color: var(--color-primary);
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 12px;
        }

        .featured-title {
          font-size: 26px;
          font-weight: 800;
          color: var(--color-text-heading);
          line-height: 1.3;
          margin-bottom: 12px;
          letter-spacing: -0.02em;

          @media screen and (max-width: 767px) {
            font-size: 21px;
          }
        }

        .featured-subtitle {
          font-size: 15px;
          color: #555b70;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .featured-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          background: #f8fafc;
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 20px;

          @media screen and (max-width: 575px) {
            grid-template-columns: 1fr;
          }

          .stat-card {
            display: flex;
            flex-direction: column;

            .label {
              font-size: 11px;
              color: #717688;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 2px;
            }

            .val {
              font-size: 14px;
              font-weight: 700;
              color: var(--color-text-heading);
            }
          }
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .author-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-heading);
        }

        .author-role {
          font-size: 12px;
          color: #717688;
        }

        .featured-cta {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-primary);
          transition: all 0.2s ease;
        }
      }
    }
  }

  /* Filter Controls */
  .controls-bar {
    .tab-filters {
      gap: 8px;

      .tab-btn {
        background: #f3f4f8;
        border: none;
        padding: 8px 16px;
        border-radius: 30px;
        font-size: 14px;
        font-weight: 600;
        color: #4b5563;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;

        &:hover {
          background: #e9ecfe;
          color: var(--color-primary);
        }

        &.active {
          background: var(--color-primary);
          color: #ffffff;

          .count-tag {
            background: rgba(255, 255, 255, 0.25);
            color: #ffffff;
          }
        }

        .count-tag {
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
          background: #e5e7eb;
          color: #4b5563;
          font-weight: 700;
        }
      }
    }

    .search-box {
      width: 300px;

      @media screen and (max-width: 767px) {
        width: 100%;
      }

      .search-input {
        width: 100%;
        padding: 10px 16px 10px 38px;
        border-radius: 30px;
        border: 1px solid #d1d5db;
        font-size: 14px;
        background: #ffffff;
        outline: none;
        transition: border-color 0.2s ease;

        &:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(105, 121, 248, 0.15);
        }
      }

      .search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 13px;
        opacity: 0.6;
      }
    }
  }

  .section-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text-heading);
    letter-spacing: -0.015em;
  }

  .section-desc {
    font-size: 14.5px;
    color: #6b7280;
  }

  .view-all-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;

    &:hover {
      text-decoration: underline;
    }
  }

  .stories-grid,
  .news-grid,
  .events-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 28px;

    @media screen and (max-width: 991px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media screen and (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  /* Newsletter */
  .newsletter-banner {
    background: linear-gradient(135deg, var(--color-text-heading) 0%, #293056 100%);
    border-radius: 4px;
    color: #ffffff;

    .newsletter-tag {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .newsletter-title {
      font-size: 28px;
      font-weight: 800;
      line-height: 1.3;
      letter-spacing: -0.02em;

      @media screen and (max-width: 767px) {
        font-size: 22px;
      }
    }

    .newsletter-desc {
      font-size: 14.5px;
      color: #c5cbdc;
      line-height: 1.6;
    }

    .newsletter-form {
      gap: 8px;
      margin-bottom: 8px;

      @media screen and (max-width: 480px) {
        flex-direction: column;
      }

      .newsletter-input {
        padding: 12px 18px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        font-size: 14px;
        outline: none;

        &::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        &:focus {
          border-color: var(--color-primary);
          background: rgba(255, 255, 255, 0.15);
        }
      }

      .newsletter-btn {
        background: var(--color-primary);
        color: #ffffff;
        border: none;
        padding: 12px 24px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s ease;

        &:hover {
          background: var(--color-primary-hover);
        }
      }
    }

    .privacy-note {
      font-size: 12px;
      color: #9ca3af;
    }
  }
`;
