import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../../store/slices/authSlice";
import styles from "./MobileDashboard.module.scss";

export default function MobileDashboard({ onClose, campaignId, title }) {
  const navItems = [
    {
      value: "Dashboard",
      link: `/dashboard/${campaignId}`,
      onClick: onClose,
      icon: "/images/icons/mobileDash.svg",
    },
    {
      value: "Send Email",
      link: `/dashboard/${campaignId}/sendEmail`,
      onClick: onClose,
      icon: "/images/icons/mobileEmail.svg",
    },
    {
      value: "Socials",
      link: `/dashboard/${campaignId}/socials`,
      onClick: onClose,
      icon: "/images/icons/mobileSocials.svg",
    },
    {
      value: "Funding Request",
      link: `/dashboard/${campaignId}/fundingRequest`,
      onClick: onClose,
      icon: "/images/icons/mobileFunding.svg",
    },
  ];

  const otherlinks = [
    {
      value: "Add another campaign",
      link: "/StartACampaign",
      icon: "/images/icons/mobileAdd.svg",
    },
    {
      value: "My Campaigns",
      link: "/dashboard",
      onClick: onClose,
      icon: "/images/icons/mobileDash.svg",
    },
    {
      value: "My Contributions",
      link: "/dashboard/my-contributions",
      onClick: onClose,
      icon: "/images/icons/contributionsIcon.svg",
    },
    {
      value: "Settings",
      link: "/dashboard/settings",
      onClick: onClose,
      icon: "/images/icons/settingsIcon.svg",
    },
    {
      value: "Need some help?",
      link: "/help",
      onClick: onClose,
      icon: "/images/icons/mobileHelp.svg",
    },
  ];

  const { authenticated, profile } = useSelector(selectAuthStateState);
  const router = useRouter();

  useEffect(() => {
    !authenticated && router.push("/");
  }, [authenticated, router]);

  return (
    <div className={styles.container}>
      <div className={styles.menu}>
        <div className={styles.top}>
          <div className="d-flex align-items-center justify-content-center custom-container">
            <img
              src="/images/icons/profile.svg"
              width={20}
              height={20}
             alt="" />
            <p className="ml-4 mb-0 mr-4">{`${profile?.firstName} ${profile?.lastName}`}</p>
          </div>
        </div>
        <div
          className={[
            styles.bottom,
            "custom-container d-flex flex-column",
          ].join(" ")}
        >
          <div className={styles.title}>
            <h2 className="mr-3 mb-0">{title}</h2>
            <img src="/images/icons/dropUp.svg" width={15} height={12} alt="" />
          </div>
          <div className={styles.navlinks}>
            {navItems.map((items, i) => (
              <Link key={i} href={items.link ? items.link : undefined} passHref>
                <a>
                  <div
                    className="d-flex align-items-center"
                    style={{ marginBottom: 40 }}
                    key={i}
                    onClick={items.onClick}
                    role="button"
                  >
                    <img
                      src={items.icon}
                      height={20}
                      width={20}
                      alt="navIcons"
                      className="mr-3"
                    />
                    <p className="mb-0">{items.value}</p>
                  </div>
                </a>
              </Link>
            ))}
          </div>
          <div className={styles.otherlinks}>
            {otherlinks.map((other, i) => (
              <Link key={i} href={other.link} passHref>
                <a onClick={other?.onClick} role="button">
                  <div
                    className="d-flex align-items-center"
                    style={{ marginBottom: 50 }}
                    key={i}
                  >
                    <img
                      src={other.icon}
                      height={20}
                      width={20}
                      alt="navIcons"
                      className="mr-3"
                    />
                    <p className="mb-0">{other.value}</p>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.outside} role="button" onClick={onClose}></div>
    </div>
  );
}
