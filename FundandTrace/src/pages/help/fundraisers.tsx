import Link from "next/link";
import React from "react";
import styled from "styled-components";
import HelpDropdown from "../../components/HelpComponents/HelpDropdown";
import HelpPagesLayout from "../../components/HelpComponents/HelpPagesLayout";

export default function FundraisersHelp() {
  return (
    <HelpPagesLayout description={"Fundraisers FAQ"} page="Fundraisers">
      <Wrapper>
        <section className="mb-5">
          <article className="d-flex align-items-center mb-4">
            <img
              src="/images/icons/helpCampaigns.svg"
              alt="users icon"
              width="24px"
              height="30px"
            />
            <h3 className="ml-3 mb-0">Campaigns</h3>
          </article>
          <HelpDropdown title="How do I create a campaign?">
            <p>
              Campaign running is an incredible experience! It is also a lot to
              deal with, so here is a useful step-by-step guide to build your
              campaign.
            </p>
            <h4>Getting started</h4>
            <ul className="p-3">
              <li>
                Visit{" "}
                <a
                  href="https://fundandtrace.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  fundandtrace.com
                </a>
              </li>
              <li>
                Click on “Start a campaign” button. If you have an account
                already, click on the “Sign in” button.{" "}
              </li>
              <img
                src="/images/help/fundraisers1.png"
                alt="start a campaign image"
                style={{ width: "100%", maxWidth: "773px", height: "100%" }}
                className="my-3"
              />

              <li>
                Fill out the necessary details to get signed up! Thereafter, a
                mail will be sent to you to verify your account.
              </li>
              <div className="d-flex flex-md-row flex-column align-items-center my-3">
                <img
                  src="/images/help/fundraisers2.png"
                  alt="start a campaign image"
                  style={{ width: "42%", maxWidth: "396px", height: "100%" }}
                  className="fundraiserImage"
                />
                <img
                  src="/images/icons/slidefrontdark.svg"
                  alt="arrow"
                  style={{
                    width: "33px",
                    maxWidth: "33px",
                    height: "20px",
                    transform: "rotate(90deg",
                  }}
                  className="d-md-none my-3"
                />
                <img
                  src="/images/icons/slidefrontdark.svg"
                  alt="arrow"
                  style={{ width: "33px", maxWidth: "33px", height: "20px" }}
                  className="d-none d-md-block "
                />
                <img
                  src="/images/help/fundraisers3.png"
                  alt="start a campaign image"
                  style={{ width: "42%", maxWidth: "396px", height: "100%" }}
                  className="fundraiserImage"
                />
              </div>
              <li>
                You have an account now! The next step is to start creating your
                campaign
              </li>
              <img
                src="/images/help/fundraisers4.png"
                alt="start a campaign image"
                style={{ width: "100%", maxWidth: "484px", height: "100%" }}
                className="my-3"
              />
              <li>
                Fill out the necessary baisc information: Basics, Content,
                Funding and Settings. Preview how your campaign would look like
                on the Pre-Launch page. When you’re sure about the information
                you filled, you can now launch your campaign!{" "}
              </li>
              <img
                src="/images/help/fundraisers5.png"
                alt="start a campaign image"
                style={{ width: "100%", maxWidth: "713px", height: "100%" }}
                className="my-3"
              />
            </ul>
          </HelpDropdown>
          <HelpDropdown title="How do I share my campaign?">
            <p>
              Fund&Trace offers a range of share tools for every campaign to
              help you spread the news. The Campaign Owner and the contributors
              may use the Share Tools and are placed in the Pitch Image or Video
              tool bar adjacent to the Campaign.
            </p>
            <h4>How to use the Share tools</h4>
            <p>The tools below are explained, from left to right:</p>
            <img
              src="/images/help/sharing.png"
              alt="manage Emails"
              style={{ width: "100%", maxWidth: 300, height: "100%" }}
            />
            <ul>
              <li>
                <strong>Facebook</strong> - Share the campaign through your
                Facebook page
              </li>
              <li>
                <strong>Twitter </strong>- Tweet the campaign out to your
                followers
              </li>
              <li>
                <strong>WhatsApp</strong> - Share the campaign with family and
                friends
              </li>
              <li>
                <strong>Instagram</strong> - Share the campaign through your
                Instagram page
              </li>
              <li>
                <strong>Link</strong> - Copy the campaign URL and paste it into
                an email, social media update, or anywhere else you'd like to
                share your campaign
              </li>
            </ul>
            <p>
              When logged in, you can use some of these sharing features,
              Fund&Trace can track all those people who visit the campaign via a
              shared link. These are the tools you utilize if you run or compete
              in a reference contest.
            </p>
          </HelpDropdown>
          <HelpDropdown title="How do I find my campaign?">
            <h4>I can’t search for my campaign</h4>
            <p>
              Search works for Fund&Trace by the title of campaign. You may not
              have enough activity on your campaign page if you cannot find your
              campaign by title. After the first 48 hours, at least two
              contributions are required in Fund&Trace for your campaign.
            </p>
            <h4>Why can’t I find my charity name in search?</h4>
            <p>
              Unless your charity is in your campaign’s title, it won’t be
              searchable. If you wish to add your charity name to your title,
              you can do so, but be informed that altering your title will also
              affect your URL, so choose wisely!
            </p>
          </HelpDropdown>
          <HelpDropdown title="Donor comments">
            <p>
              Fund&Trace wants you to succeed in every campaign. Keeping in
              touch with your donors is essential to ensure that communication
              is positive and open, and that a vibrant community is established.
              Donors want to stay up-to-date throughout your campaign and be in
              touch with its development.
            </p>

            <p>
              On the campaign page, the comments tab is a place where supporters
              may give feedback as well as talk to the fundraiser and other
              supporters about whatever questions and concerns you might have.
              It is also an excellent tool for information sharing and an
              expedient approach for individual donors to answer questions.
              Keeping a healthy discussion with backers through comment keeps
              the process clear and in addition to its own customer support
              channels can be a helpful asset.
            </p>
            <p>
              By choosing Open comments, you may improve your comments tab even
              further. Anyone logging on to the fundandtrace site can leave a
              remark on your campaign page if Open Comments is enabled. Only
              your donors can post a remark without Open Comments. Open Comments
              should be opted for in the default setting for new campaign pages.
            </p>
            <p>
              The benefit of enabling Open Comments is that it enables you to
              connect to perhaps unwilling donors. Anyone interested in your
              campaign may ask a question with Open Comments and obtain the
              necessary information.
            </p>
            <img
              src="/images/help/comment.png"
              alt="comment image"
              style={{ width: "100%", maxWidth: 300, height: "100%" }}
            />
          </HelpDropdown>
          <HelpDropdown title="How do I access my campaign’s dashboard?">
            <p>
              Fund&Trace's Campaign Dashboard helps you leverage the full
              potential of our platform. The Campaign Dashboard allows you, the
              campaign owner, to see how close you are to your goal, analyze
              trends and the impact of your online marketing efforts. The
              Campaign Dashboard provides you with data and Analytics to help
              you track your page views, referrals and contributions.
            </p>
            <h4>To navigate there:</h4>
            <ul className="p-3">
              <li>
                Login to your fund&trace account and visit your dashboard page
              </li>
              <li>Click on the campaign you want to access</li>

              <div className="d-flex flex-md-row flex-column align-items-center my-3">
                <img
                  src="/images/help/dashboard1.png"
                  alt="start a campaign image"
                  style={{ width: "42%", maxWidth: "396px", height: "100%" }}
                  className="fundraiserImage mb-md-0 mb-3"
                />

                <img
                  src="/images/help/dashboard2.png"
                  alt="start a campaign image"
                  style={{ width: "42%", maxWidth: "396px", height: "100%" }}
                  className="fundraiserImage"
                />
              </div>
            </ul>
          </HelpDropdown>
        </section>
        <section className="mb-5">
          <article className="d-flex align-items-center mb-4">
            <img
              src="/images/icons/helpPayments.svg"
              alt="users icon"
              width="24px"
              height="30px"
            />
            <h3 className="ml-3 mb-0">Payments</h3>
          </article>
          <HelpDropdown title="ID verification and receiving funds">
            <h4>What is ID verification?</h4>
            <p>
              You may need certain checks to verify your name and information
              before we can send you your campaign fundings. Any organization
              collecting and sending money has a number of checks to be carried
              out, named "Know Your Customer" or "KYC".
            </p>
            <h4>What documents will I need to provide?</h4>
            <p>
              A government-issued photo ID is requested to upload. You will be
              required to upload the ID in JPG, PNG or PDF format. Please ensure
              that a clear, legible color photo is uploaded according to this
              criterion. In some situations, supplementary documents, such as an
              address verification document, may be requested.
            </p>
            <h4>How do I do this?</h4>
            <p>
              If you meet the above requirements, we'll send you an email to let
              you know that you need to complete some additional verification
              steps.
            </p>
            <p>
              You can also find the link to verify your identity on the Contact
              tab of your Campaign Editor. Select the upload image field and
              upload your Identification document.
            </p>
            <img
              src="/images/help/verification.png"
              alt="comment image"
              style={{ width: "100%", maxWidth: 473, height: "100%" }}
            />
          </HelpDropdown>
          <HelpDropdown title="Fees for Campaigners: How much does Fund&Trace cost?">
            <p className="mb-0">
              You can check the fees for campaigns in the Fees section{" "}
              <Link href="/fees" passHref>
                <a target="_blank" rel="noreferrer">
                  here
                </a>
              </Link>
              .
            </p>
          </HelpDropdown>
          <HelpDropdown title="How do I receive donations after my campaign ends?">
            <p>
              Fund&Trace will send a disbursement to your bank account based on
              the funding request you send after your campaign ends, provided
              your bank account information is correct and accurate.
            </p>

            <p>
              Fund&Trace offers three types of funding requests: One-off,
              Monthly and Third party. For all funding requests, contributions
              are held until the end of your campaign and then sent to your bank
              within 5 business days after your campaign has ended. Once you
              have received your first contribution, you can view your raised
              funds on the Dashhboard tab of your campaign Dashboard. Read more
              about One-off, Monthly and Third party funding requests.
            </p>
          </HelpDropdown>
          <HelpDropdown title="How do I raise money for a non-profit?">
            <p>
              When creating your campaign, please select the{" "}
              <strong>Non profit</strong> option on the "Start a Campaign" page.
              Below is a list of information we will need about the
              organization, this can be completed on the Funding tab of your
              campaign page:
            </p>

            <ul>
              <li>
                Organization name: Enter the name of the nonprofit organization
                as it is filed with the IRS, or local government agency in your
                country
              </li>
              <li>
                Registration number: Enter the registration number as it is
                filed with the IRS, or local government agency in your country
              </li>
              <li>
                Legal first name: Enter the legal first name belonging to the
                owner or director of the nonprofit organization
              </li>
              <li>
                Legal last name: Enter the legal last name belonging to the
                owner or director of the nonprofit organization
              </li>
              <li>
                Date of Birth: Enter the date of birth belonging to the owner or
                director of the nonprofit organization
              </li>
              <li>Logo: Upload the logo of the nonprofit organization.</li>
            </ul>
          </HelpDropdown>
        </section>
      </Wrapper>
    </HelpPagesLayout>
  );
}

const Wrapper = styled.section`
  h3 {
    font-style: normal;
    font-weight: 600;
    font-size: 18px;
    line-height: 24px;
    display: flex;
    align-items: center;
    color: #272424;
  }
  .fundraiserImage {
    @media screen and (max-width: 767px) {
      width: 100% !important;
    }
  }
  h4 {
    font-style: normal;
    font-weight: bold;
    font-size: 18px;
    line-height: 24px;
    /* identical to box height, or 133% */

    display: flex;
    align-items: center;

    color: #272424;
  }
`;
