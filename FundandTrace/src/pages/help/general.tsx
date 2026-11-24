import Link from "next/link";
import React from "react";
import styled from "styled-components";
import HelpDropdown from "../../components/HelpComponents/HelpDropdown";
import HelpPagesLayout from "../../components/HelpComponents/HelpPagesLayout";

export default function GeneralHelp() {
  return (
    <HelpPagesLayout description={"General FAQ"} page="General">
      <Wrapper>
        <section className="mb-5">
          <article className="d-flex align-items-center mb-4">
            <img
              src="/images/icons/user.svg"
              alt="users icon"
              width="24px"
              height="30px"
            />
            <h3 className="ml-3 mb-0">Popular Questions</h3>
          </article>
          <HelpDropdown title="How is Fund&Trace different from other crowdfunding sites?">
            <p>
              Donations are not paid straight to the organiser. They are held in
              escrow and released milestone by milestone: the organiser submits a
              funding request with what the money is for, our team reviews it,
              and only approved amounts are paid out — sometimes directly to the
              hospital, school or supplier.
            </p>
            <p className="mb-0">
              Every approved payout appears on the campaign&rsquo;s public
              tracker, so donors can see exactly where their money went.{" "}
              <Link href="/workings">See how it works</Link>.
            </p>
          </HelpDropdown>
          <HelpDropdown title="Does Fund&Trace charge fees?">
            <p className="mb-0">
              Fund&Trace charges no platform fee. Payment providers (card
              networks, Stripe, Flutterwave, Paystack) charge their own processing
              fees. See our <Link href="/fees">fees page</Link> for the details.
            </p>
          </HelpDropdown>
          <HelpDropdown title="What happens if a campaign looks fraudulent?">
            <p>
              Use &ldquo;Report this campaign&rdquo; at the bottom of any campaign
              page. Donors can also file a dispute on a campaign they supported.
            </p>
            <p className="mb-0">
              If enough verified donors (or a large enough share of the money
              raised) raise disputes, the campaign&rsquo;s escrow is frozen
              automatically: no further payouts can be approved until our trust
              and safety team has investigated. If fraud is confirmed, remaining
              funds are refunded to donors.
            </p>
          </HelpDropdown>
        </section>

        {/* popular */}
        <section className="mb-5">
          <article className="d-flex align-items-center mb-4">
            <img
              src="/images/icons/user.svg"
              alt="users icon"
              width="24px"
              height="30px"
            />
            <h3 className="ml-3 mb-0">Account</h3>
          </article>
          <HelpDropdown title="How do I reset my password?">
            <p>
              As long as you can access the email address on your account, you
              can set a new password yourself:
            </p>
            <ol>
              <li>
                Select &ldquo;Forgot your password?&rdquo; on the{" "}
                <Link href="/SignUp/SignIn">sign in page</Link>.
              </li>
              <li>
                Enter the email address you signed up with and request a reset
                link.
              </li>
              <li>
                Open the link in the email and choose a new password.
              </li>
            </ol>
            <p className="mb-0">
              If you know your password but still can&rsquo;t sign in,{" "}
              <Link href="/contact">contact us</Link>.
            </p>
          </HelpDropdown>
          <HelpDropdown title="How do I change my profile photo?">
            <ul>
              <li>Go to “My Account” in the dropdown at the top right.</li>
              <li>Click on “Edit Profile”.</li>
              <li>
                You can now change your profile picture by clicking “Choose
                profile picture”.
              </li>
            </ul>
          </HelpDropdown>
          <HelpDropdown title="How do I manage emails from Fund&Trace?">
            <p>
              Fund&Trace provides you with the option of unsubscribing to emails
              of campaign updates and funding statements. This can be done by
              clicking the link below any email you get and it takes you to a
              subscription page where you can choose to stop receiving emails.
              Also note that when signing up, you have the option not to receive
              emails from Fund&Trace.
            </p>
            <img
              src="/images/help/manageEmails.png"
              alt="manage Emails"
              style={{ width: "100%", maxWidth: 385, height: "100%" }}
            />
          </HelpDropdown>
        </section>
        <section className="mb-5">
          <article className="d-flex align-items-center mb-4">
            <img
              src="/images/icons/helpSecurity.svg"
              alt="users icon"
              width="24px"
              height="30px"
            />
            <h3 className="ml-3 mb-0">Trust & Safety</h3>
          </article>
          <HelpDropdown title="Policy updates">
            <p className="mb-0">
              When we change our <Link href="/terms">terms</Link> or{" "}
              <Link href="/privacy">privacy policy</Link>, we update the date at
              the top of the page and email account holders about material
              changes before they take effect.
            </p>
          </HelpDropdown>
          <HelpDropdown title="Fundraisers: Why do you ask for my ID?">
            <p className="mb-0">
              You may need certain checks to verify your name and information
              before we can send you your campaign funds. Any organization
              collecting and sending money has a number of checks to be carried
              out, named "Know Your Customer" or "KYC". Therefore, it is quite
              important for us to verify your identity before you can start a
              campaign or when a funding request is made. However, be rest
              assured your information is safe with us and follows the
              international standard legal practices.
            </p>
          </HelpDropdown>
          <HelpDropdown title="What does Fund&Trace do to protect us?">
            <p>
              The trust and safety method of Fund&Trace includes many
              safeguarding tools; our trust, security staff and you. We have to
              work together to provide our worldwide community with a secure and
              trustworthy platform. Our confidence and security team carries out
              automated and manual reviews regularly. Our staff examines
              feedbacks from our community and partners, in addition to routine
              reviews.
            </p>
            <p>
              We are regularly questioned about the feasibility of initiatives
              and although we cannot examine every project, we communicate
              directly with the campaign owner whenever questions or concerns
              are received. By checking at the campaign history, team profiles,
              updates and comments we invite donors to learn about the project,
              to have a good feeling of what you support. Supporters should also
              directly send questions or comments to campaign owners.
            </p>
            <p className="mb-0">
              Let us know if you are not comfortable with anything. To report a
              campaign to our trust and safety team, use the "Report this
              Campaign" link at the bottom of every campaign. In order to decide
              the right course of action to protect our community, the trust and
              safety team monitors the input.
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
