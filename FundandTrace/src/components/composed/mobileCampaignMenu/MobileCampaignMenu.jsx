import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuthStateState } from "../../../../store/slices/authSlice";
// import { useState } from "react";
// import DeleteModal from "../Modal/DefaultModal/DeleteModal";
import styles from "./MobileCampaignMenu.module.scss";

export default function MobileCampaignMenu({ onClose, setShowDelete }) {
  const navItems = [
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
      icon: "/images/icons/mobileEmail.svg",
    },
    {
      value: "Account",
      link: "/dashboard/account",
      onClick: onClose,
      icon: "/images/icons/mobileSocials.svg",
    },
    {
      value: "Settings",
      link: "/dashboard/settings",
      onClick: onClose,
      icon: "/images/icons/mobileFunding.svg",
    },
    {
      value: "Logout",
      onClick: onClose,
      icon: "/images/icons/mobileDelete.svg",
    },
  ];

  const otherlinks = [
    {
      value: "Start a campaign",
      link: "/StartACampaign",
      onClick: onClose,
      icon: "/images/icons/mobileAdd.svg",
    },
    {
      value: "Need some help?",
      link: "/help",
      onClick: onClose,
      icon: "/images/icons/mobileHelp.svg",
    },
  ];

  const handleDelete = () => {
    onClose();
    setShowDelete();
  };

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
          <div className={styles.navlinks}>
            {navItems.map((items, i) =>
              items.link ? (
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
              ) : (
                <div key={i} onClick={handleDelete} role="button">
                  <div className="d-flex align-items-center" key={i}>
                    <img
                      src={items.icon}
                      height={20}
                      width={20}
                      alt="navIcons"
                      className="mr-3"
                    />
                    <p className="mb-0">{items.value}</p>
                  </div>
                </div>
              )
            )}
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
