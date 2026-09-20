import Link from "next/link";
import React from "react";
import styled from "styled-components";
import HelpDropdown from "../../components/HelpComponents/HelpDropdown";
import HelpPagesLayout from "../../components/HelpComponents/HelpPagesLayout";

export default function DonorsHelp() {
  return (
    <HelpPagesLayout description={"Donors FAQ"} page="Donors">
      <Wrapper>
        <section className="mb-5">
          <article className="d-flex align-items-center mb-4">
            <img
              src="/images/icons/helpStatement.svg"
              alt="users icon"
              width="24px"
              height="30px"
            />
            <h3 className="ml-3 mb-0">Funding statements</h3>
          </article>
          <HelpDropdown title="What is a funding statement?">
            <p>
              A funding statement is a displayable prose statement that
              describes the funding for a campaign. It is a well-detailed
              description of the funding requests made by the fundraiser
              (campaign owner) and the disbursements the platform makes after a
              funding request is approved. This is all part of our core as an
              organization; to make crowdfunding as transparent as possible.
              That way, every activity including funding is made open to the
              public.
            </p>
          </HelpDropdown>
          <HelpDropdown title="How do I track a campaign?">
            <p>
              You can track any campaign’s activity by going to the campaign
              page and clicking the Track Campaign button. This will take you to
              a page that shows explictly all funding requests and disbursements
              made for the camapign.
            </p>
            <div className="d-flex flex-wrap">
              <img
                src="/images/help/track1.png"
                alt="manage Emails"
                className="mr-md-1 mb-3 mb-lg-0"
                style={{ width: "100%", maxWidth: 433, height: "100%" }}
              />
              <img
                src="/images/help/track2.png"
                alt="manage Emails"
                style={{ width: "100%", maxWidth: 469, height: "100%" }}
              />
            </div>
          </HelpDropdown>
          <HelpDropdown title="Why are funding statements sent to donors?">
            <p>
              We send funding statements to donors to promote inclusiveness in
              causes they are passionate about. They also get to receive updates
              from time to time about how the campaign is performing. This is
              all part of our core as an organization - transparency.
            </p>
          </HelpDropdown>
        </section>
        <section className="mb-5">
          <article className="d-flex align-items-center mb-4">
            <img
              src="/images/icons/helpDonations.svg"
              alt="users icon"
              width="24px"
              height="30px"
            />
            <h3 className="ml-3 mb-0">Donations</h3>
          </article>
          <HelpDropdown title="How to evaluate a campaign?">
            <p>
              Contributing to a campaign for Fund&Trace is not the same as
              buying from a shop.
            </p>
            <p>
              One of the amazing elements of crowdfunding is to help ideas come
              to reality! <br />
              The campaign owner and team members will be listed on the campaign
              page. When you click on the Campaign Owner's Name, you can see
              more information about the campaign owner.
            </p>
            <ul>
              <li>Who are they?</li>
              <li>Why are they raising money?</li>
              <li>What is their background and experience?</li>
              <li>Why are they passionate?</li>
              <li>Are photos of the team members included?</li>
              <li>Does the campaigner appear in the campaign’s video?</li>
              <li>
                Are external links included (websites, news/media coverage,
                etc.)?
              </li>
            </ul>
          </HelpDropdown>
          <HelpDropdown title="I’m having trouble contributing">
            <p className="mb-0">
              We're sorry you're having trouble with your contribution. There
              are many reasons why a transaction might fail, including browser
              issues or blocks by your credit card company, but there are
              usually simple solutions. When your contribution is successful,
              you will be directed to a thank you page and we will send an
              automatic email confirmation to the email you provided during the
              contribution process.
            </p>
            <p className="mb-0">
              If you are using an outdated version of your Internet browser
              (i.e. Internet Explorer, Google Chrome, Mozilla Firefox, Safari,
              Opera, etc), you may be experiencing a browser incompatibility.
              Please double check that your browser has been updated to its most
              recent version. We also suggest switching to a different browser
              (one that has also been updated to its most recent version) and
              trying your contribution again.
            </p>
          </HelpDropdown>
          <HelpDropdown title="Refunds: Can I get my money back?">
            <p>
              Donors give, not to Fund&Trace, but to fundraisers. However,
              before any of the following occurs, Fund&Trace can refund your
              contribution:
            </p>
            <ul>
              <li>The donation funds have been paid out to the fundraiser;</li>
              <li>
                When the campaign has ended, the reimbursement requests must be
                directed to the fundraiser and processed in accordance with
                their unique refund / return policy if Fund&Trace has provided
                monies to the fundraiser.
              </li>
            </ul>
            <p>
              In the event that the campaign has ended and Fund&Trace has
              disbursed funds to the campaign owner, refund requests must be
              directed to the fundraiser and handled in accordance with their
              separate refund/return policy. Fund&Trace is not responsible for
              refunds outside of our Refund Policy and you should work directly
              with the campaign owner to resolve the refund request and the
              method of refund.
            </p>
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
`;
