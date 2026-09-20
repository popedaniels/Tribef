import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import styled from "styled-components";
import Navbar from "../../components/Navbar/Navbar";
import Layout from "../../components/Layout";
import { newsList } from "../../data/storiesData";
import NewsCard from "../../components/composed/NewsCard";

export default function NewsPage() {
  const router = useRouter();
  const { id } = router.query;

  const currentNews =
    newsList.find((n) => n.slug === id || n.id === id) || newsList[0];

  const relatedNews = newsList.filter(
    (n) => n.id !== currentNews.id
  ).slice(0, 2);

  return (
    <Layout
      description={currentNews.subtitle}
      title={`${currentNews.title} | Fund&Trace News`}
      showFooter
    >
      <Wrapper>
        <Navbar />

        {/* News Header */}
        <header className="article-header custom-container">
          <div className="breadcrumb-nav mb-3">
            <Link href="/fundraising-stories?view=News">
              <a className="breadcrumb-link">← All News & Releases</a>
            </Link>
            <span className="mx-2 text-muted">/</span>
            <span className="category-chip">{currentNews.category}</span>
          </div>

          <h1 className="article-title mb-3">{currentNews.title}</h1>
          <p className="article-lead mb-4">{currentNews.subtitle}</p>

          <div className="author-meta d-flex flex-wrap align-items-center justify-content-between pt-3 border-top border-bottom py-3">
            <div className="d-flex align-items-center mb-2 mb-sm-0">
              <img
                src={currentNews.author.avatar}
                alt={currentNews.author.name}
                className="author-img mr-3"
              />
              <div>
                <h5 className="author-name mb-0">{currentNews.author.name}</h5>
                <p className="author-role mb-0">
                  {currentNews.author.role} • {currentNews.publishedAt} • {currentNews.readTime}
                </p>
              </div>
            </div>

            <div className="share-actions d-flex align-items-center">
              <span className="share-label mr-2">Share:</span>
              <button
                className="share-btn"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert("News link copied to clipboard!");
                  }
                }}
                title="Copy Link"
              >
                🔗
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(currentNews.title)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank"
                rel="noreferrer"
                className="share-btn"
                title="Share on Twitter"
              >
                𝕏
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank"
                rel="noreferrer"
                className="share-btn"
                title="Share on LinkedIn"
              >
                in
              </a>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <section className="custom-container article-hero-img-wrap mb-5">
          <div className="hero-img-container">
            <img
              src={currentNews.image}
              alt={currentNews.title}
              className="article-img"
            />
          </div>
        </section>

        {/* News Body & Sidebar */}
        <section className="custom-container article-body-section mb-5">
          <div className="row">
            <div className="col-lg-8 pr-lg-5">
              <div className="article-content">
                <p className="lead-dropcap mb-4">{currentNews.leadParagraph}</p>

                {currentNews.sections &&
                  currentNews.sections.map((section, idx) => (
                    <div key={idx} className="mb-4">
                      <h2 className="section-h2 mb-3">{section.heading}</h2>
                      <p className="body-p">{section.body}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="sidebar-sticky">
                <div className="impact-card p-4 mb-4">
                  <h4 className="card-heading mb-3">About Fund&Trace Governance</h4>
                  <p className="sidebar-desc mb-3">
                    Fund&Trace is a transparent crowdfunding infrastructure ensuring 100% auditability for nonprofit and community causes worldwide.
                  </p>
                  <Link href="/aboutUs" passHref>
                    <a className="learn-more-link">Learn About Our Mission →</a>
                  </Link>
                </div>

                <div className="cta-card p-4 text-center">
                  <h4 className="cta-title mb-2">Media & Press Inquiries</h4>
                  <p className="cta-desc mb-3">
                    Looking to feature Fund&Trace or interview our impact partners? Contact our communications team.
                  </p>
                  <a href="mailto:press@fundandtrace.com" className="btn start-btn w-100">
                    Contact Press Desk
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <section className="related-section py-5 border-top">
            <div className="custom-container">
              <h2 className="related-heading mb-4">More Platform News</h2>
              <div className="related-grid">
                {relatedNews.map((news) => (
                  <NewsCard news={news} key={news.id} />
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

    .author-img {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      object-fit: contain;
      background: #f3f4f6;
      padding: 6px;
    }

    .author-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--color-text-heading);
    }

    .author-role {
      font-size: 13px;
      color: #717688;
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

    .body-p {
      font-size: 16.5px;
      line-height: 1.75;
      color: #4b5563;
    }

    .sidebar-sticky {
      position: sticky;
      top: 100px;
    }

    .impact-card {
      background: #fcfdfe;
      border: 1px solid #e5e9f5;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);

      .card-heading {
        font-size: 16px;
        font-weight: 700;
        color: var(--color-text-heading);
      }

      .sidebar-desc {
        font-size: 13.5px;
        color: #555b70;
        line-height: 1.6;
      }

      .learn-more-link {
        font-size: 13.5px;
        color: var(--color-primary);
        font-weight: 600;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
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
