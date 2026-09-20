import React from "react";
import styled from "styled-components";
import StartFunding from "../components/homepageComponents/StartFundingSection/StartFunding";
import Layout from "../components/Layout";
import Navbar from "../components/Navbar/Navbar";

export default function TermsPage() {
  return (
    <Layout url="https://fundandtrace.com" ogImage="/og-image.jpg"
      showFooter
      title="Terms of Service | Fund&Trace"
      description="The terms and conditions involved with using fund&trace"
    >
      <Wrapper>
        <section style={{ height: "77px" }}>
          <Navbar />
        </section>
        <Header className="mb-3">
          <h1 className="text-heading mb-0 text-center">
            <span style={{ color: "var(--color-primary)" }}>Fund&Trace</span> Terms of
            Service
          </h1>
        </Header>
        <div className="mb-4 custom-container">
          <p className="text-center mb-0">Date of posting: 7th August 2021</p>
        </div>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">FUNDANDTRACE TERMS OF SERVICE</h2>
          <p>
            Our terms of service describe what FundandTrace does for you and the
            charities and other causes you support, and what we require of you
            as a user.
          </p>
          <p>
            “Cause” and “cause” refers to charities and other causes you support
            through use of our service, including non-charitable FundandTrace
            Crowdfunding.
          </p>
          <p>
            “FundandTrace” or “us” or “we” refer to the owner of the website,
            dbdworldwide Limited.
          </p>
          <p>
            “FundandTrace Crowdfunding” or “crowdfunding” and related terms
            refer to certain non-charitable causes listed as such on the
            Website.
          </p>
          <p>
            “Website” refers to{" "}
            <a href="/" target="_blank" rel="noopener noreferrer">
              https://www.fundandtrace.com.
            </a>
          </p>
          <p>
            {" "}
            “You” and “your” refers to each user or viewer of the Website,
            including donors, charities, fundraisers and crowdfunders.
          </p>
          <p>
            These terms of service apply in each country where we operate.
            Country-specific terms also apply to use of the service in Australia
            and the United States.
          </p>
        </section>

        <section className="mb-4 custom-container">
          <h2 className="text-heading">Summary</h2>
          <ul>
            <li>
              Online Giving — We operate a website that processes donations on
              behalf of the Causes featured on it. Please see{" "}
              <a href="/fees" target="_blank" rel="noopener noreferrer">
                https://www.fundandtrace.com/fees
              </a>{" "}
              for details about our fees.
            </li>
            <li>
              Data Privacy — Your privacy is paramount to us. Our{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>{" "}
              shows you how we protect it.
            </li>
            <li>
              User Conduct — If you create a FundandTrace page or use any of our
              services, please remember FundandTrace is for everyone. If we find
              offensive, defamatory, libelous, threatening, harassing, or
              obscene content on the Website, we will remove it and terminate
              your access. Please ensure the content you upload to the site,
              especially pictures and videos, does not infringe another person’s
              copyright.
            </li>
          </ul>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Terms of Service</h2>
          <p>
            These terms of service (and the relevant country specific terms)
            (collectively, the "Terms”) govern your use of the Website and its
            associated services. Please read these Terms carefully. Your use of
            the Website and/or and its associated services constitutes your
            assent to these Terms.
          </p>
          <p>
            We may update these Terms from time to time. It is your
            responsibility to review these Terms wherever you access the
            Website. The latest version of these Terms will govern any future
            usage by you of the Website and its associated services. The date on
            which these Terms were last updated is stated at the end of this
            document.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            About the Causes featured on the Website:
          </h2>
          <p>
            The Website and its associated services allow you to donate to and
            raise funds for any Cause listed on the Website. Every Cause
            featured has an agreement with FundandTrace authorising FundandTrace
            to collect donations on its behalf. Causes are listed on this
            Website at FundandTrace's discretion; however, we are not
            responsible for the activities of any Cause. A charity must have the
            appropriate authorisation, permit or licence to operate as a
            charity, as required by the local laws of the territory in which it
            operates.
          </p>
          <p>
            NOTE: FundandTrace Crowdfunding pages are not intended to raise
            money for charities, so you should read the description of them
            carefully and make your own decision regarding the authenticity and
            suitability of the recipient to receive your donation. It is your
            responsibility to ensure that the organisation or person to which
            you donate is the intended recipient.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Donations</h2>
          <p>
            Subject to the requirements of applicable local laws, and what we
            say below in relation to FundandTrace Crowdfunding, once your
            donation is made it will only be refunded to you with the prior
            written consent of the Cause to whom it has been directed. In the
            event all funds have been paid out and there are no funds available
            for refund, FundandTrace reserves the right to invoice or direct
            debit the Cause for the amount of the refund and the Cause must
            agree to settle that invoice within one (1) month of the date of the
            invoice.
          </p>
          <p>
            For FundandTrace Crowdfunding, FundandTrace will process your
            donation via the payment method used at the time of donating. NOTE:
            no donations will be refunded for any reason, subject to applicable
            local laws. Occasionally, the person who created the page to which
            you have donated does not pass identity verification or other
            necessary checks, or there is some other reason that we cannot
            transfer the funds to them. If we are unable to transfer the funds
            to the Cause to which you donated, we will return your donation via
            the payment method from which you made the donation. If we are
            unable to return your donation via the payment method you used, your
            donation will be sent to another Cause, subject to the deduction of
            applicable transaction and payment processing fees.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Use of your donation</h2>
          <p>
            FundandTrace does not represent or warrant that your donations will
            be used for any particular purpose and shall not be responsible for
            any dissatisfaction you may have regarding a Cause's use of any
            donation you may make through the Website or its associated services
            or websites powered by us or for any misuse or non-use of such
            donations by a Cause. After donations are made, all further dealings
            are solely between you and the Cause to which you donated.
          </p>
          <p>
            NOTE: For donations to FundandTrace Crowdfunding pages, you may
            receive updates from the page creator to let you know more about
            their Cause. If you would like to stop receiving these emails, you
            will be able to select this option in the email footer in emails you
            receive from the page creator.
          </p>
          <p>
            Please note that recipient organisations (excluding FundandTrace
            Crowdfunding page creators) reserve the right to use your donation
            for their general purposes in accordance with their practices and
            rules. FundandTrace shall not be responsible for ensuring that funds
            are earmarked for a particular appeal. If you want a donation to be
            used for a specific purpose or for a particular appeal, contact the
            organisation and make your donation directly to them.
          </p>
          <p>
            FundandTrace (or any payments processor or card brand we work with)
            will verify the identity of a FundandTrace Crowdfunding page creator
            and undertake any other necessary checks before any funds raised are
            transferred to the page owner. FundandTrace shall have no liability
            to donors whatsoever for any use or misuse of donations made to the
            FundandTrace Crowdfunding page. The FundandTrace Crowdfunding page
            may state that page owners will use donations only for specific
            purposes, but FundandTrace cannot guarantee that they will use them
            for such purpose. If you have any doubts as to how the money will be
            spent you should contact the FundandTrace Crowdfunding page owner
            directly to seek reassurance. It is your sole responsibility, as a
            user of the Website, to ensure that the cause stated to be supported
            on a relevant FundandTrace Crowdfunding page is one that you wish to
            support.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">FundandTrace fees</h2>
          <p>
            For information about our fees please see{" "}
            <a href="/fees" target="_blank" rel="noopener noreferrer">
              https://www.fundandfrace.com/fees.
            </a>
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Unauthorised donations</h2>
          <p>
            When you make a donation, the transaction is final and not
            disputable unless unauthorised use of your payment card or other
            payment method is proved. If you become aware of fraudulent use of
            your card, or if it is lost or stolen, you must notify your card
            provider in accordance with its reporting rules. Similarly, if you
            experience any issues of this nature when using another payment
            method, such as PayPal, you should contact the provider of that
            payment method for assistance.
          </p>
          <p>
            FundandTrace will never email or phone you and ask you to provide
            all of your payment details.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Protecting your account</h2>
          <p>
            When you register with FundandTrace and choose a password to protect
            your secure account, you are responsible for maintaining the
            confidentiality of your password to prevent others gaining access to
            your personal information. This includes any taxpayer details you
            may have saved under your profile in order to claim tax or tax
            deductions in accordance with applicable laws and regulations.
            Claiming tax or tax deductions using someone else’s taxpayer
            information is against the law. If you become aware of any
            unauthorised use of your account, we recommend that you change your
            password immediately and call our helpdesk on the telephone number
            set out on the{" "}
            <a href="/contact" target="_blank" rel="noopener noreferrer">
              Contact Us page
            </a>
            .
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Information</h2>
          <p>
            FundandTrace is not an accounting, taxation or financial advisor,
            and you should not rely on information given on the Website or its
            associated services to determine any consequences of making a
            donation to a Cause.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Privacy</h2>
          <p>
            FundandTrace's Privacy Policy forms part of these Terms. By agreeing
            to these Terms, you also give your consent to the way we handle your
            personal information under that Policy.
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              {" "}
              Read our Privacy Policy
            </a>
            .
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">User conduct</h2>
          <ul>
            <li>
              You must at all times use the Website and its associated services
              in a responsible and legal manner and ensure that the content you
              provide does not breach any intellectual property rights of a
              third party or breach any right or duty owed to a third party.
            </li>
            <li>
              You must not upload offensive, obscene, racist, defamatory,
              misleading or deceptive content, including photographs, on to the
              Website or its associated services. FundandTrace does not actively
              edit the Website but reserves the right to remove or edit any
              content posted on the Website or its associated services at its
              sole discretion and without notice, regardless of whether or not
              it is, in the opinion of any third party, offensive, obscene,
              racist, defamatory, misleading, deceptive or otherwise
              inappropriate. If you notice any such content, please email us at
              <a href="mailTo:help@fundandtrace.com">help@fundandtrace.com</a>.
            </li>
            <li>
              If you build a fundraising page on FundandTrace, you must ensure
              that any information you provide to the public is accurate and not
              misleading. It is your responsibility to ensure that the content
              you are uploading on your page (“Content”), including pictures,
              photographs and any videos, is your original work and/or you have
              the right and/or licence necessary to upload it and it is not
              copyright-protected. If it is copyright-protected, you must obtain
              the copyright owner's written consent to use it. FundandTrace
              reserves the right to remove any pictures, photographs, videos or
              copy from personal fundraising or FundandTrace Crowdfunding pages
              at its sole discretion and without notice if their copyright
              status is in any doubt. If you suspect a breach of copyright on
              the Website, please email us at{" "}
              <a href="mailTo:help@fundandtrace.com">help@fundandtrace.com</a>.
              Please note that by submitting and posting Content to the Website,
              you grant to FundandTrace a perpetual, irrevocable, worldwide,
              royalty-free and non-exclusive license to use, modify, reproduce,
              publish, broadcast, display and distribute the Content in any
              format, using any medium, for the purpose of promoting
              FundandTrace or a Cause, or for any other purpose that we deem
              appropriate.
            </li>
            <li>
              You must not misrepresent your identity or affiliation with any
              other person or organization.
            </li>
            <li>
              You must not use the Website to conduct, display or forward
              surveys, pyramid schemes or chain letters.
            </li>
            <li>
              You must not use the Website to conduct, display or forward
              raffles, lotteries or contests.
            </li>
            <li>
              You must not interfere with, or disrupt, the service or services
              or networks connected to the service or introduce any computer
              virus (including any variant or similar malicious code or
              instructions) to the FundandTrace systems.
            </li>
            <li>
              You must not attempt to modify, adapt, translate, sell, reverse
              engineer, decompile or disassemble any portion of the site or any
              other web site.
            </li>
            <li>You must not attempt to bypass the network firewall.</li>
            <li>
              You must not use any part of the site which you are not authorized
              to use or devise ways to circumvent security in order to access
              part of the site which you are not authorized to access (includes
              scanning networks with intent to breach and/or evaluate security,
              whether or not the intrusion results in access).
            </li>
            <li>
              You must not use or attempt to use the site for any unlawful,
              criminal, or negligent purposes (includes password cracking,
              social engineering, denial-of-service attacks, harmful and
              malicious destruction of data, and intentional invasion of
              privacy).
            </li>
            <li>
              You must not disclose any information relating to any donor except
              with the consent of the donor or as permitted by applicable local
              laws.
            </li>
          </ul>
          <p className="mt-2">
            FundandTrace reserves the right to cancel your access and delete any
            FundandTrace page without notice in the event you fail to follow any
            of the above rules. FundandTrace may also suspend or delete a
            FundandTrace page if the relevant Cause is no longer receiving
            donations via FundandTrace or is no longer active.
          </p>
          <p>
            Building a FundandTrace page in aid of a Cause in no way implies
            FundandTrace's or the Cause's endorsement of your fundraising
            activity. Prior to commencing a fundraising activity, it is your
            responsibility to ensure that the benefitting Cause has no objection
            to the nature of the proposed activity. FundandTrace reserves the
            right, at its absolute discretion and without notice, to cancel your
            personal fundraising page at the request of the Cause if the Cause,
            in its absolute discretion, deems your fundraising activity
            inappropriate or unnecessarily dangerous.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Links</h2>
          <p>
            The Website and its associated services contain links to other
            websites, including the websites of Causes. Inclusion of a link to
            another website does not imply endorsement of its content or
            opinions. Your relationship and any direct transactions with other
            people or organisations are your own responsibility.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Partner Services</h2>
          <p>
            FundandTrace may from time to time select partners offering relevant
            information and services that we believe will enhance the Website.
            Whilst we will do our best to select reputable partners, we are not
            responsible for any of the information or services offered by them,
            and if you choose to use their services, you do so at your own risk.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Trademarks</h2>
          <p>
            The names FundandTrace, FundandTrace Crowdfunding and
            FundandTrace.com, the FundandTrace logo and any other product and
            service names that we may present on the Website or its associated
            services from time to time may not be used in connection with any
            product or service that is not FundandTrace's, nor in any manner
            that is likely to cause confusion, or in any way that may disparage
            or discredit FundandTrace. Other trademarks, service marks or logos
            that appear on the Website or its associated services, in particular
            (but not exclusively) those of member charities, FundandTrace
            Crowdfunding pages or other organisations, are the property of their
            respective owners and are likely to be registered trademarks and
            subject to restrictions as to their use. They must not be used
            without the express permission of both FundandTrace and the
            trademark owner.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading"> Copyright</h2>
          <p>
            All content on the Website and its associated services is owned by
            FundandTrace, our member charities, FundandTrace Crowdfunding page
            creators or other original providers, and is protected by the
            applicable intellectual property and proprietary rights and laws.
            You may copy content for your own personal, non-commercial use
            provided you do not alter it or remove any copyright, trade mark or
            other proprietary notice, and that your usage complies with any
            requests you may receive from any person with rights in that
            content. No other use of the Website's and its associated services'
            content is permitted without the express prior permission of
            FundandTrace, and, where applicable, the copyright holder.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            Prohibition on data extraction and distribution
          </h2>
          <p>
            By visiting or using the Website or any of its associated services,
            you agree not to (and not to use any tool, program, script, browser
            extension or other technique, including bots, robots, spiders and
            scrapers and any similar tools or methods, in order to): (i) copy
            (except as authorised by these Terms), mirror, frame, index, scrape,
            mine or otherwise gather or extract any of the content or data from
            the Website or its associated services; or (ii) sell or distribute
            any data which is gathered or extracted in breach of these Terms, or
            which is based on or derived from any such data. FundandTrace may
            take any measures it sees fit to block access to the Website and its
            associated services where it believes that these Terms have been or
            will be breached. You agree that you will not take any steps to try
            to circumvent these measures and that you will not take any steps to
            mask your IP address. You acknowledge and agree that where there is
            any actual or threatened breach of these Terms, damages may be an
            inadequate remedy and FundandTrace shall be entitled, without
            prejudice to any other rights and remedies it may have, to seek an
            injunction or any other equitable relief for such breach.
            FundandTrace may also request that you destroy any data you have
            gathered or extracted in breach of these Terms and you agree that
            you will comply with such request promptly and certify the same.
          </p>
          <p>
            Inquiries and permission requests may be sent to{" "}
            <a href="mailto:help@fundandtrace.com" target="_blank" rel="noopener noreferrer">
              help@fundandtrace.com
            </a>
            .
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Changes to the service</h2>
          <p>
            FundandTrace reserves the right to modify, suspend or discontinue
            all or any part of the Website and its associated services at any
            time with or without notice. All new features, services or software
            applications shall be subject to these Terms.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Failure to comply with these Terms</h2>
          <p>
            In the event that you fail to comply with these Terms, FundandTrace
            reserves the right at its sole discretion to immediately and without
            notice suspend or permanently deny your access to all or part of the
            Website and associated services.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Termination</h2>
          <p>
            You may discontinue use of the Website and associated services at
            any time. These Terms will continue to apply to your past use.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            Disclaimer and Limitation of Liability
          </h2>
          <p>
            You agree that your use of the Website and its associated services
            is on an "as is" and "as available" basis and that your use of the
            Website and its associated services is at your sole risk.
            FundandTrace does not warrant or guarantee continuous uninterrupted
            or secure access to our services and operation of the Website and
            associated services may be interfered with by numerous factors
            outside of our control. On that basis, except as expressly set out
            in these Terms and except for the rights, guarantees and remedies
            which cannot be excluded, FundandTrace does not provide other
            conditions, guarantees, warranties or terms in relation to the
            Website or its associated services, to the extent permissible by
            law. FundandTrace shall undertake general maintenance and upkeep of
            the Website from time to time. During these periods, the Website and
            its associated services may not be available for use. In exceptional
            circumstances, the Website and associated services may also become
            unavailable at other times.
          </p>
          <p>
            If found liable, FundandTrace shall only be liable under these Terms
            for direct losses which are reasonably foreseeable and caused by
            FundandTrace’s uncured material breach of these Terms or
            FundandTrace’s negligence. FundandTrace's total liability to you
            arising under or in connection with these Terms, whether in
            contract, tort (including negligence), breach of statutory duty or
            otherwise, shall in no circumstances exceed the total sum of the
            donations you have made using the Website in the preceding 12-month
            period, ending on the date the circumstances giving rise to
            FundandTrace's liability arose.
          </p>
          <p>
            In no event shall FundandTrace be liable for losses relating to any
            business of yours or lost or corrupt data, loss of profits, loss of
            contracts, loss of business opportunity, loss of sales, loss of
            revenue, loss of goodwill, loss of any software or data, loss of
            bargain, loss of opportunity, loss of use of computer equipment,
            loss of or waste of management or other staff time, even if
            FundandTrace has been advised of the possibility of such damages.
            YOU EXPRESSLY AGREE TO THE ALLOCATION OF RISK SET FORTH HEREIN.
          </p>
          <p>
            Nothing in these Terms excludes any statutory rights which may apply
            to your use of the Website and associated services which cannot be
            excluded, restricted or modified by contract.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Third party rights</h2>
          <p>
            A person who is not a party to these Terms has no right to enforce
            any term of these Terms.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            TERMS FOR USERS IN ALL COUNTRIES OTHER THAN AUSTRALIA AND THE UNITED
            STATES
          </h2>
          <p>
            These additional terms apply and will prevail where you access the
            Website or associated services in anywhere in the world (other than
            Australia and the United States), except where expressly indicated
            otherwise.
          </p>
          <p>
            The local FundandTrace entity and the company who provides the
            service to you is Dbdworldwide Limited (registration no. 3871904),
            Approved Payment Institution regulated by the FCA (FRN 739668, whose
            registered office is at WeWork, 10 York Road, London, SE1 7ND,
            United Kingdom.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">UK Tax Payers only: Gift Aid and tax</h2>
          <p>
            When you (i) donate to a charity and certain Community Amateur
            Sports Clubs ("CASCs") on the Website or its associated services,
            (ii) confirm that you are a UK taxpayer in accordance with the
            requirements of the Gift Aid scheme as they apply from time to time,
            and (iii) elect to have FundandTrace reclaim Gift Aid on your
            donation on behalf of the charity or CASC under the UK government's
            Gift Aid scheme, FundandTrace will reclaim such Gift Aid. To enable
            us to do this, we will share your personal taxpayer information and
            details about your donation with Swiftaid (a third party which
            provides a service to facilitate the processing of Gift Aid
            reclaims) in accordance with the{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              terms of our Privacy Policy
            </a>
            . If you do not wish for us to share your data with Swiftaid, do not
            elect to claim Gift Aid on your donation
          </p>
          <p>
            Every charity or CASC that is a member of FundandTrace has an
            agreement with FundandTrace authorising it to reclaim Gift Aid on
            its behalf. Charities and CASCs must be registered with the Charity
            Commission or exempt from registration for FundandTrace to reclaim
            Gift Aid on their behalf. FundandTrace also features certain
            not-for-profit and other organisations, which are not eligible for
            Gift Aid reclaim. Such organisations are clearly listed on the
            Website as not eligible for Gift Aid reclaim. In addition, donations
            to FundandTrace Crowdfunding pages, including those that have a
            charitable purpose, are not eligible for Gift Aid. Donations to any
            of these Causes are not tax deductible.
          </p>

          <p>
            In consideration of using the Website and associated services, we do
            accept a voluntary gratuity from the donor. All Donations are also
            subject to third party payment processing fees. Subscription fees
            also apply to member charities in the UK for additional services.
            For full details please visit{" "}
            <a href="www.fundandtrace.com/for-charities">
              www.fundandtrace.com/for-charities
            </a>
            .
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Governing law; Dispute resolution</h2>
          <p>
            These Terms and any contractual or non-contractual dispute arising
            out of or in connection with your use of the Website or the
            associated services are governed by English law.
          </p>
          <p>
            The parties agree to submit all unresolved disputes between them to
            arbitration administered by the International Centre for Dispute
            Resolution (“ICDR”) and governed by the ICDR Arbitration Rules
            (“ICDR Rules”) then in effect, except that either party may seek
            injunctive relief for infringement of intellectual property rights
            or other proprietary rights in court. For all arbitrated matters,
            one (1) arbitrator will be appointed under the ICDR Rules, and the
            locale of arbitration will be London, England, unless the parties
            mutually agree to another locale before appointment of the
            arbitrator.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">TERMS FOR USERS IN AUSTRALIA</h2>
          <p>
            These additional terms apply and will prevail where you access the
            Website or associated services in Australia.
          </p>
          <p>
            The local FundandTrace entity and the company who provides the
            service to you in Australia is Everyday Hero Pty Ltd trading as
            FundandTrace Australia, Level 12, 260 George Street, Sydney, NSW,
            2000 AUSTRALIA.
          </p>
          <p>
            The times at which FundandTrace shall undertake general maintenance
            and upkeep of the Website will usually be between 12.00am and 08.00
            hours (GMT) at the weekends.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Governing law</h2>
          <p>
            These Terms and any dispute arising out of or in connection with
            your use of the Website or the associated services are governed by
            the law of New South Wales, Australia.
          </p>
          <p>
            The parties agree to submit all unresolved disputes between them to
            arbitration administered by the International Centre for Dispute
            Resolution (“ICDR”) and governed by the ICDR Arbitration Rules
            (“ICDR Rules”) then in effect, except that either party may seek
            injunctive relief for infringement of intellectual property rights
            or other proprietary rights in court. For all arbitrated matters,
            one (1) arbitrator will be appointed under the ICDR Rules, and the
            locale of arbitration will be Sydney, Australia, unless the parties
            mutually agree to another locale before appointment of the
            arbitrator.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">TERMS FOR USERS IN THE UNITED STATES</h2>
          <p>
            These additional terms apply and will prevail where you access the
            Website or associated services in the United States, or you are
            donating to a campaign that benefits a U.S. 501(c)(3) tax-exempt
            charity.
          </p>
          <p>
            The local FundandTrace entity and the company who provides the
            service to you in the United States is JG US, Inc., a Delaware
            corporation whose principal place of business is 65 Fairchild
            Street, Charleston, SC 29492.
          </p>
          <p>
            In fundraising campaigns for certain Causes on the FundandTrace
            website, donations are made either (i) through DBDWorldwide Inc., a
            U.S. 501(c)(3) tax-exempt organization that operates a donor-advised
            fund to process donations and make grants to other U.S. 501(c)(3)
            tax-exempt public charities pursuant to donor advisements or (ii)
            directly to the organization if the organization is registered with
            FundandTrace and has set up a Blackbaud Merchant Services account
            (“BBMS”).
          </p>
          <p>
            When you make a donation to support a Cause which has not registered
            with FundandTrace and set up a BBMS (i), you are making a complete
            and final charitable donation to DBDWorldwide Inc., with a
            recommendation that the funds be re-granted to the Cause specified
            on the campaign page, and you will receive a donation receipt from
            DBDWorldwide for your donor-advised contribution. It is DBDWorldwide
            s normal practice to regrant approximately 92% of the donation per
            advisement to any qualifying Cause, and to retain 5% for platform
            costs and DBDWorldwide s expenses, plus credit card processing
            costs. DBDWorldwide makes reasonable efforts to comply with donor
            recommendations and to re-grant the funds to the donor’s designated
            Cause. However, to comply with federal tax laws and regulations,
            DBDWorldwide is required to retain legal control over any charitable
            contribution it receives. DBDWorldwide makes payments to Causes via
            ACH about 15 days after the end of each month or via check about 15
            days after the end of each quarter.
          </p>
          <p>
            When you make a donation to support a Cause which has registered
            with FundandTrace and set up a BBMS, you are making a complete and
            final charitable donation directly to the charity you selected. In
            rare instances, DBDWorldwide and/or FundandTrace may determine that
            it would be inappropriate or improper to disburse the funds
            designated for a Cause because, for example, the Cause is no longer
            recognized as a public charity, or is no longer in good standing
            with state or federal regulations, in which case, DBDWorldwide
            and/or FundandTrace may, in its sole discretion, disburse the
            donation to another charity (as determined by DBDWorldwide and/or
            FundandTrace).
          </p>
          <p>
            In some cases, in consideration of using the Website and associated
            services, we accept voluntary gratuities from donors for our
            services.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Intellectual Property Complaints</h2>
          <p>
            FundandTrace respects the intellectual property rights of others and
            requires those that visit the Website do the same. If you believe
            that your work has been used on the Platform in any manner that
            constitutes infringement, please notify us at{" "}
            <a href="mailto:AUP-Violation@blackbaud.com">
              AUP-Violation@blackbaud.com
            </a>
            . The notice should include the following information:
          </p>
          <ul>
            <li>
              An electronic or physical signature of a person authorized to act
              on behalf of the owner of the copyright allegedly infringed;
            </li>
            <li>
              A description of the work you claim has been infringed, including
              a copy of the work or the web page address where the work may be
              found;
            </li>
            <li>
              Identification of the location on the Website of the material you
              claim has been infringed, or the link or reference to another
              website that contains the material you claim has been infringed;
            </li>
            <li>Your name, address, telephone number and email address;</li>
            <li>
              A statement by you that you have a good faith belief that the
              disputed use of the material at issue is not authorized by the
              owner, the agent of the owner or the law; and
            </li>
            <li>
              A statement by you that the information in this notification is
              accurate and a statement, under penalty of perjury, that you are
              the owner of the material allegedly infringed or authorized to act
              on the owner’s behalf.
            </li>
          </ul>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">No Class Action</h2>
          <p>
            YOU AND FUNDANDTRACE AGREE THAT ANY PROCEEDINGS TO RESOLVE OR
            LITIGATE ANY DISPUTE WILL BE CONDUCTED SOLELY ON AN INDIVIDUAL
            BASIS, AND THAT NEITHER YOU NOR FUNDANDTRACE WILL SEEK TO HAVE ANY
            DISPUTE HEARD AS A CLASS ACTION, A REPRESENTATIVE ACTION, A
            COLLECTIVE ACTION, A PRIVATE ATTORNEY-GENERAL ACTION, OR IN ANY
            PROCEEDING IN WHICH YOU OR FUNDANDTRACE ACTS OR PROPOSES TO ACT IN A
            REPRESENTATIVE CAPACITY. YOU AND FUNDANDTRACE FURTHER AGREE THAT NO
            PROCEEDING WILL BE JOINED, CONSOLIDATED, OR COMBINED WITH ANOTHER
            PROCEEDING WITHOUT THE PRIOR WRITTEN CONSENT OF YOU, FUNDANDTRACE,
            AND ALL PARTIES TO ANY SUCH PROCEEDING.
          </p>
          <p>
            These Terms and any dispute arising out of or in connection with
            your use of the Website or the associated services are governed by,
            and shall be construed in accordance with, the laws of the State of
            New York, without giving effect to its conflicts of laws provisions.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Users under 18</h2>
          <p>
            It is a condition of use of the Website that fundraising may only be
            conducted by users over the age of 18. Persons under the age of 18
            may create crowdfunding pages using our Website only with parental
            consent and supervision. The supervision requirements are as
            follows:
          </p>
          <ul>
            <li>
              Children under the age of 18 using FundandTrace services or
              creating a fundraising page must do so under the direct
              supervision of an adult.
            </li>
            <li>
              If you have any concerns whatsoever about a child's use of our
              services, please notify us immediately by emailing us at{" "}
              <a href="mailto:help@fundandtrace.com" target="_blank" rel="noopener noreferrer">
                help@fundandtrace.com
              </a>
              .
            </li>
          </ul>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            ADDITIONAL TERMS FOR FUNDANDTRACE CROWDFUNDING PAGE CREATORS
          </h2>
          <p>
            If you create a FundandTrace Crowdfunding page on the Website the
            following terms, in addition to the Terms of Service, will apply to
            your dealings with FundandTrace in relation to the relevant
            FundandTrace Crowdfunding page and your use of the Website and
            associated services. To the extent there is any conflict between
            these additional terms and the core Terms, these additional terms
            will prevail.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Donations</h2>
          <p>FundandTrace will:</p>
          <ul>
            <li>
              Operate the Website so that donors can make online donations by
              credit or debit card, or by another payment method available on
              the Website, through your FundandTrace Crowdfunding page;
            </li>
            <li>
              Pay out by bank transfer to your bank account, or by any other
              payment method that you have selected via the Website, provided
              that you have passed identity verification and other necessary
              checks. If you do not pass these checks within 30 days from your
              first donation all funds received will be refunded and your page
              will be taken down. If funds are unable to be refunded, they may
              be redirected to a registered charity at FundandTrace’s
              discretion. FundandTrace may allow an additional 30 days to verify
              your identity and bank account ownership; and
            </li>
            <li>
              Implement and maintain industry standard safeguards designed to
              protect against unauthorized access or use of (i) donors' credit
              and debit card information, and other financial information
              associated with other payment types.
            </li>
          </ul>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            Support and Donation Acknowledgements
          </h2>
          <p>
            FundandTrace will respond, either by email or live chat as
            appropriate, to donors' and fundraisers’ enquiries received by
            FundandTrace, in accordance with the{" "}
            <a href="/contact" target="_blank" rel="noopener noreferrer">
              Contact Us page
            </a>{" "}
            on the Website.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Personal Information</h2>
          <p>
            FundandTrace will collect personal information from donors including
            but not limited to the donor's name, title, address and email
            address ("Personal Information") at all times in accordance with
            applicable laws, including the EU General Data Protection Regulation
            and the UK Data Protection Act 2018 ("Privacy Laws") and protect and
            secure such information.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Compliance</h2>
          <p>You and FundandTrace will comply with all applicable laws.</p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Intermediary</h2>
          <p>
            FundandTrace does not review or exercise any editorial control over
            the content of information on your FundandTrace Crowdfunding page.
            In the event that FundandTrace is made aware of or has knowledge of
            any unlawful activity or information on the Website or associated
            services, FundandTrace shall act to remove or disable access to the
            information. FundandTrace shall not be liable to you or the
            FundandTrace Crowdfunding page as a result of its role hosting your
            FundandTrace Crowdfunding page on the Website.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            FundandTrace Crowdfunding creator obligations
          </h2>
          <p>
            It is FundandTrace’s policy that all crowdfunding campaigns must
            serve a purpose that benefits the public good. FundandTrace retains
            the unrestricted ability to reject or terminate a campaign in its
            sole discretion when FundandTrace believes the burdens of continuing
            a campaign are not in its best interest. In rejecting or terminating
            a campaign, FundandTrace is not passing judgment on the worthiness
            of the campaign or its cause, but rather exercising its prerogative
            to avoid any controversy that could potentially injure its
            reputation.
          </p>
          <p>You agree that:</p>
          <ul>
            <li>
              Where applicable, you shall ensure that any person or organisation
              for which you have created a FundandTrace Crowdfunding page agrees
              to you raising funding on its behalf for the purposes and in the
              manner set out on your FundandTrace Crowdfunding page;
            </li>
            <li>
              If your use of the Website and/or associated services results in
              access to any Personal Information you shall: (i) at all times
              assist with the responsibilities of FundandTrace, as a data
              controller responsible for determining how the Personal
              Information is processed under the provisions of the Privacy Laws;
              (ii) not do, or cause or permit to be done, anything which may
              result in a breach by FundandTrace of the Privacy Laws and comply
              with all reasonable instructions from FundandTrace relating to the
              processing by you and/or the FundandTrace Crowdfunding page of
              such Personal Information; (iii) comply with the Privacy Laws in
              respect of your and/or the FundandTrace Crowdfunding page's
              collection, use, disclosure or processing of the Personal
              Information; (iv) abide by the lawful instructions of all data
              subjects in respect of the Personal Information and not do
              anything to compromise the security of such information; (v) not
              sell, trade or rent Personal Information to third parties; (vi)
              hold the Personal Information securely and not disclose it to
              anyone other than FundandTrace, as agreed to by the data subject
              and/or as permitted by Privacy Laws; (vii) implement adequate
              administrative, technical and physical safeguards against all
              unauthorised, unlawful or accidental access, processing, use,
              erasure, loss or destruction of, or damage to, Personal
              Information in accordance with Privacy Laws, and abide by
              FundandTrace's reasonable requirements to ensure the security of
              the Personal Information as notified to you from time to time;
              (viii) use Personal Information appropriately and only for the
              specific purposes as notified to you from time to time, including
              by way of the applicable privacy policy available on
              FundandTrace's Website; (ix) only communicate with donors where
              they have agreed to receive further communications from you and/or
              the FundandTrace Crowdfunding page, and only to the extent that
              they have indicated their preference to do so (for example in
              relation to communications for a specific fundraising event only);
              (x) not retain any Personal Information for longer than is
              necessary; and (xi) to the extent legally permissible, you shall
              indemnify and hold harmless FundandTrace, its successors and
              assigns, from and against all losses, costs and other damage
              caused by your and/or the FundandTrace Crowdfunding page's breach
              of this paragraph; and
            </li>
            <li>
              You shall maintain any necessary authority, permit, licence,
              consent, approval and registration for you to fundraise (and,
              where applicable, for FundandTrace to fundraise on your behalf) in
              accordance with applicable laws and if FundandTrace needs any such
              authority, permit, licence, consent, approval or registration for
              it to fundraise on behalf of the FundandTrace Crowdfunding page
              then you will, at no cost to FundandTrace, provide all such
              assistance as FundandTrace reasonably requires to assist
              FundandTrace with the same. You agree that you shall inform
              FundandTrace immediately if, for any reason, you and/or the
              FundandTrace Crowdfunding page cease(s) to maintain the necessary
              authority, permit, licence, consent, approval and/or registration
              to operate the fundraising activities in relation to the
              FundandTrace Crowdfunding page in accordance with applicable local
              laws.
            </li>
            <li>
              By building a FundandTrace Crowdfunding page you represent,
              warrant and undertake to FundandTrace and the users of the Website
              that:
            </li>
            <ul>
              <li>
                Each time you use the Website or associated services, and in
                particular when you create a FundandTrace Crowdfunding page, you
                will comply with FundandTrace’s guidelines that apply to
                FundandTrace Crowdfunding pages at that time;
              </li>
              <li>
                You will provide feedback via your FundandTrace Crowdfunding
                page on the Website, including at the end of the fundraising
                period to explain what outcome has been or will be achieved as a
                result (including how any funds raised in excess of your target
                will be used);
              </li>
              <li>
                You will ensure all donations provided to the FundandTrace
                Crowdfunding page will be used for the purposes set out on your
                FundandTrace Crowdfunding page; and
              </li>
              <li>
                You will ensure no fraudulent, criminal or otherwise improper
                uses will be made of donations made via your FundandTrace
                Crowdfunding page.
              </li>
            </ul>
          </ul>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Minimum age</h2>
          <p>
            FundandTrace Crowdfunding is not directed to anyone under 13 years
            of age. If you are under 13, you are not authorised to use
            FundandTrace Crowdfunding. If you are between 13 and 18 years of
            age, then you may only set up a FundandTrace Crowdfunding page if
            you have your parent’s or guardian’s approval. Please ensure that
            your parent or guardian understands that you will be responsible for
            using the funds in accordance with these Terms.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            Licence of Trademark and Copyrighted Material
          </h2>
          <p>
            You hereby grant to FundandTrace, its affiliates and its partners a
            non-exclusive licence to use any of your FundandTrace Crowdfunding
            page's trademarks and any copyrighted material on your page
            (including images and videos or any link to the same) solely in
            connection with the Website and associated services and its
            operation and promotion and for no other purpose whatsoever.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">
            Disclaimer and Limitation of Liability
          </h2>
          <p>
            Notwithstanding the provisions of the "Disclaimer and Limitation of
            Liability" section of the core Terms, FundandTrace's total liability
            to you arising under or in connection with these Terms, so far as
            such liability arises out of or relates to your creation and/or use
            of a FundandTrace Crowdfunding page, shall be limited to the total
            fees paid by you to FundandTrace under these Terms for your use of
            the Website and associated services during the preceding 12 month
            period ending on the date the circumstances giving rise to the
            liability arose.
          </p>
          <p>
            In no event shall FundandTrace be liable for losses relating to any
            business of yours or lost or corrupt data, loss of profits, loss of
            contracts, loss of business opportunity, loss of sales, loss of
            revenue, loss of goodwill, loss of any software or data, loss of
            bargain, loss of opportunity, loss of use of computer equipment,
            loss of or waste of management or other staff time, even if
            FundandTrace has been advised of the possibility of such damages.
            YOU EXPRESSLY AGREE TO THE ALLOCATION OF RISK SET FORTH HEREIN.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Confidential Information</h2>
          <p>
            The parties shall treat as strictly confidential all information
            about the other which has been acquired as a result of the use of
            the Website and associated services and which is not in the public
            domain. No party shall use or disclose to any third party such
            information belonging to the other party without that party's prior
            written consent, except where (i) required to do so by applicable
            law, including, without limitation, the Freedom of Information Act
            2000 and the Environmental Information Regulations 2004, or
            regulatory or governmental body or (ii) those third parties
            operating under non-disclosure provisions no less restrictive than
            those set forth in this agreement and who have a justified business
            “need to know.”. This paragraph shall survive termination of these
            Terms. For the avoidance of doubt, Personal Information shall be
            treated in accordance with Applicable Laws and shall not be
            considered “confidential information” belonging to a party unless it
            is the Personal Information of a crowdfunder.
          </p>
        </section>
        <section className="mb-4 custom-container">
          <h2 className="text-heading">Termination</h2>
          <p>
            FundandTrace reserves the right, at its sole discretion, to
            immediately and without notice suspend or permanently deny your
            access to all or part of the Website and associated services. The
            obligations contained herein will continue to apply to your past
            use.
          </p>
          <p>
            Upon termination or suspension or denial of access to the Website
            and associated services, funds already received on your behalf by
            FundandTrace will be handled in accordance with the provisions
            above, provided that any potential payment (where applicable) may be
            delayed where FundandTrace conducts an investigation regarding your
            use of the Website and associated services and FundandTrace may
            decide to refuse to pay funds across to you where you have breached
            these Terms or your FundandTrace Crowdfunding page has been removed.
            In such circumstances FundandTrace may authorise a refund of
            donations to donors.
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
