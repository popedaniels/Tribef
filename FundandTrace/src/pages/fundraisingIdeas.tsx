import React, { useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar/Navbar";
import Layout from "../components/Layout";
import StartFunding from "../components/homepageComponents/StartFundingSection/StartFunding";
import { selectAuthStateState } from "../../store/slices/authSlice";

const categoriesData = [
  {
    id: "medical",
    name: "Medical & Health",
    icon: "🏥",
    badge: "0% Platform Fees",
    summary: "For surgeries, chemotherapy, specialized treatments, and pediatric emergencies.",
    milestones: [
      { name: "Phase 1: Pre-Op Admission & Diagnostic Scans", share: 30, proof: "Official hospital cost estimate & surgeon admission letter" },
      { name: "Phase 2: Surgical Procedure & Direct Hospital Settlement", share: 45, proof: "Hospital theatre invoice & direct vendor payment receipt" },
      { name: "Phase 3: Post-Op Rehabilitation & Prescriptions", share: 25, proof: "Discharge summary & pharmacy supply receipts" },
    ],
    proTip: "Direct third-party payout to verified hospital billing desks eliminates donor hesitation and speeds up donations by 70%.",
    pitchExample: "We are raising $14,000 for 4-year-old Tariro's emergency heart surgery at the National Pediatric Centre. 100% of funds are locked in milestone escrow and disbursed directly to the hospital's billing department.",
  },
  {
    id: "water",
    name: "Water & Clean Energy",
    icon: "💧",
    badge: "Infrastructure Verified",
    summary: "For community boreholes, solar microgrids, school sanitation, and rural pipelines.",
    milestones: [
      { name: "Phase 1: Geological Survey & Rig Mobilization", share: 25, proof: "Hydrogeological survey report & driller contract" },
      { name: "Phase 2: Well Drilling, Casing & Water Strike", share: 35, proof: "Geo-tagged drilling photos & water purity laboratory test" },
      { name: "Phase 3: Solar Pump, Overhead Tank & Taps", share: 40, proof: "Pump serial numbers & community commissioning ceremony photos" },
    ],
    proTip: "Post a 15-second video of the initial water strike. This milestone update consistently triggers a second wave of donations.",
    pitchExample: "Bringing clean solar-powered water to 14,000 students at Mukono Community Primary. Donors can track drilling depth and water lab test results live on our campaign timeline.",
  },
  {
    id: "education",
    name: "Education & STEM",
    icon: "🎓",
    badge: "Outcome Tracked",
    summary: "For school laptops, tuition scholarships, science labs, and vocational bootcamps.",
    milestones: [
      { name: "Phase 1: Laptop Procurement & Setup", share: 40, proof: "Supplier tax invoice & student device allocation logs" },
      { name: "Phase 2: Fiber Internet & Curriculum Access", share: 30, proof: "ISP installation receipt & LMS course enrollments" },
      { name: "Phase 3: Final Certification & Capstone Projects", share: 30, proof: "Verified exam results & public GitHub repository links" },
    ],
    proTip: "Share links to student coding projects or exam scores as verification proofs to demonstrate immediate return on donor investment.",
    pitchExample: "Equipping 85 young women in Lagos with laptops and intensive cloud engineering training. Every device serial is logged on-chain with milestone progress.",
  },
  {
    id: "emergency",
    name: "Emergency & Disaster",
    icon: "🚨",
    badge: "Fast-Track Escrow",
    summary: "For flood relief, fire recovery, food distribution, and displaced families.",
    milestones: [
      { name: "Phase 1: Immediate Food Baskets & Clean Water", share: 40, proof: "Bulk grocery distributor receipts & field distribution logs" },
      { name: "Phase 2: Emergency Tarps, Blankets & First Aid", share: 35, proof: "Relief supply manifests & community leader acknowledgments" },
      { name: "Phase 3: Temporary Shelter Repair & Rebuilding", share: 25, proof: "Building materials receipts & rebuilt structure photos" },
    ],
    proTip: "Use Fund&Trace multi-currency (USD, GBP, EUR, NGN) to receive global aid instantly and avoid wire transfer delays.",
    pitchExample: "Providing emergency shelter and nutrition kits to 350 families displaced by seasonal flooding. Verified suppliers receive direct disbursements within 24 hours.",
  },
  {
    id: "ngo",
    name: "NGO & Non-Profit",
    icon: "🌐",
    badge: "Multi-Sig Governance",
    summary: "For registered charities, public health programs, environmental advocacy, and community trusts.",
    milestones: [
      { name: "Phase 1: Program Initiation & Procurement", share: 30, proof: "Vendor contracts & itemized public ledger initialization" },
      { name: "Phase 2: Field Execution & Monitoring", share: 40, proof: "Interim impact assessment & verified attendance logs" },
      { name: "Phase 3: Final Audit & Community Handover", share: 30, proof: "Independent auditor sign-off & long-term sustainability charter" },
    ],
    proTip: "Link your charity's registration number and verified board trustees to qualify for our lowest processing tiers.",
    pitchExample: "Transparent reforestation: 1 tree planted and geo-tagged for every $2 donated. Full multi-sig governance and live audit logs for institutional partners.",
  },
  {
    id: "memorial",
    name: "Memorial & Tribute",
    icon: "🕊️",
    badge: "Compassionate Support",
    summary: "For funeral costs, memorial foundations, and enduring family support funds.",
    milestones: [
      { name: "Phase 1: Immediate Funeral & Service Costs", share: 60, proof: "Funeral home estimate & verified family beneficiary confirmation" },
      { name: "Phase 2: Memorial Foundation / Children's Trust", share: 40, proof: "Custodial educational account setup & deposit confirmation" },
    ],
    proTip: "Enable donor condolence notes on your campaign wall to create a lasting memorial guestbook for the family.",
    pitchExample: "Celebrating the life of Pastor Samuel Ade with a transparent legacy fund supporting his children's university tuition. 100% of contributions go directly to the family trust.",
  },
];

const launchRoadmap = [
  {
    step: "01",
    phase: "Pre-Launch (Days 1–3)",
    title: "Lay the Foundation of Trust",
    points: [
      "Gather high-resolution, well-lit photos of the beneficiary or project site.",
      "Itemize every single expense into 2 to 4 clear milestone phases.",
      "Secure 3 to 5 'anchor donations' from close friends and family before going public to build social momentum.",
    ],
  },
  {
    step: "02",
    phase: "Launch Day (Days 4–5)",
    title: "Generate Rapid Early Traction",
    points: [
      "Share personalized messages on WhatsApp and email before broadcasting on public social media.",
      "Clearly highlight the '100% Milestone Verified' escrow badge to reassure skeptical donors.",
      "Record a raw, authentic 60-second video from your smartphone introducing the cause.",
    ],
  },
  {
    step: "03",
    phase: "Milestone Updates (Ongoing)",
    title: "Turn Backers into Evangelists",
    points: [
      "When Milestone 1 unlocks, immediately post a photo of the purchased materials or medical admission.",
      "Tag active donors in milestone progress updates to prompt them to re-share.",
      "Donors who see proof in action are 4.8x more likely to contribute a second time.",
    ],
  },
  {
    step: "04",
    phase: "Mid-Campaign Boost (Days 10–20)",
    title: "Create Urgency & Milestones",
    points: [
      "Introduce a 48-hour matching challenge (e.g. 'Every $50 donated today will be matched by a local donor').",
      "Highlight remaining gap to the next milestone (e.g. 'Only $800 left to unlock Phase 2 water drilling').",
      "Share testimonials or direct quotes from the people being assisted.",
    ],
  },
  {
    step: "05",
    phase: "Project Completion & Audit",
    title: "Publish the Permanent Impact Log",
    points: [
      "Release the final completion photo/video celebrating the goal.",
      "Send a heartfelt thank-you email containing the transparent Fund&Trace audit link.",
      "Cultivate your donor community for future transparent initiatives.",
    ],
  },
];

export default function FundRaisingIdeas() {
  const { authenticated } = useSelector(selectAuthStateState);
  const [selectedCategory, setSelectedCategory] = useState(categoriesData[0]);
  const [targetAmount, setTargetAmount] = useState(15000);
  const [copiedPitch, setCopiedPitch] = useState(false);

  const handleCopyPitch = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(selectedCategory.pitchExample);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2500);
    }
  };

  const platformSavings = Math.round(targetAmount * 0.05); // Compared to 5% on legacy platforms

  return (
    <Layout
      description="The masterclass blueprint to building high-trust, milestone-verified fundraising campaigns on Fund&Trace. Category playbooks, milestone calculators, and conversion strategies."
      title="Fundraising Ideas & Strategy Masterclass | Fund&Trace"
      showFooter
    >
      <Wrapper>
        <Navbar />

        {/* Hero Section */}
        <section className="hero-section">
          <div className="custom-container">
            <div className="row align-items-center">
              <div className="col-lg-6 mb-5 mb-lg-0">
                <span className="hero-badge">
                  ✨ Fundraiser Masterclass & Strategy Guide
                </span>
                <h1 className="hero-title">
                  The Blueprint for High-Trust, High-Conversion Fundraising
                </h1>
                <p className="hero-subtitle">
                  Donors don't just give to stories—they give to accountability. Discover how milestone-based escrow, transparent evidence logs, and structured campaign pitches drive <strong>3.4x higher donor conversion</strong> with <strong>0% platform fees</strong>.
                </p>

                <div className="hero-cta-group d-flex flex-wrap align-items-center">
                  <Link href={authenticated ? "/StartACampaign/type" : "/SignUp"} passHref>
                    <a className="btn primary-cta mr-3 mb-2">Start a Verified Campaign</a>
                  </Link>
                  <a href="#calculator" className="btn secondary-cta mb-2">
                    Try Milestone Calculator ↓
                  </a>
                </div>

                <div className="hero-stats-row d-flex flex-wrap align-items-center mt-4 pt-3 border-top">
                  <div className="stat-item mr-4 mb-2">
                    <strong className="stat-number">0%</strong>
                    <span className="stat-text">Platform Fees on Medical & Relief</span>
                  </div>
                  <div className="stat-item mr-4 mb-2">
                    <strong className="stat-number">3.4x</strong>
                    <span className="stat-text">Higher Conversion with Milestones</span>
                  </div>
                  <div className="stat-item mb-2">
                    <strong className="stat-number">100%</strong>
                    <span className="stat-text">Disbursement Auditability</span>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="hero-image-card position-relative">
                  <img
                    src="/images/strategy_hero.jpg"
                    alt="Fundraising Strategy Team"
                    className="hero-img"
                  />
                  <div className="floating-metric-card p-3 shadow">
                    <div className="d-flex align-items-center mb-1">
                      <span className="dot mr-2"></span>
                      <strong style={{ fontSize: 13, color: "var(--color-text-heading)" }}>Live Milestone Escrow</strong>
                    </div>
                    <p className="mb-0 text-muted" style={{ fontSize: 12 }}>
                      "Every vendor invoice verified before funds unlock."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Milestone Calculator & Category Playbooks */}
        <section id="calculator" className="calculator-section py-5">
          <div className="custom-container">
            <div className="text-center max-800 mx-auto mb-5">
              <span className="section-eyebrow">Interactive Campaign Builder</span>
              <h2 className="section-heading">Category Playbook & Milestone Calculator</h2>
              <p className="section-subtext">
                Select your cause category and enter your target goal to preview recommended milestone phases, verification requirements, and savings compared to legacy platforms.
              </p>
            </div>

            {/* Category Selector Tabs */}
            <div className="category-tabs-row d-flex flex-wrap justify-content-center mb-4">
              {categoriesData.map((cat) => (
                <button
                  key={cat.id}
                  className={`cat-tab-btn ${selectedCategory.id === cat.id ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className="tab-icon mr-2">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Calculator Card */}
            <div className="calculator-card p-4 p-md-5 mb-5 shadow-sm">
              <div className="row">
                <div className="col-lg-5 pr-lg-4 mb-4 mb-lg-0 border-right-lg">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="badge-pill-custom">{selectedCategory.badge}</span>
                    <span className="text-muted font-weight-bold" style={{ fontSize: 13 }}>Step 1: Set Target</span>
                  </div>

                  <h3 className="calc-panel-title mb-2">{selectedCategory.name}</h3>
                  <p className="calc-panel-desc mb-4">{selectedCategory.summary}</p>

                  <div className="goal-input-box mb-4">
                    <label className="goal-label">Campaign Target Goal (USD):</label>
                    <div className="input-group">
                      <span className="currency-prefix">$</span>
                      <input
                        type="number"
                        min="500"
                        step="500"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(Math.max(100, Number(e.target.value)))}
                        className="form-control goal-input"
                      />
                    </div>
                  </div>

                  <div className="platform-comparison-card p-3 mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted" style={{ fontSize: 13 }}>Fund&Trace Platform Fee:</span>
                      <strong className="text-success" style={{ fontSize: 13 }}>$0.00 (0%)</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted" style={{ fontSize: 13 }}>Legacy Platforms (~5% fee):</span>
                      <span className="text-danger" style={{ fontSize: 13 }}>-${platformSavings.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between pt-2 border-top">
                      <strong style={{ fontSize: 13 }}>Extra Funds Kept for Cause:</strong>
                      <strong className="text-success" style={{ fontSize: 14 }}>+${platformSavings.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="pro-tip-box p-3">
                    <strong className="tip-title">💡 Pro-Strategy:</strong>
                    <p className="tip-text mb-0 mt-1">{selectedCategory.proTip}</p>
                  </div>
                </div>

                <div className="col-lg-7 pl-lg-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="calc-panel-title mb-0">Recommended Milestone Schedule</h4>
                    <span className="text-muted" style={{ fontSize: 13 }}>3 Phases Automated</span>
                  </div>

                  <div className="milestones-list mb-4">
                    {selectedCategory.milestones.map((m, idx) => {
                      const phaseAmount = Math.round((targetAmount * m.share) / 100);
                      return (
                        <div key={idx} className="milestone-item p-3 mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong className="milestone-name">{m.name}</strong>
                            <strong className="milestone-amount">${phaseAmount.toLocaleString()} ({m.share}%)</strong>
                          </div>
                          <div className="milestone-proof d-flex align-items-center mt-2">
                            <span className="proof-icon mr-2">📋</span>
                            <span className="proof-text"><strong>Verification Required:</strong> {m.proof}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Copyable Pitch Template */}
                  <div className="pitch-box p-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <strong style={{ fontSize: 13, color: "var(--color-text-heading)" }}>📝 High-Converting Pitch Template:</strong>
                      <button className="copy-btn" onClick={handleCopyPitch}>
                        {copiedPitch ? "✓ Copied to Clipboard!" : "Copy Pitch"}
                      </button>
                    </div>
                    <p className="pitch-text mb-0">"{selectedCategory.pitchExample}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The 5-Step Campaign Launch Roadmap */}
        <section className="roadmap-section py-5">
          <div className="custom-container">
            <div className="text-center max-800 mx-auto mb-5">
              <span className="section-eyebrow">Execution Playbook</span>
              <h2 className="section-heading">The 5-Phase Campaign Launch Roadmap</h2>
              <p className="section-subtext">
                Follow this battle-tested timeline to build early momentum, activate donor networks, and unlock milestone tranches smoothly.
              </p>
            </div>

            <div className="roadmap-grid">
              {launchRoadmap.map((rm, idx) => (
                <div key={idx} className="roadmap-card p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="step-number">{rm.step}</span>
                    <span className="phase-badge">{rm.phase}</span>
                  </div>
                  <h3 className="roadmap-title mb-3">{rm.title}</h3>
                  <ul className="roadmap-points pl-3 mb-0">
                    {rm.points.map((pt, pIdx) => (
                      <li key={pIdx} className="mb-2">{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Transparency Multiplies Donations */}
        <section className="why-transparency-section py-5">
          <div className="custom-container">
            <div className="comparison-banner p-4 p-md-5">
              <div className="row align-items-center">
                <div className="col-lg-6 mb-4 mb-lg-0">
                  <span className="comp-tag">The Fund&Trace Advantage</span>
                  <h2 className="comp-title mb-3">Why Transparent Escrow Drives 3.4x More Giving</h2>
                  <p className="comp-desc mb-4">
                    Traditional crowdfunding platforms ask donors to "trust blindly." When donors are unsure if their money actually reaches doctors, drillers, or students, they donate less or abandon checkout.
                  </p>
                  <ul className="comp-checklist pl-3 mb-0">
                    <li className="mb-2"><strong>Zero Seepage:</strong> Suppliers are paid directly against uploaded invoices.</li>
                    <li className="mb-2"><strong>Real-Time Updates:</strong> Donors get notifications whenever a milestone proof is verified.</li>
                    <li className="mb-2"><strong>Social Multiplier:</strong> Verified donors proudly share campaigns with family and colleagues.</li>
                  </ul>
                </div>

                <div className="col-lg-6">
                  <div className="comparison-table-card p-4">
                    <div className="table-responsive">
                      <table className="table mb-0 comp-table">
                        <thead>
                          <tr>
                            <th>Feature</th>
                            <th>Legacy Crowdfunding</th>
                            <th className="highlight-col">Fund&Trace</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Platform Commission</td>
                            <td className="text-danger">5% to 8% deducted</td>
                            <td className="highlight-col text-success font-weight-bold">0% (Zero Fee)</td>
                          </tr>
                          <tr>
                            <td>Disbursement Control</td>
                            <td>Lump-sum to personal bank</td>
                            <td className="highlight-col text-success font-weight-bold">Milestone Escrow</td>
                          </tr>
                          <tr>
                            <td>Proof Verification</td>
                            <td>None / Self-reported</td>
                            <td className="highlight-col text-success font-weight-bold">Geo-Tagged & Invoice Verified</td>
                          </tr>
                          <tr>
                            <td>Direct Vendor Payout</td>
                            <td>❌ No</td>
                            <td className="highlight-col text-success font-weight-bold">✅ Yes (Hospital/Supplier)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <StartFunding />
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.main`
  background: #fcfdfe;

  /* Hero Section */
  .hero-section {
    background: linear-gradient(180deg, #f1f4fe 0%, #ffffff 100%);
    padding: 140px 0 70px;
    border-bottom: 1px solid #edf0f8;

    .hero-badge {
      display: inline-block;
      background: #e9ecfe;
      color: var(--color-primary);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 4px;
      margin-bottom: 18px;
    }

    .hero-title {
      font-size: 42px;
      font-weight: 800;
      color: var(--color-text-heading);
      line-height: 1.2;
      letter-spacing: -0.025em;
      margin-bottom: 18px;

      @media screen and (max-width: 767px) {
        font-size: 30px;
      }
    }

    .hero-subtitle {
      font-size: 17px;
      color: #555b70;
      line-height: 1.65;
      margin-bottom: 28px;
    }

    .hero-cta-group {
      .primary-cta {
        background: var(--color-primary);
        color: #ffffff;
        font-weight: 700;
        font-size: 15px;
        padding: 13px 28px;
        border-radius: 4px;
        box-shadow: 0 4px 14px rgba(105, 121, 248, 0.35);
        transition: all 0.2s ease;

        &:hover {
          background: var(--color-primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(105, 121, 248, 0.45);
        }
      }

      .secondary-cta {
        background: #ffffff;
        color: var(--color-text-heading);
        border: 1px solid #d1d5db;
        font-weight: 600;
        font-size: 15px;
        padding: 13px 24px;
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover {
          background: #f8fafc;
          border-color: #9ca3af;
        }
      }
    }

    .stat-number {
      font-size: 22px;
      font-weight: 800;
      color: var(--color-text-heading);
      display: block;
    }

    .stat-text {
      font-size: 12.5px;
      color: #6b7280;
    }

    .hero-image-card {
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 16px 40px rgba(23, 28, 53, 0.12);

      .hero-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        max-height: 440px;
      }

      .floating-metric-card {
        position: absolute;
        bottom: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.5);
        max-width: 280px;

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
        }
      }
    }
  }

  /* General Headings */
  .section-eyebrow {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 8px;
  }

  .section-heading {
    font-size: 32px;
    font-weight: 800;
    color: var(--color-text-heading);
    letter-spacing: -0.02em;
    margin-bottom: 12px;

    @media screen and (max-width: 767px) {
      font-size: 26px;
    }
  }

  .section-subtext {
    font-size: 16px;
    color: #555b70;
    line-height: 1.6;
  }

  .max-800 {
    max-width: 800px;
  }

  /* Category Selector Tabs */
  .category-tabs-row {
    gap: 10px;

    .cat-tab-btn {
      background: #ffffff;
      border: 1px solid #e2e6f4;
      border-radius: 30px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      color: #4b5563;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.2s ease;

      &:hover {
        background: #f1f4fe;
        border-color: #c5d0fa;
        color: var(--color-primary);
      }

      &.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(105, 121, 248, 0.3);
      }
    }
  }

  /* Calculator Card */
  .calculator-card {
    background: #ffffff;
    border-radius: 4px;
    border: 1px solid #e5e9f5;

    @media screen and (min-width: 992px) {
      .border-right-lg {
        border-right: 1px solid #eef2f8;
      }
    }

    .badge-pill-custom {
      background: #ecfdf5;
      color: #059669;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 4px;
    }

    .calc-panel-title {
      font-size: 22px;
      font-weight: 800;
      color: var(--color-text-heading);
    }

    .calc-panel-desc {
      font-size: 14px;
      color: #555b70;
      line-height: 1.5;
    }

    .goal-input-box {
      .goal-label {
        font-size: 13px;
        font-weight: 700;
        color: var(--color-text-heading);
        margin-bottom: 6px;
      }

      .input-group {
        position: relative;
        display: flex;
        align-items: center;

        .currency-prefix {
          position: absolute;
          left: 16px;
          font-size: 18px;
          font-weight: 700;
          color: #6b7280;
          z-index: 5;
        }

        .goal-input {
          padding-left: 36px;
          font-size: 20px;
          font-weight: 800;
          color: var(--color-text-heading);
          height: 52px;
          border-radius: 4px;
          border: 2px solid #e5e7eb;

          &:focus {
            border-color: var(--color-primary);
            box-shadow: 0 0 0 4px rgba(105, 121, 248, 0.15);
          }
        }
      }
    }

    .platform-comparison-card {
      background: #f8fafc;
      border-radius: 4px;
      border: 1px solid #eef2f6;
    }

    .pro-tip-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 0 10px 10px 0;

      .tip-title {
        color: #b45309;
        font-size: 13px;
      }

      .tip-text {
        font-size: 13px;
        color: #78350f;
        line-height: 1.5;
      }
    }

    .milestone-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;

      .milestone-name {
        font-size: 14.5px;
        color: var(--color-text-heading);
      }

      .milestone-amount {
        font-size: 14.5px;
        color: var(--color-primary);
      }

      .proof-text {
        font-size: 12.5px;
        color: #4b5563;
      }
    }

    .pitch-box {
      background: #f3f5ff;
      border: 1px dashed #b9c4fd;
      border-radius: 4px;

      .copy-btn {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        font-size: 11.5px;
        font-weight: 600;
        color: #4b5563;
        padding: 3px 10px;
        cursor: pointer;

        &:hover {
          background: #eef2ff;
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
      }

      .pitch-text {
        font-size: 13.5px;
        font-style: italic;
        color: #2b3149;
        line-height: 1.55;
      }
    }
  }

  /* Roadmap Grid */
  .roadmap-section {
    background: #ffffff;
    border-top: 1px solid #edf0f8;
    border-bottom: 1px solid #edf0f8;

    .roadmap-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;

      @media screen and (max-width: 991px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media screen and (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .roadmap-card {
      background: #fcfdfe;
      border: 1px solid #e5e9f5;
      border-radius: 4px;
      transition: all 0.25s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 28px rgba(105, 121, 248, 0.08);
        border-color: #c5d0fa;
      }

      .step-number {
        font-size: 24px;
        font-weight: 900;
        color: var(--color-primary);
      }

      .phase-badge {
        font-size: 11.5px;
        font-weight: 700;
        color: #4b5563;
        background: #e5e7eb;
        padding: 3px 10px;
        border-radius: 4px;
      }

      .roadmap-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--color-text-heading);
      }

      .roadmap-points {
        font-size: 13.5px;
        color: #555b70;
        line-height: 1.6;
      }
    }
  }

  /* Comparison Banner */
  .why-transparency-section {
    .comparison-banner {
      background: linear-gradient(135deg, var(--color-text-heading) 0%, #242c52 100%);
      border-radius: 4px;
      color: #ffffff;

      .comp-tag {
        font-size: 12px;
        font-weight: 700;
        color: var(--color-primary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .comp-title {
        font-size: 30px;
        font-weight: 800;
        color: #ffffff;
        line-height: 1.25;

        @media screen and (max-width: 767px) {
          font-size: 24px;
        }
      }

      .comp-desc {
        font-size: 15px;
        color: #cbd5e1;
        line-height: 1.6;
      }

      .comp-checklist {
        font-size: 14.5px;
        color: #e2e8f0;
        line-height: 1.6;
      }

      .comparison-table-card {
        background: #ffffff;
        border-radius: 4px;
        color: var(--color-text-heading);

        .comp-table {
          th {
            font-size: 13px;
            font-weight: 700;
            border-top: none;
            color: #6b7280;
            padding: 12px 10px;
          }

          td {
            font-size: 13px;
            padding: 12px 10px;
            vertical-align: middle;
          }

          .highlight-col {
            background: #f3f5ff;
          }
        }
      }
    }
  }
`;
