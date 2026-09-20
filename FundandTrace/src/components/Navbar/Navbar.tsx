import Image from "next/image";
import Link from "next/link";
import styles from "./Navbar.module.scss";
import { useState, useRef, useEffect } from "react";
import ExploreModal from "./Explore/ExploreModal";
import HowItWorksModal from "./HowItWorks/HowItWorks";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { logout, selectAuthStateState } from "../../../store/slices/authSlice";
import { useRouter } from "next/router";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { useAppDispatch } from "./../../../store/hooks";

const Navbar = ({ white = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [showmenu, setShowmenu] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { authenticated, profile } = useSelector(selectAuthStateState);

  useEffect(() => {
    const menu = document.querySelector<HTMLElement>(".menu");
    const menu2 = document.querySelector<HTMLElement>(".menu2");
    const selectRef = document.querySelector<HTMLElement>("#selectRef");

    const applyMenuState = () => {
      if (!selectRef) return;
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark" ||
        document.documentElement.classList.contains("dark-theme");

      if (showmenu) {
        selectRef.style.opacity = "0";
      } else if (window.pageYOffset > 300) {
        selectRef.style.opacity = "1";
        selectRef.style.top = "0";
        selectRef.style.backgroundColor = isDark ? "#0F172A" : "white";
        selectRef.style.pointerEvents = "all";
        selectRef.style.display = "block";
        selectRef.style.boxShadow = isDark
          ? "0 4px 20px rgba(0,0,0,.6)"
          : "0 0.125rem 0.1875rem -0.125rem rgba(0,0,0,.2)";
      } else {
        selectRef.style.opacity = "0";
        selectRef.style.position = "fixed";
        selectRef.style.top = "0";
        selectRef.style.display = "none";
        selectRef.style.backgroundColor = "transparent";
        selectRef.style.boxShadow = "none";
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (event.target == menu || event.target == menu2) {
        setShowmenu(false);
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        applyMenuState();
        ticking = false;
      });
    };

    applyMenuState();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (showmenu && menu) {
      window.addEventListener("click", handleClick);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", handleClick);
    };
  }, [showmenu]);

  return (
    <>
      <div
        className={[styles.container].join(" ")}
        style={{ position: "absolute", width: "100vw" }}
      >
        <div className="d-flex justify-content-between align-items-center w-100 custom-container">
          <div className="d-none d-lg-block">
            <Link href="/" passHref>
              <a>
                {white ? (
                  <Image src="/images/draftImage.png" width={78} height={55} alt="Fund&Trace" priority />
                ) : (
                  <Image
                    src="/images/logo.png"
                    alt="logo"
                    width={78}
                    height={55}
                    priority
                  />
                )}
              </a>
            </Link>
          </div>
          <Menu
            className="d-block d-lg-none"
            onClick={() => setShowmenu(true)}
            color={white ? "white" : undefined}
            role="button"
          >
            <div className="bars bar1"></div>
            <div className="bars bar2"></div>
            <div className="bars bar3"></div>
          </Menu>
          <Link href="/" passHref>
            <a
              onClick={showModal ? () => setShowModal(false) : undefined}
              className="d-block d-lg-none"
              role="button"
            >
              <Image
                src={white ? "/images/draftImage.png" : "/images/logo.png"}
                alt="logo"
                width={63}
                height={48}
                priority
              />
            </a>
          </Link>
          <div className="d-lg-none d-flex align-items-center">
            <div className="mr-3">
              <ThemeToggle white={white} />
            </div>
            {!white ? (
              <Link href="/search" passHref>
                <img
                  src="/images/icons/search.svg"
                  width={20}
                  height={20}
                 alt="Search" />
              </Link>
            ) : (
              <Link href="/search" passHref>
                <img
                  src="/images/whiteSearch.svg"
                  width={20}
                  height={20}
                 alt="Search" />
              </Link>
            )}
          </div>
          <div
            className={[styles.mobileMenu, "d-block d-lg-none menu"].join(" ")}
            style={{
              opacity: showmenu ? 1 : 0,
              pointerEvents: showmenu ? "all" : "none",
            }}
          >
            <div
              className={[
                "d-flex flex-column align-items-center bg-white p-4",
                showmenu ? styles.open : styles.close,
              ].join(" ")}
              style={{ position: "relative" }}
            >
              <div
                style={{ position: "absolute", right: 23, top: 25 }}
                onClick={() => setShowmenu(false)}
                className="font-weight-medium"
                role="button"
              >
                X
              </div>
              <Image
                src="/images/logo.png"
                alt="logo"
                width={81}
                height={58}
                className="mb-4"
                priority
              />
              <ul>
                <Link href="/" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <li onClick={() => setShowmenu(false)} role="button">
                      Home
                    </li>
                  </a>
                </Link>
                <Link href="/search" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <li onClick={() => setShowmenu(false)} role="button">
                      Search
                    </li>
                  </a>
                </Link>
                <Link href="/workings" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <li onClick={() => setShowmenu(false)} role="button">
                      How It Works
                    </li>
                  </a>
                </Link>
                <Link href="/Categories" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <li onClick={() => setShowmenu(false)} role="button">
                      Explore
                    </li>
                  </a>
                </Link>
                <Link href="/contact" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <li onClick={() => setShowmenu(false)} role="button">
                      Contact
                    </li>
                  </a>
                </Link>
                {!authenticated ? (
                  <>
                    <Link href="/SignUp/SignIn" passHref>
                      <a style={{ textDecoration: "none" }}>
                        <li
                          onClick={() => setShowmenu(false)}
                          className={styles.signInBtn}
                          role="button"
                        >
                          Sign In
                        </li>
                      </a>
                    </Link>
                    <Link
                      href={authenticated ? "/StartACampaign" : "/SignUp"}
                      passHref
                    >
                      <a style={{ textDecoration: "none" }}>
                        <li
                          onClick={() => setShowmenu(false)}
                          className={styles.signUpBtn}
                          role="button"
                        >
                          Start a campaign
                        </li>
                      </a>
                    </Link>
                  </>
                ) : (
                  <>
                    <li
                      onClick={() => {
                        dispatch(logout());
                        setShowmenu(false);
                      }}
                      role="button"
                      className={styles.signInBtn}
                    >
                      Sign Out
                    </li>
                    <Link
                      href={authenticated ? "/StartACampaign" : "/SignUp"}
                      passHref
                    >
                      <a style={{ textDecoration: "none" }}>
                        <li
                          onClick={() => setShowmenu(false)}
                          className={styles.signUpBtn}
                        >
                          Start a campaign
                        </li>
                      </a>
                    </Link>
                    <Link
                      href={authenticated ? "/dashboard" : "/SignUp/SignIn"}
                      passHref
                    >
                      <a style={{ textDecoration: "none" }}>
                        <li
                          onClick={() => setShowmenu(false)}
                          className={styles.signUpBtn}
                          role="button"
                        >
                          Go to dashboard
                        </li>
                      </a>
                    </Link>
                  </>
                )}
                <div className="mt-4 d-flex justify-content-center w-100">
                  <ThemeToggle />
                </div>
              </ul>
            </div>
          </div>

          <div className="d-lg-flex align-items-center justify-content-end w-100 d-none">
            <Link href="/search" passHref>
              <div
                className="d-flex align-items-center justify-content-center mr-4 mr-xl-4"
                style={{ cursor: "pointer" }}
              >
                {!white ? (
                  <img
                    src="/images/icons/search.svg"
                    width={15}
                    height={15}
                   alt="Search" />
                ) : (
                  <img
                    src="/images/whiteSearch.svg"
                    width={15}
                    height={15}
                   alt="Search" />
                )}
                <p
                  style={{ fontSize: 14, fontWeight: 400 }}
                  className={["ml-2 mb-0", white && "text-white"].join(" ")}
                >
                  Search
                </p>
              </div>
            </Link>
            <div
              className={[
                "d-flex align-items-center justify-content-center mr-4 mr-xl-4",

                styles.how,
              ].join(" ")}
              style={{ cursor: "pointer" }}
            >
              <p
                style={{ fontSize: 14, fontWeight: 400 }}
                className={["mr-2 mb-0", white && "text-white"].join(" ")}
              >
                How it works
              </p>
              <img
                className={`${styles.howIcon} pt-0`}
                src={
                  white
                    ? "/images/icons/dropdownWhite.svg"
                    : "/images/icons/dropdown.svg"
                }
                width={11}
                height={6}
                alt=""
              />
              <div className={[styles.howDropdown].join(" ")}>
                <ul className="shadow">
                  <Link href="/workings" passHref>
                    <li>How Fund&Trace Works</li>
                  </Link>
                  <Link href="/fundraisingIdeas" passHref>
                    <li>Fundraising ideas</li>
                  </Link>
                  <Link href="/fundraising-stories" passHref>
                    <li>Fundraising Stories</li>
                  </Link>
                </ul>
              </div>
            </div>
            <div
              className={[
                "d-flex align-items-center justify-content-center mr-4 mr-xl-4",
                styles.explore,
              ].join(" ")}
              style={{ cursor: "pointer" }}
            >
              <p
                style={{ fontSize: 14, fontWeight: 400 }}
                className={["mr-2 mb-0", white && "text-white"].join(" ")}
              >
                Explore
              </p>
              <img
                className={styles.exploreIcon}
                src={
                  white
                    ? "/images/icons/dropdownWhite.svg"
                    : "/images/icons/dropdown.svg"
                }
                width={11}
                height={6}
                alt=""
              />
              <div className={[styles.exploreDropdown].join(" ")}>
                <ul className="shadow">
                  <p className="text-blue">Categories</p>

                  <Link href="/category/medical" passHref>
                    <a>
                      <li>Medical</li>
                    </a>
                  </Link>

                  <Link href="/category/emergency" passHref>
                    <a>
                      <li>Emergency</li>
                    </a>
                  </Link>

                  <Link href="/category/nonprofit" passHref>
                    <a>
                      <li>Non-profit</li>
                    </a>
                  </Link>
                  <Link href="/category/environment" passHref>
                    <a>
                      <li>Environment</li>
                    </a>
                  </Link>

                  <Link href="/Categories" passHref>
                    <li className="text-blue text-center w-full mb-0 border-top pt-3">
                      See all
                    </li>
                  </Link>
                </ul>
              </div>
            </div>

            <div className="mr-4 mr-xl-4">
              <Link href="/contact">
                <a
                  className={`${white && "text-white"}`}
                  style={{ fontSize: 14, fontWeight: 400 }}
                >
                  Contact
                </a>
              </Link>
            </div>
            {!authenticated ? (
              <Wrapper1
                className="mr-4 mr-xl-4 bg-transparent"
                color={white ? "white" : undefined}
              >
                <Link href="/SignUp/SignIn">
                  <button
                    className={styles.signInBtn}
                    style={{
                      background: white ? "transparent" : undefined,
                      color: white ? "white" : undefined,
                      border: white ? "1px solid white" : undefined,
                      width: "100%",
                      fontSize: 14,
                      fontWeight: 400,
                    }}
                  >
                    Sign In
                  </button>
                </Link>
              </Wrapper1>
            ) : null}
            <Wrapper color={white ? "white" : undefined}>
              <button
                className={[
                  styles.button,
                  "d-flex align-items-center justify-content-center px-3 py-2 text-white btn rounded w-100",
                ].join(" ")}
                style={{
                  background: white ? "rgba(0,0,0,0.6)" : undefined,

                  border: white ? "1px solid white" : undefined,
                }}
                onClick={() =>
                  authenticated
                    ? router.push("/StartACampaign")
                    : router.push("/SignUp")
                }
              >
                <p className="mb-0" style={{ fontSize: 14, fontWeight: 400 }}>
                  Start a Campaign
                </p>
              </button>
            </Wrapper>

            <div className="ml-3 d-flex align-items-center">
              <ThemeToggle white={white} />
            </div>

            {authenticated && (
              <div
                className={[
                  "ml-4 ml-xl-4 d-flex align-items-center",
                  styles.log,
                ].join(" ")}
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                }}
              >
                {profile?.profilePicture ? (
                  <img
                    src={profile?.profilePicture}
                    width={40}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                    height={40}
                    className="mr-3"
                   alt="Profile picture" />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center mr-3"
                    style={{
                      width: 40,
                      height: 40,
                      background: "#F0F0F0",
                      borderRadius: "50%",
                      color: "#A3A3A3",
                      fontSize: 12,
                    }}
                  >
                    {`${profile?.firstName?.charAt(
                      0
                    )} ${profile?.lastName?.charAt(0)}`}
                  </div>
                )}
                <p
                  className="mb-0"
                  style={{ color: white ? "white" : "" }}
                >{`Hi, ${profile?.firstName} ${profile?.lastName}`}</p>
                <img
                  src={
                    white
                      ? "/images/icons/dropdownWhite.svg"
                      : "/images/icons/dropdown.svg"
                  }
                  width={13}
                  height={8}
                  className="pt-0 ml-2"
                  alt=""
                />
                <div className={[styles.logDropdown].join(" ")}>
                  <ul className="shadow">
                    <Link
                      href={authenticated ? "/dashboard" : "/SignUpSignIn"}
                      passHref
                    >
                      <li>Go to Dashboard</li>
                    </Link>
                    <Link href="/dashboard" passHref>
                      <li>My Campaigns</li>
                    </Link>
                    <Link href="/dashboard/account" passHref>
                      <li>My Account</li>
                    </Link>
                    <Link href="/dashboard/my-contributions" passHref>
                      <li>My Contributions</li>
                    </Link>
                    <Link href="/dashboard/settings" passHref>
                      <li>Settings</li>
                    </Link>

                    <li role="button" onClick={() => dispatch(logout())}>
                      Logout
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          {showModal && showExplore && (
            <ExploreModal
              onModalClose={() => setShowModal(false)}
              showModal={showModal}
            />
          )}

          {showModal && showHow && (
            <HowItWorksModal
              onModalClose={() => setShowModal(false)}
              showModal={showModal}
            />
          )}
        </div>
      </div>

      <div
        id="selectRef"
        style={{
          position: "fixed",
          opacity: 0,
          pointerEvents: "none",
          background: "white",
          width: "100vw",
        }}
        className={[styles.container].join(" ")}
      >
        <div className="custom-container d-flex justify-content-between align-items-center">
          <div className="d-none d-lg-block">
            <Link href="/" passHref>
              <a
                role="button"
                onClick={showModal ? () => setShowModal(false) : undefined}
              >
                {
                  <Image
                    src="/images/logo.png"
                    alt="logo"
                    width={78}
                    height={55}
                    priority
                  />
                }
              </a>
            </Link>
          </div>
          <Menu
            className="d-block d-lg-none"
            role="button"
            onClick={() => setShowmenu(true)}
          >
            <div className="bars bar1"></div>
            <div className="bars bar2"></div>
            <div className="bars bar3"></div>
          </Menu>
          <Link href="/" passHref>
            <a
              onClick={showModal ? () => setShowModal(false) : undefined}
              className="d-block d-lg-none"
              role="button"
            >
              <Image src="/images/logo.png" alt="logo" width={63} height={48} priority />
            </a>
          </Link>
          <div className="d-lg-none d-flex align-items-center">
            <div className="mr-3">
              <ThemeToggle />
            </div>
            <Link href="/search" passHref>
              <a style={{ textDecoration: "none" }}>
                <img
                  src="/images/icons/search.svg"
                  width={20}
                  height={20}
                 alt="Search" />
              </a>
            </Link>
          </div>
          <div
            className={[styles.mobileMenu, "d-block d-lg-none menu2"].join(" ")}
          >
            <div
              className={[
                "d-flex flex-column align-items-center bg-white p-4",
                showmenu ? styles.open : styles.close,
              ].join(" ")}
              style={{ position: "relative" }}
            >
              <div
                style={{ position: "absolute", right: 23, top: 25 }}
                onClick={() => setShowmenu(false)}
                className="font-weight-bold"
                role="button"
              >
                X
              </div>
              <Image
                src="/images/logo.png"
                alt="logo"
                width={68}
                height={50}
                className="mb-4"
                priority
              />
              <ul>
                <Link href="/" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <li onClick={() => setShowmenu(false)} role="button">
                      Home
                    </li>
                  </a>
                </Link>
                <Link href="/search" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <li onClick={() => setShowmenu(false)} role="button">
                      Search
                    </li>
                  </a>
                </Link>
                <Link href="/workings" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <li onClick={() => setShowmenu(false)} role="button">
                      How It Works
                    </li>
                  </a>
                </Link>
                <Link href="/Categories" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <li onClick={() => setShowmenu(false)} role="button">
                      Explore
                    </li>
                  </a>
                </Link>
                <Link href="/contact" passHref>
                  <a style={{ textDecoration: "none" }}>
                    <li onClick={() => setShowmenu(false)} role="button">
                      Contact
                    </li>
                  </a>
                </Link>
                {!authenticated ? (
                  <>
                    <Link href="/SignUp/SignIn" passHref>
                      <a style={{ textDecoration: "none" }}>
                        <li
                          onClick={() => setShowmenu(false)}
                          className={styles.signInBtn}
                          role="button"
                        >
                          Sign In
                        </li>
                      </a>
                    </Link>
                    <Link href="/SignUp" passHref>
                      <a style={{ textDecoration: "none" }}>
                        <li
                          onClick={() => setShowmenu(false)}
                          className={styles.signUpBtn}
                          role="button"
                        >
                          Sign Up
                        </li>
                      </a>
                    </Link>{" "}
                  </>
                ) : (
                  <li
                    onClick={() => {
                      dispatch(logout());
                      setShowmenu(false);
                    }}
                    role="button"
                    className={styles.signInBtn}
                  >
                    Sign Out
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="d-lg-flex align-items-center justify-content-end w-100 d-none">
            <Link href="/search" passHref>
              <div
                className="d-flex align-items-center justify-content-center mr-4 mr-xl-4"
                style={{ cursor: "pointer" }}
              >
                <img
                  src="/images/icons/search.svg"
                  width={15}
                  height={15}
                 alt="Search" />

                <p
                  className="ml-2 mb-0"
                  style={{ fontSize: 14, fontWeight: 400 }}
                >
                  Search
                </p>
              </div>
            </Link>
            <div
              className={[
                "d-flex align-items-center justify-content-center mr-4 mr-xl-4",
                styles.how,
              ].join(" ")}
              style={{ cursor: "pointer" }}
            >
              <p
                className={["mr-2 mb-0"].join(" ")}
                style={{ fontSize: 14, fontWeight: 400 }}
              >
                How it works
              </p>
              <img
                className={`${styles.howIcon} pt-0`}
                src="/images/icons/dropdown.svg"
                width={11}
                height={6}
                alt=""
              />
              <div className={[styles.howDropdown].join(" ")}>
                <ul className="shadow">
                  <Link href="/workings" passHref>
                    <li>How Fund&Trace Works</li>
                  </Link>
                  <Link href="/fundraisingIdeas" passHref>
                    <li>Fundraising ideas</li>
                  </Link>
                  <Link href="/fundraising-stories" passHref>
                    <li>Fundraising Stories</li>
                  </Link>
                </ul>
              </div>
            </div>
            <div
              className={[
                "d-flex align-items-center justify-content-center mr-4 mr-xl-4",
                styles.explore,
              ].join(" ")}
              style={{ cursor: "pointer" }}
            >
              <p
                className="mr-2 mb-0"
                style={{ fontSize: 14, fontWeight: 400 }}
              >
                Explore
              </p>
              <img
                className={styles.exploreIcon}
                src="/images/icons/dropdown.svg"
                width={11}
                height={6}
                alt=""
              />
              <div className={[styles.exploreDropdown].join(" ")}>
                <ul className="shadow">
                  <p className="text-blue">Categories</p>

                  <Link href="/category/medical" passHref>
                    <a>
                      <li>Medical</li>
                    </a>
                  </Link>

                  <Link href="/category/emergency" passHref>
                    <a>
                      <li>Emergency</li>
                    </a>
                  </Link>

                  <Link href="/category/nonprofit" passHref>
                    <a>
                      <li>Non-profit</li>
                    </a>
                  </Link>
                  <Link href="/category/environment" passHref>
                    <a>
                      <li>Environment</li>
                    </a>
                  </Link>

                  <Link href="/Categories" passHref>
                    <li className="text-blue text-center w-full mb-0 pt-3 border-top">
                      See all
                    </li>
                  </Link>
                </ul>
              </div>
            </div>
            <div
              className="mr-4 mr-xl-4"
              style={{ fontSize: 14, fontWeight: 400, textDecoration: "none" }}
            >
              <Link href="/contact">Contact</Link>
            </div>
            {!authenticated ? (
              <div className="mr-4 mr-xl-4">
                <Link href="/SignUp/SignIn">
                  <button
                    className={styles.signInBtn}
                    style={{ color: "var(--color-primary)", fontSize: 14, fontWeight: 400 }}
                  >
                    Sign In
                  </button>
                </Link>
              </div>
            ) : null}

            <button
              className={[
                styles.button,
                "d-flex align-items-center justify-content-center px-3 py-2 btn rounded",
              ].join(" ")}
              onClick={() =>
                authenticated
                  ? router.push("/StartACampaign")
                  : router.push("/SignUp")
              }
            >
              <p className="mb-0" style={{ fontSize: 14, fontWeight: 400 }}>
                Start a Campaign
              </p>
            </button>

            <div className="ml-3 d-flex align-items-center">
              <ThemeToggle />
            </div>

            {authenticated && (
              <div
                className={[
                  "ml-4 ml-xl-4 d-flex align-items-center",
                  styles.log,
                ].join(" ")}
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                }}
              >
                {profile?.profilePicture ? (
                  <img
                    src={profile?.profilePicture}
                    width={40}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                    height={40}
                    className="mr-3"
                   alt="Profile picture" />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center mr-3"
                    style={{
                      width: 40,
                      height: 40,
                      background: "#F0F0F0",
                      borderRadius: "50%",
                      color: "#A3A3A3",
                      fontSize: 12,
                    }}
                  >
                    {`${profile?.firstName?.charAt(
                      0
                    )} ${profile?.lastName?.charAt(0)}`}
                  </div>
                )}
                <p className="mb-0">{`Hi, ${profile?.firstName} ${profile?.lastName}`}</p>
                <img
                  src={"/images/icons/dropdown.svg"}
                  width={13}
                  height={8}
                  className="pt-0 ml-2"
                  alt=""
                />
                <div className={[styles.logDropdown].join(" ")}>
                  <ul className="shadow">
                    <Link
                      href={authenticated ? "/dashboard" : "/SignUpSignIn"}
                      passHref
                    >
                      <li>Go to Dashboard</li>
                    </Link>
                    <Link href="/dashboard" passHref>
                      <li>My Campaigns</li>
                    </Link>
                    <Link href="/dashboard/account" passHref>
                      <li>My Account</li>
                    </Link>
                    <Link href="/dashboard/my-contributions" passHref>
                      <li>My Contributions</li>
                    </Link>
                    <Link href="/dashboard/settings" passHref>
                      <li>Settings</li>
                    </Link>

                    <li onClick={() => dispatch(logout())} role="button">
                      Logout
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showModal && showExplore && (
        <ExploreModal
          onModalClose={() => setShowModal(false)}
          showModal={showModal}
        />
      )}

      {showModal && showHow && (
        <HowItWorksModal
          onModalClose={() => setShowModal(false)}
          showModal={showModal}
        />
      )}
    </>
  );
};

const Menu = styled.div`
  .bars {
    width: 18px;
    margin-bottom: 5px;
    height: 2px;
    background: ${(props) => (props.color ? props.color : "black")};
  }
  .bar2 {
    width: 14px;
  }
  .bar3 {
    margin-bottom: 0;
  }
`;

const Wrapper = styled.div`
  outline: none;
  border: none;
  button {
    width: 100%;
    &:hover {
      background-color: ${(props) =>
        props.color ? "var(--color-primary) !important" : undefined};
      color: white;
      transition: all 0.4s ease;
      border: 1px solid var(--color-primary) !important;
    }
  }
`;

const Wrapper1 = styled.div`
  outline: none;
  border: none;
  button {
    width: 100%;
    &:hover {
      background-color: ${(props) =>
        props.color ? "var(--color-primary) !important" : undefined};
      color: white;
      transition: all 0.4s ease;
      border: 1px solid var(--color-primary) !important;
    }
  }
`;

export default Navbar;
