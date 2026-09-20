import React from "react";
import Link from "next/link";
import styled from "styled-components";
import StartFunding from "../components/homepageComponents/StartFundingSection/StartFunding";
import Layout from "../components/Layout";
import Navbar from "../components/Navbar/Navbar";

export default function PrivacyPage() {
  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg"
      showFooter
      title="Privacy Policy | Fund&Trace"
      description="The Privacy policies involved with using fund&trace"
    >
      <Wrapper>
        <section style={{ height: "77px" }}>
          <Navbar />
        </section>
        <Header className="mb-3">
          <h1 className="text-heading mb-0 text-center">
            <span style={{ color: "var(--color-primary)" }}>Fund&Trace</span> Privacy Policy
          </h1>
        </Header>
        <div className="mb-4 custom-container">
          <p className="text-center mb-0">Date of posting: 7th August 2021</p>
        </div>
        <section className="mb-4 custom-container">
          <p>
            FundandTrace is committed to respecting your privacy when we use
            your personal data. We use your data as described below to allow you
            to use FundandTrace, enhance your experience using our platform,
            maximise your giving network and ensure that no good cause goes
            unfunded (and of course comply with applicable data protection
            laws!)
          </p>
          <ul>
            <li>
              <a href="#Who Are We?">Who Are We?</a>
            </li>
            <li>
              <a href="#How to Reach Our Data Protection Officer?">
                How to Reach Our Data Protection Officer?
              </a>
            </li>
            <li>
              <a href="#How Do We Notify You of Changes to this Policy?">
                How Do We Notify You of Changes to this Policy?
              </a>
            </li>
            <li>
              <a href="#What Are Your Rights?">What Are Your Rights?</a>
            </li>
            <li>
              <a href="#What Data Do We Collect?">What Data Do We Collect?</a>
            </li>
            <li>
              <a href="#What Happens If You Don’t Want Us to Have Your Data?">
                What Happens If You Don’t Want Us to Have Your Data?
              </a>
            </li>
            <li>
              <a href="#How Do We Use Your Data?">How Do We Use Your Data?</a>
            </li>
            <li>
              <a href="#With Whom Are We Sharing Your Data?">
                With Whom Are We Sharing Your Data?
              </a>
            </li>
            <li>
              <a href="#How Do Charity Partners Use My Data?">
                How Do Charity Partners Use My Data?
              </a>
            </li>
            <li>
              <a href="#How Do We Use Personal Data of Our Partner Users?">
                How Do We Use Personal Data of Our Partner Users?
              </a>
            </li>
            <li>
              <a href="#How Long Do We Keep Your Data?">
                How Long Do We Keep Your Data?
              </a>
            </li>
            <li>
              <a href="#Children's Data">Children's Data</a>
            </li>
            <li>
              <a href="#FundandTrace App">FundandTrace App</a>
            </li>
            <li>
              <a href="#StreamRaiser">StreamRaiser™</a>
            </li>
            <li>
              <a href="#Users Located in the UK and European Union">
                Users Located in the UK and European Union
              </a>
            </li>
          </ul>
        </section>

        <section className="mb-4 custom-container" id="Who Are We?">
          <h2 className="text-heading">Who Are We?</h2>
          <p>
            FundandTrace operates its business in a number of countries and
            through different entities depending on your location. When you
            access FundandTrace in these countries, FundandTrace is provided by
            the following relevant entity:
          </p>
          <ul>
            <li>
              in the <b>UK and the European Economic Area</b> by dbdworldwide
              Limited, an entity established under the laws of England and
              Wales, WeWork, 10 York Road, London, SE1 7ND, United Kingdom;
            </li>
            <li>
              in <b>Australia</b> by Everyday Hero Pty Ltd trading as
              FundandTrace Australia (A.C.N. 117 080 430), Level 8, 333 Ann
              Street Brisbane QLD 4000; and
            </li>
            <li>
              in <b>all other countries</b>, including the <b>United States</b>{" "}
              by JG US, Inc., a Delaware corporation whose principal place of
              business is 65 Fairchild Street, Charleston, SC 29492.
            </li>
          </ul>
          <p>
            You can contact FundandTrace via{" "}
            <a href="mailto:help@fundandtrace.com" target="_blank" rel="noopener noreferrer">
              help@fundandtrace.com{" "}
            </a>{" "}
            or by writing to the address listed above for the FundandTrace
            entity providing services to you. This Policy applies to our
            collection and use of your data in connection with our services,
            like FundandTrace.com and JustTextFT by Vodafone (the “Services”).
          </p>
        </section>
        <section
          className="mb-4 custom-container"
          id="How to Reach Our Data Protection Officer?"
        >
          <h2 className="text-heading">
            {" "}
            How to Reach Our Data Protection Officer?
          </h2>
          <p>
            To contact FundandTrace’s Data Protection Officer regarding our
            processing of your personal data, email{" "}
            <a href="mailto:privacy@fundandtrace.com" target="_blank" rel="noopener noreferrer">
              privacy@fundandtrace.com{" "}
            </a>
            .
          </p>
        </section>
        <section
          className="mb-4 custom-container"
          id="How Do We Notify You of Changes to this Policy?"
        >
          <h2 className="text-heading">
            How Do We Notify You of Changes to this Policy?
          </h2>
          <p>
            We keep this Policy under regular review and place updates on
            fundandtrace.com. We will also provide notifications of material
            changes via email or other channels. If you keep using the Services
            after we notify you, you consent to the updated Privacy Policy. If
            not, you may cancel your account.
          </p>
        </section>
        <section className="mb-4 custom-container" id="What Are Your Rights?">
          <h2 className="text-heading">What Are Your Rights?</h2>
          <p>
            FundandTrace recognises that your personal data belongs to you and
            we don’t wish to use it in ways that you don’t want us to.
          </p>
          <p>
            You can control whether or not you receive marketing email from
            fundandtrace by visiting the Notifications Centre in your Account.
          </p>
          <p>
            If granted by applicable laws, you can also exercise a variety of
            rights regarding our use of your data:
          </p>
          <ul>
            <li>
              You can ask us for a copy of the information we have about you
            </li>
            <li>
              You can ask us to correct any incorrect data we have about you and
              you can also update your account details yourself at any time by
              visiting your FundandTrace account
            </li>
            <li>You can ask us to delete your data</li>
            <li>
              You can ask for your data in a common, machine-readable format
            </li>
            <li>
              You can object to any processing we do on the basis of legitimate
              interests or to any automated decision-making
            </li>
            <li>You can ask us to restrict the processing of your data</li>
          </ul>
          <p>
            To exercise any of the foregoing rights, click here. Note that some
            of these rights may not be enforceable in your jurisdiction and some
            aren’t absolute—for example, we may not be able to forget you if we
            have to keep some of your data to comply with the law—but we’ll
            evaluate your request in accordance with applicable data protection
            laws. FundandTrace will respond to your request within one month of
            receiving it. Also, note that if you’re located in the UK or the EU,
            you have the right to lodge a complaint with the UK Information
            Commissioner’s Office or the supervisory authority in your country
            of residence or place of work.
          </p>
        </section>
        <section
          className="mb-4 custom-container"
          id="What Data Do We Collect?"
        >
          <h2 className="text-heading">What Data Do We Collect?</h2>
          <p>
            We don’t receive any personal data about you other than what you
            provide us, either by creating an account, using the Services, from
            Facebook when you agree to connect your Facebook account to
            FundandTrace, or data we can infer from your use of the Services.
          </p>
          <p>
            <b>When you create a FundandTrace account:</b> We will collect basic
            contact information about you to set up your account you so you can
            make donations or raise funds. This will include your name, address
            and email address. We will also ask you to register a username and
            password so you can gain secure access to your account in the
            future.
          </p>
          <p>
            Alternatively, you may authorise us to collect your basic personal
            details from a secure online source (e.g. Google, Facebook, PayPal
            or a sponsor charity) to which you have already provided this
            information.
          </p>
          <p>
            We enable you to set an image for your FundandTrace profile and this
            image is shown as a thumbnail next to all of your actions on the
            platform, unless you have chosen to hide your name and photo from
            the public when you donate. Please note that this image is dynamic
            and not frozen in time—e.g. if you change your image in 2018, the
            new image will appear next to your activities from 2015.
          </p>
          <p>
            <b>When you sign in to FundandTrace using your Facebook account</b>:
            If you choose to login via Facebook, we will obtain access to your
            Facebook public profile information and email address. We will use
            this information to allow you to login and populate our records
            about you. If you give us permission (via Facebook’s preference
            settings), we may also obtain access to your friend list but we only
            receive the names of your friends who are also FundandTrace users.
            We will only use this to see if people on your friends list are also
            using our website and as set out in{" "}
            <a href="#How Do We Use Your Data?">
              {" "}
              How we use personal information
            </a>
            below. You can control whether or not Facebook shares this data with
            us, either by changing your preferences when you first login to
            FundandTrace with your Facebook account or by visiting the app
            setting controls on Facebook’s platform.
          </p>
          <p>
            <b>When you make a donation:</b> To enable us to process donations,
            we will collect basic payment information as well as your name, home
            address and email address. Your name and the amount you've donated
            will display on the public page, unless you select the “Hide my name
            and photo from public view” option when you donate. As well as
            hiding your details from the public when you donate, you can also
            change the display name to something else, such as a nickname or
            your initials.
          </p>
          <p>
            <b>When you create a Fundraising or Crowdfunding Page:</b> We will
            use the details you provided when you set up your account to create
            your Fundraising Page or FundandTrace Crowdfunding Page. We will
            also collect details of the charity or not-for-profit that you are
            supporting, or the details for your proposed Crowdfunding Page.
            Where applicable, we will ask you to provide details of how and when
            you are intending to fundraise and/or the occasion you are
            recognising by carrying out the fundraising. Where you create a
            Crowdfunding Page, we will also collect your title (if you choose to
            provide it), date of birth, telephone number and personal bank
            account details.
          </p>
          <p>
            <b>When you give us information about others:</b> You may decide to
            provide us with information about others (or authorise us to collect
            this information on your behalf from your social networks or your
            email contacts list) for example:
          </p>
          <ul>
            <li>
              so we can help you tell your friends and family about a
              Crowdfunding Page you are running or charity fundraising you are
              carrying out; or
            </li>
            <li>
              if you start fundraising or crowdfunding for, or in the memory or
              in celebration of, another person
            </li>
          </ul>
          <p>
            You must ensure that they have agreed to you providing us with their
            information. Where required by local laws, we would advise you to
            keep a record of their agreement and provide them with a copy of, or
            link to, this Policy. This is especially the case if you provide us
            with sensitive information about them (e.g. a reference to an
            illness or health condition).
          </p>
          <p>
            You should also only contact individuals using the Services who you
            know would be happy to hear from you and must not use our Services
            to send unsolicited 'spam' messages.
          </p>
          <p>
            If you create a Crowdfunding Page for a club, organisation, body or
            association which is managed by someone other than yourself, you
            must ensure that the manager(s) of that club, organisation etc.
            agrees to your fundraising (e.g. you are a member of a sports club
            and want to raise funds for a new clubhouse - you must seek the
            agreement of the sports club committee).
          </p>
          <p>
            <b>
              When you register your interest to hear about Charity Places for
              Events:
            </b>
            : We collect personal information when you register your interest to
            be informed about Charity Places for an Event. This will include
            information such as your name and email address.
          </p>
          <p>
            <b>When you apply for a Charity Place: </b>We collect personal
            information when you apply for a Charity Place for an Event. This
            will include your name, email address and any additional questions
            which help the charity to review your application
          </p>
          <p>
            <b>When you use the Services: </b>We also collect information about
            your use of our Services, including your IP address, mobile device
            identifier, how much time you spend on the site, and what you do,
            like or view. We do this through the use of cookies. To read more
            about our use of cookies, please refer to our separate Cookies page
          </p>
        </section>
        <section
          className="mb-4 custom-container"
          id="What Happens If You Don’t Want Us to Have Your Data?"
        >
          <h2 className="text-heading">
            What Happens If You Don’t Want Us to Have Your Data?
          </h2>
          <p>
            You are not required to provide personal data to us. Note, however,
            that your failure to do so may affect our ability to provide the
            Services you request. For example, we are unable to process your
            donation to a fundraiser if you do not provide your payment
            information.
          </p>
        </section>
        <section
          className="mb-4 custom-container"
          id="How Do We Use Your Data?"
        >
          <h2 className="text-heading">How Do We Use Your Data?</h2>
          <p>
            FundandTrace uses your personal data to provide the services you
            request, to personalise your FundandTrace experience, to send you
            communications and to enhance your ability to raise funds for the
            causes you care about. We also use your data to help us make
            FundandTrace better and to advertise to you.
          </p>
          <p>
            <b>Services Requested:</b> We use your information to provide our
            Services to you:
          </p>
          <ul>
            <li>
              using your account data to enable you to take advantage of our
              platform’s features, like setting up a Fundraising or Crowdfunding
              Page
            </li>
            <li>processing donations and claiming Gift Aid, if applicable</li>
            <li>
              where you set up a Crowdfunding Page, to carry out bank account
              verification and identity checking, including with a credit
              reference agency
            </li>
          </ul>
          <p>
            <b>Personalising your FundandTrace:</b> We want to enhance your
            experience with FundandTrace by tailoring the site to your
            interests:
          </p>
          <ul>
            <li>
              When you “like” a cause or type of cause, we use that information
              to suggest causes you may be interested in and show them to you on
              the home Feed
            </li>
            <li>
              In your Feed, we’ll also show you actions taken by people in your
              giving network—Facebook friends (if you’ve linked your account to
              FundandTrace) who are also FundandTrace users and people to whose
              Fundraising/Crowdfunding Pages you have donated
            </li>
            <li>
              In your Feed and elsewhere in the Services, we’ll show you causes
              related to causes you have fundraised for or donated to in the
              past
            </li>
          </ul>
          <b>Communications:</b> We use your information to send you some
          different types of emails and you can stop receiving them as set forth
          below:
          <section
            className="w-100 mt-4 overflow-auto"
            style={{ width: "100%", maxWidth: "100%" }}
          >
            <section className="border mx-auto" style={{ width: 1044 }}>
              <article className="w-100 d-flex">
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "60%" }}
                >
                  Types of Emails
                </div>

                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "40%" }}
                >
                  How Can You Stop Getting Them?
                </div>
              </article>
              <article className="border-top border-bottom w-100 d-flex">
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "60%" }}
                >
                  Related to registering your interest in Charity Places for an
                  Event. FundandTrace will send you information relating to
                  Charity Places and, if successful, how to set up a
                  FundandTrace fundraising page or, if not successful, how to
                  apply for another Charity Place
                </div>

                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "40%" }}
                >
                  You can opt-out by clicking unsubscribe at the bottom on the
                  email
                </div>
              </article>
              <article className="border-top border-bottom w-100 d-flex">
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "60%" }}
                >
                  Related to helping us to analyse how well our products,
                  marketing activities and business processes are working and
                  understanding how we can provide a better experience for our
                  users
                </div>

                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "40%" }}
                >
                  You can opt-out by clicking unsubscribe at the bottom on the
                  email
                </div>
              </article>
              <article className="border-top border-bottom w-100 d-flex">
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "60%" }}
                >
                  Related to pages you create or donations you make to keep you
                  apprised of what’s happening on your page (or the page to
                  which you donated) and to help you fundraise for that specific
                  page, like donation notifications, target reach, fundraising
                  tips and contests for active fundraisers to help you raise
                  more for your cause
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2"
                  style={{ width: "40%" }}
                >
                  <p>
                    You can opt out{" "}
                    <Link href="/dashboard/settings/notifications"><a> here</a></Link>
                  </p>
                </div>
              </article>
              <article className="border-top border-bottom w-100 d-flex">
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "60%" }}
                >
                  Notifying all our users of important alerts related to the
                  platform, like outages or security issues
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "40%" }}
                >
                  You can opt-out by clicking unsubscribe at the bottom on the
                  email
                </div>
              </article>

              <article className="border-top border-bottom w-100 d-flex">
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "60%" }}
                >
                  Containing marketing messages about other ways to give and
                  fundraise, like news and competitions related to charities and
                  Crowdfunding Pages, page activity in your giving network,
                  developments in our Services, information about our
                  affiliates’ products for social good
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "40%" }}
                >
                  We only send these with your consent. To stop receiving them,
                  click unsubscribe on any email (which takes you to your
                  Notifications Centre) or visit the Notifications Centre
                  directly
                </div>
              </article>
              <article className="border-top border-bottom w-100 d-flex">
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "60%" }}
                >
                  Triggered by actions you take using the Services, like page
                  creation and cancellation notification emails
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "40%" }}
                >
                  You can’t opt out of these, but you won’t receive any unless
                  you take an action on FundandTrace. To stop receiving these
                  emails, just don’t take any actions on the platform.
                </div>
              </article>
              <article className="border-top border-bottom w-100 d-flex">
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "60%" }}
                >
                  Containing communications we’re required to provide you by
                  law, like donation receipts, Gift Aid information or notices
                  about data breaches
                </div>
                <div
                  className="px-3 d-flex align-items-center py-2 border-right"
                  style={{ width: "40%" }}
                >
                  <p>
                    We have to send these emails as required by law, as long as
                    you have a FundandTrace account. To stop receiving these
                    emails,{" "}
                    <a href="/contact" target="_blank" rel="noopener noreferrer">
                      please contact
                    </a>{" "}
                    us to delete your account.
                  </p>
                </div>
              </article>
            </section>
          </section>
          <p className="mt-3">
            <b>Notifications: </b> We offer Crowdfunding Page creators the
            option to enable browser notifications from FundandTrace, which
            contain tips and information about their pages. Users can change
            their preferences on receiving browser notifications either by
            accessing their browser settings or visiting the Notifications
            Centre.
          </p>
          <p>
            <b>Enhancing Your Ability to Raise Funds:</b> We offer you a variety
            of ways to enhance your fundraising/crowdfunding abilities, such as:
          </p>
          <ul>
            <li>
              allowing you to share others’ pages or your donation to a page
              with your connections by email, to other FundandTrace users or
              through your social networks, like Facebook or Twitter
            </li>
            <li>
              when you create or update a page, allowing you to share that news
              with your giving network by email, to other FundandTrace users or
              through your social networks
            </li>
          </ul>
          <p>
            <b>Making FundandTrace Better:</b> We use aggregated and personal
            data about you and your use of our Services to develop and test
            better fundraising tools, to drive our research and development and
            to better understand our users and charity partners. FundandTrace
            does this analysis using a variety of data sources—transactional
            data (how you use the Services), click stream and log data (web
            traffic and Services usage), email data (how you respond to emails
            we send you), survey data, customer service data and data you agree
            to share with us from your Facebook account. We may send you surveys
            about the Services, but you can opt out of receiving these and
            participation is completely voluntary.
          </p>
          <p>
            <b>Advertising:</b> Aside from sending marketing communications by
            email, we may target ads to our users and measure how they perform,
            both through our Services, such as on FundandTrace.com, and through
            other channels like social networking sites and other websites.
          </p>
        </section>
        <section
          className="mb-4 custom-container"
          id="With Whom Are We Sharing Your Data?"
        >
          <h2 className="text-heading">With Whom Are We Sharing Your Data?</h2>
          <p>
            We may disclose your data to our affiliated organisations and
            subsidiaries, and to service providers who render services to us or
            you on our behalf. We also may disclose your information if required
            by law, requested by law enforcement authorities or to enforce our
            legal rights, such as pursuant to a subpoena or to HMRC when you
            claim Gift Aid. We may share your information in connection with a
            sale or reorganisation of FundandTrace, but in any such case, the
            terms of this Policy will continue to apply.
          </p>
          <p>Our service providers include:</p>
          <ul>
            <li>
              banks and payment providers - to authorise and complete payment
              transactions;
            </li>
            <li>
              in relation to creators of Crowdfunding Pages, third party
              identity checking or credit reference agencies - for the purposes
              of identity checking and bank account verification;
            </li>
            <li>
              organisations within the payment card industry - to help prevent
              online fraud;
            </li>
            <li>
              IT, information security and cloud services providers – to help us
              provide the Services and keep your data safe;
            </li>
            <li>
              communication providers – to assist us with the processing and
              delivery of email and other communications;
            </li>
            <li>
              behavioural analytics tools, like Kissmetrics – to collect and
              help us understand data when you use our Services, described in
              the{" "}
              <a href="#How Do We Use Your Data?">
                How Do We Use Data? Section
              </a>
            </li>
          </ul>
          <p>
            We also share your personal data with fundraisers, Crowdfunding Page
            creators, charities and event partners and companies as follows:
          </p>
          <ul>
            <li>
              Fundraisers and Crowdfunding Page Creators: If you donate to a
              Fundraising or Crowdfunding Page, we let the page creator know
              your identity and amount of your donation. You're also given the
              option to share your contact details with the page creator for the
              purposes of them thanking you for your donation.
            </li>
            <li>
              Charities: We share with charities and not-for-profits who are
              registered with us details about donations made to them, including
              your personal data (such as your name, email address and postal
              address). For donors located in the UK or EU or donating to a
              charity in the UK or EU we'll only share your personal details
              with the beneficiary charity if you opt-in to receive
              communications from it. Charities and not-for-profits who are
              registered with FundandTrace also have access to data about
              Fundraising Pages created by our users (including personal data of
              page creators) so they can understand who is fundraising for their
              benefit. For more information, please see the section{" "}
              <a href="#How Do Charity Partners Use My Data?">
                “How Do Charity Partners Use My Data?"
              </a>{" "}
              below. We will also share your personal details with the charity
              when you apply for a Charity Place for an Event. This is so the
              charity can contact you about your application and, if successful,
              can register your details with the Event Organiser so you can
              attend.
            </li>
            <li>
              Partners: If you create a Fundraising Page for, donate to,
              register for, enter or otherwise participate in a sponsored event,
              campaign, fundraising initiative, promotion or sweepstake, we may
              share data about such Fundraising Pages, donation activity or
              registration with sponsoring third-party partners so that they can
              help to facilitate your participation in an event, campaign,
              fundraising initiative or promotion or to contact you as permitted
              by applicable law. The data we share with these partners may
              include your name, address, email address, donation amount and
              date, the named beneficiary and creation date of your page, your
              fundraising target, how much you have raised and the number of
              donors to your page. Fundraising Page creators, donors and
              participants located in the UK and EU can opt out of such sharing
              by contacting us, unless the sharing is necessary for the
              performance of a contract to which you're a party.
            </li>
          </ul>
        </section>
        <section
          className="mb-4 custom-container"
          id="How Do Charity Partners Use My Data?"
        >
          <h2 className="text-heading">How Do Charity Partners Use My Data?</h2>
          <p>
            As stated above we will share your personal data with the charities
            to which you donate unless you're in the UK/EU and choose not to
            share data with those charities or receive email appeals from them.
            We'll also share details of Fundraising Page creators with charities
            on whose behalf you fundraise. When we pass your information to
            charities, they also become a controller with respect to such
            personal data. This means that they’re responsible for their own
            compliance with data protection laws when they use your personal
            data, and all such use is subject to the charity’s own privacy
            notice. FundandTrace is not responsible for charities’ use of your
            personal data or the charities’ compliance with applicable laws.
          </p>
          <p>
            When you donate to or create a Fundraising Page, FundandTrace will
            ask whether or not you consent to receiving email from the charity
            about the impact of your donation and other ways to support them
            including future events, campaigns and appeals. We will pass your
            consent preference on to the charity, if it is subscribed to receive
            such reporting from us. Note that the charity will need to receive
            your personal data to send you emails you consent to receive.
          </p>
          <p>
            If you want to change your preferences for a charity to use your
            data (to contact you or otherwise), please contact the charity
            directly.
          </p>
          <p>
            If the charity you’re interacting with hasn’t subscribed to receive
            charity reporting from FundandTrace, that charity won’t have access
            to details about your consent preferences. This means that they
            won’t know if you have opted in or out of receiving email
            fundraising appeals.
          </p>
          <p>
            Note that charities receive information about supporters from lots
            of different sources. We’re not the system of record for our charity
            partners, so we can only collect and evidence your consent to
            receive email fundraising appeals from our charity partners as you
            elect on our platform. We cannot reflect any changes in your consent
            preferences that you make directly with the charity. For example, if
            you opt in to receive emails from a charity when you make a donation
            through FundandTrace, but then you subsequently opt out by telling
            the charity, FundandTrace won’t have a record that you opted out of
            receiving email from that charity.
          </p>
        </section>
        <section
          className="mb-4 custom-container"
          id="How Do We Use Personal Data of Our Partner Users?"
        >
          <h2 className="text-heading">
            How Do We Use Personal Data of Our Partner Users?
          </h2>
          <p>
            If you work for a charity or company that has a business
            relationship with FundandTrace, we use your data in slightly
            different ways than for individual users of the Services.
          </p>
          <p>
            We collect a business user’s name, work email address, office number
            and fax number. We use this data to enable you to sign into your
            business’ account and to access charity reporting. In addition, we
            may use your data to perform business services you request. Finally,
            we will send you the following email communications: operational
            emails, customer service emails and business marketing emails. When
            you log into your Notifications Centre, you can opt out of receiving
            emails from us, other than service emails related to your requests.
          </p>
        </section>
        <section
          className="mb-4 custom-container"
          id="How Long Do We Keep Your Data?"
        >
          <h2 className="text-heading">How Long Do We Keep Your Data?</h2>

          <p className="mt-2">
            We keep your personal data in an identifiable form for as long as we
            have a legitimate reason to use the data and as required by law.
          </p>
        </section>
        <section className="mb-4 custom-container" id="Children’s Data">
          <h2 className="text-heading">Children’s Data</h2>
          <p>
            We do not direct the Services to users under the age of 18. If you
            are a parent or guardian and you are aware that your child has
            provided us with personal data, please contact us at{" "}
            <a href="mailto:help@fundandtrace.com" target="_blank" rel="noopener noreferrer">
              help@fundandtrace.com
            </a>
            .
          </p>
        </section>
        <section className="mb-4 custom-container" id="FundandTrace App">
          <h2 className="text-heading">FundandTrace App</h2>
          <p>
            The FundandTrace App is part of the Services, so this Policy applies
            to your use of the App. In addition, there are a few unique terms
            that apply when you use the App:
          </p>
          <ul>
            <li>
              <b>Device Access:</b> You can choose to give us access to
              resources on your device (e.g. pictures or contact details) via
              the App permissions and we will only do so until you ask us to
              stop.
            </li>
            <li>
              <b>In-App Notifications:</b> You can amend your preferences on
              receiving in-App notifications by visiting the Notifications tab
              within Settings on the App. Note that this does not affect your
              preferences for receiving emails from FundandTrace—for more
              information about the email we send, please see above.
            </li>
            <li>
              <b>Cookies and Analytics:</b> The App does not use cookies but we
              do use our normal analytics tools within the App that enable us to
              provide the services you request, identify service issues to us,
              improve our services and to provide content tailored to users'
              personal preferences and profiles.
            </li>
          </ul>
        </section>
        <section className="mb-4 custom-container" id="StreamRaiser">
          <h2 className="text-heading">StreamRaiser™</h2>
          <p>
            StreamRaiser™ is part of the Services, so this Policy applies to
            your use of StreamRaiser™, along with a few additional terms.
            StreamRaiser™ allows you to collect donations for your favorite
            cause while you stream on Twitch, by linking a FundandTrace
            Fundraising Page to your Twitch account. Streamers can choose to
            show StreamRaiser™ overlays on their Twitch streams, such as an
            alert box, which the streamer can use to notify her audience and
            thank donors. Note that if you donate to a Fundraising Page whose
            page creator is using StreamRaiser™ and you do not choose to hide
            your name and photo from the public, the streamer might elect to
            thank you or otherwise publicise your donation on her Twitch stream
            using the StreamRaiser™ overlays. When you use or visit Twitch, also
            keep in mind that the{" "}
            <a
              href="https://www.twitch.tv/p/legal/privacy-policy/"
              target="_blank" rel="noopener noreferrer"
            >
              Twitch Privacy Policy
            </a>{" "}
            applies to your use of their platform.
          </p>
        </section>
        <section
          className="mb-4 custom-container"
          id="Users Located in the UK and European Union"
        >
          <h2 className="text-heading">
            Users Located in the UK and European Union
          </h2>
          <p>
            In addition to the foregoing, the following provisions apply to our
            users located in the UK and EU.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            On What Legal Bases Do We Process Your Data?
          </h2>
          <p>
            We process your personal data on a variety of legal bases depending
            on the use. For example, we will only process your personal data to
            send you direct marketing if we have your consent and you can
            withdraw this consent at any time by visiting the Notifications
            Centre and opting out of receiving such emails. Sometimes it is
            necessary to process your data for us to comply with our legal
            obligations, like when we send Gift Aid information to HMRC. Please
            see our separate page on <a href="#">Legal Bases</a> for more
            information.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            How Are We Using Your Data Based on Our Legitimate Interests?
          </h2>
          <p>
            We may process your personal data for the purposes of our legitimate
            interests, provided that these uses aren’t outweighed by your rights
            or interests. For any uses we justify on the basis of legitimate
            interest, you have the right to opt out of such processing{" "}
            <a href="/contact" target="_blank" rel="noopener noreferrer">
              here
            </a>
            . To learn more about our use of data for our legitimate interests,
            please see our separate page.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Claiming Gift Aid</h2>
          <p>
            If you choose to claim Gift Aid on a donation made on FundandTrace,
            we will share your taxpayer information and details about your
            donation with Swiftaid, which provides a service to facilitate
            filing Gift Aid on this donation and any other eligible donation
            made by you in the then current tax year. Such data may include your
            contact details, tokenized payment information, donation amount,
            recipient and other donation details. If you claim Gift Aid on a
            donation, an account profile will be created with Swiftaid and you
            may receive service emails from them. Swiftaid is a third party and
            uses your personal data in accordance with its own{" "}
            <a href="https://www.swiftaid.co.uk/legal/privacy/" target="_blank" rel="noopener noreferrer">
              privacy policy
            </a>{" "}
            and{" "}
            <a
              href="https://www.swiftaid.co.uk/legal/terms/"
              target="_blank" rel="noopener noreferrer"
            ></a>{" "}
            donor terms. You can edit your account details or close your account
            with Swiftaid by contacting Swiftaid directly. If you do not wish
            for us to share your data with Swiftaid, do not elect to claim Gift
            Aid on your donation. It is necessary for us to share your data with
            Swiftaid so that we can claim Gift Aid on your behalf, as detailed
            in the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              FundandTrace Terms of Service
            </a>
            .
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            Are We Doing Any Automated Decision Making?
          </h2>
          <p>
            To help our users fundraise more effectively, we employ machine
            learning and other analytics that make inferences about some
            characteristics of our users. We use these tools to tailor emails to
            you, to show and prioritise causes, fundraisers, pages, and users on
            your Feed we think you’ll be interested in, and make suggestions
            about how much you may want to fundraise or donate. You can opt out
            of these processes at any time{" "}
            <a href="/contact" target="_blank" rel="noopener noreferrer">
              here
            </a>{" "}
            . To learn more about the automatic decision-making we do, please
            see our separate page.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Where Are We Sending Your Data?</h2>
          <p>
            As a global platform, we may store some users’ personal data outside
            the UK or EU. If we do, we ensure your data is processed only in
            countries that provide an adequate level of protection for your data
            or where the recipient provides appropriate safeguards, such as
            model contract clauses, binding corporate rules, or a certification
            scheme. For a copy of such safeguards, please{" "}
            <a href="/contact" target="_blank" rel="noopener noreferrer">
              contact us
            </a>
            .
          </p>
        </section>

        {/* <StartFunding /> */}
      </Wrapper>
    </Layout>
  );
}

const Wrapper = styled.main`
  p {
    font-size: 14px;
  }
  h2 {
    font-size: 18px;
  }
  li {
    font-size: 14px;
  }
  b {
    font-weight: 600;
  }
  article {
    div {
      font-size: 16px;
      font-weight: 400;
    }
  }
  .text-heading {
    margin-bottom: 8px !important;
    line-height: 30px;
  }
`;

const Header = styled.header`
  background: #f9f9f9;
  padding: 50px 15px;
`;
