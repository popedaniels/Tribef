import styled from "styled-components";
import AdminLayout from "../AdminLayout";
import Layout from "../../../components/Layout";
import CampaignSearch from "../../../components/adminCampaignPageComponents/campaignSearch";
import { useCallback, useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import Spinner from "../../../components/composed/spinner/Spinner";
import { useRouter } from "next/router";
import Link from "next/link";
import { config } from "../../../components/helperFunctions/helperFunctions";
import CampaignDetailsCard from "../../../components/adminCampaignPageComponents/campaignDetailsCard";
import CampaignDetailsHeader from "../../../components/adminCampaignPageComponents/campaignDetailsHeader";
import AdminSendEmailModal from "../../../components/composed/Modal/DefaultModal/AdminSendEmailModal";
import SuspendUserModal from "../../../components/composed/Modal/DefaultModal/SuspendUserModal";
import UnsuspendUserModal from "../../../components/composed/Modal/DefaultModal/UnsuspendUserModal";
import type { Campaign } from "../../../types/campaign";

interface UserDetails {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  code?: string;
  country?: string;
  city?: string;
  profilePicture?: string;
  profile?: boolean;
  suspended?: boolean;
  campaigns?: Campaign[];
}

export default function UsersDetailsPage() {
  const [user, setUser] = useState<UserDetails>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [reload, setReload] = useState(false);

  const getUser = useCallback(async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/user/${router.query.id}`,
        config()
      );
      res && setUser(res?.data?.data);
      res && setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [router.query.id]);

  useEffect(() => {
    router.query.id && getUser();
  }, [router, reload, getUser]);

  return (
    <Layout title="Fund&Trace | Admin">
      <AdminLayout active="Users">
        <Wrapper className="mx-auto">
          {/* <section>
            <CampaignSearch
              showDelete
              campaignTitle={campaign?.basicInformation?.campaignTitle}
            />
          </section> */}
          <section className="bordered-wrapper">
            <section className="section mx-auto flex-column d-flex align-items-center justify-content-around">
              {loading ? (
                <div className="my-5">
                  <Spinner
                    type="TailSpin"
                    width={30}
                    height={30}
                    color={"var(--color-primary)"}
                  />
                </div>
              ) : (
                <Section className="">
                  <article className="top py-4 px-4 d-flex align-items-start justify-content-between">
                    <div className="d-flex">
                      <Link href={`/admin/users`} passHref>
                        <a>
                          <img
                            src="/images/icons/back.svg"
                            alt="back button"
                            width="16px"
                            height="16px"
                          />
                        </a>
                      </Link>
                      <div className="mx-4">
                        {user?.profile ? (
                          <img
                            src={user?.profilePicture}
                            alt="userImages"
                            width="58px"
                            height="58px"
                            style={{ borderRadius: "50%", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center"
                            style={{
                              width: 58,
                              height: 58,
                              background: "#F0F0F0",
                              borderRadius: "50%",
                              color: "#A3A3A3",
                              fontSize: 12,
                            }}
                          >
                            {`${user?.firstName?.charAt(
                              0
                            )} ${user?.lastName?.charAt(0)}`}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="mb-3">
                          {user?.firstName} {user?.lastName}
                        </h4>
                        <div className="d-flex align-items-center mb-3">
                          <p className="mb-0">{user?.email}</p>
                        </div>
                        <p className="mb-3 text-small">
                          {user?.code}
                          {user?.phone}
                        </p>
                        <div className="d-flex align-items-baseline">
                          <p className="mb-0" style={{ fontWeight: "300" }}>
                            {user?.country}, {user?.city}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-column">
                      <button
                        className="btn mb-4 sendBtn"
                        onClick={() => setShowModal(true)}
                      >
                        Send Email
                      </button>
                      <button
                        className="suspendBtn"
                        onClick={() =>
                          user?.suspended
                            ? setShowUnsuspendModal(true)
                            : setShowSuspendModal(true)
                        }
                      >
                        {user?.suspended ? "Unsuspend User" : "Suspend User"}
                      </button>
                    </div>
                  </article>
                  <article className="bottom">
                    <h3 className="text-center">
                      {user?.firstName}'s Campaigns
                    </h3>
                    <section className="mx-auto flex-column d-flex align-items-center justify-content-around">
                      <CampaignDetailsHeader />
                      {loading ? (
                        <div className="my-5">
                          <Spinner
                            type="TailSpin"
                            width={30}
                            height={30}
                            color={"var(--color-primary)"}
                          />
                        </div>
                      ) : user?.campaigns ? (
                        user?.campaigns.map((campaign, i) => (
                          <CampaignDetailsCard
                            key={i}
                            campaign={campaign}
                            index={i + 1}
                          />
                        ))
                      ) : (
                        <h2 className="text-center">No campaign</h2>
                      )}
                    </section>
                  </article>
                </Section>
              )}
            </section>
          </section>
        </Wrapper>
        <AdminSendEmailModal
          showModal={showModal}
          onModalClose={() => setShowModal(false)}
          userEmail={user?.email}
          userName={`${user?.firstName} ${user?.lastName}`}
        />
        <SuspendUserModal
          showModal={showSuspendModal}
          onModalClose={() => {
            setShowSuspendModal(false);
            setReload(!reload);
          }}
          profile={user}
        />
        <UnsuspendUserModal
          showModal={showUnsuspendModal}
          onModalClose={() => {
            setShowUnsuspendModal(false);
            setReload(!reload);
          }}
          profile={user}
        />
      </AdminLayout>
    </Layout>
  );
}

const Wrapper = styled.section`
  max-width: 1440px;
  padding: 50px 100px;
  @media screen and (max-width: 1300px) {
    padding: 50px 40px;
  }
  .bordered-wrapper {
    width: 100%;
    background: white;
    max-width: 100%;
    border: 0.5px solid #cccccc;
    box-sizing: border-box;
    border-radius: 4px;
    overflow-x: auto;
    ::-webkit-scrollbar {
      height: 10px;
      pointer: cursor;
      width: 4px;
      background: whitesmoke;
    }
    ::-webkit-scrollbar-thumb:horizontal {
      background: var(--color-primary);
      pointer: cursor;
      border-radius: 4px;
    }
    .section {
      width: 100%;
      min-width: 1160px;

      min-height: 400px;
      background: white;
    }
  }
`;

const Section = styled.section`
  width: 100%;
  .top {
    .sendBtn {
      background: var(--color-primary);
      border-radius: 4px;
      color: white;
      height: 36px !important;
      font-style: normal;
      font-weight: 500;
      font-size: 14px;
      line-height: 143%;
    }
    .suspendBtn {
      background: #ffebeb;
      border: 0.5px solid #f8444f;
      box-sizing: border-box;
      border-radius: 4px;
      color: #f8444f;
      height: 36px;
      font-style: normal;
      font-weight: 500;
      font-size: 14px;
      line-height: 143%;
    }
    h4 {
      font-style: normal;
      font-weight: bold;
      font-size: 18px;
      line-height: 30px;
      color: #514949;
    }
    .progress {
      height: 5px !important;
      background-color: #697af821 !important;
    }
    .progressbar {
      background-color: var(--color-primary) !important;
    }
  }
  .bottom {
    .detailsWrapper {
      width: 100%;
      padding: 0 60px;
    }
  }
`;
