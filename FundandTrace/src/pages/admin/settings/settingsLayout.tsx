import styled from "styled-components";
import AdminLayout from "../AdminLayout";
import Layout from "../../../components/Layout";
import Link from "next/link";
import { ReactNode } from "react";

const navlinks = [
  {
    title: "General Settings",
    description: "Manage application wide settings",
    link: "",
  },
  {
    title: "Personal Settings",
    description: "Customize your experience",
    link: "personal-settings",
  },
  {
    title: "Security",
    description: "Two-step verification",
    link: "security",
  },
  {
    title: "Notification Settings",
    description: "Enable or disable notifications",
    link: "notification-settings",
  },
];

interface AdminSettingsPageLayoutProps {
  children: ReactNode;
  currentPage: number;
}

export default function AdminSettingsPageLayout({
  children,
  currentPage,
}: AdminSettingsPageLayoutProps) {
  return (
    <Layout title="Fund&Trace | Admin">
      <AdminLayout active="Settings">
        <Wrapper className="mx-auto d-flex">
          <aside className="layout-left">
            {navlinks.map((link, i) => (
              <Link href={`/admin/settings/${link.link}`} passHref key={i}>
                <Article
                  className="mb-5 py-3"
                  style={{
                    borderLeft: currentPage === i ? "4px solid var(--color-primary)" : "",
                  }}
                  role="button"
                >
                  <h3 className="mb-2">{link?.title}</h3>
                  <p className="mb-0">{link?.description}</p>
                </Article>
              </Link>
            ))}
          </aside>
          <aside className="layout-right">{children}</aside>
        </Wrapper>
      </AdminLayout>
    </Layout>
  );
}

const Article = styled.article`
  h3 {
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 20px;
    color: #514949;
  }
  p {
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 100%;
    color: #a3a3a3;
  }
  padding-left: 35px;
  padding-right: 35px;
`;

const Wrapper = styled.section`
  max-width: 1440px;
  padding: 50px 100px;
  @media screen and (max-width: 1300px) {
    padding: 50px 40px;
  }
  aside {
    background: #ffffff;
    border: 0.5px solid #cccccc;
    box-sizing: border-box;
    border-radius: 4px;
  }
  .layout-left {
    width: 310px;
    margin-right: 33px;
    padding: 35px 0px 35px 0px;
  }
  .layout-right {
    width: 877px;
    padding: 35px;
  }
  // .bordered-wrapper {
  //   width: 100%;
  //   background: white;
  //   max-width: 100%;
  //   border: 0.5px solid #cccccc;
  //   box-sizing: border-box;
  //   border-radius: 4px;
  //   overflow-x: auto;
  //   ::-webkit-scrollbar {
  //     height: 10px;
  //     pointer: cursor;
  //     width: 4px;
  //     background: whitesmoke;
  //   }
  //   ::-webkit-scrollbar-thumb:horizontal {
  //     background: var(--color-primary);
  //     pointer: cursor;
  //     border-radius: 4px;
  //   }
  //   section {
  //     min-width: 1160px;
  //     max-width: 100%;
  //     min-height: 400px;
  //     background: white;
  //     aside {
  //       min-width: 350px;
  //       max-width: 350px;
  //     }
  //     main {
  //       width: 100%;
  //       .input-div {
  //         width: 100%;
  //         border-radius: 4px;
  //         background: #ffffff;
  //         box-shadow: 0px 2px 24px rgba(229, 229, 229, 0.4);
  //         button {
  //           background: var(--color-primary);
  //           padding: 10px 40px;
  //           border-radius: 4px;
  //         }
  //         textarea {
  //           background: white;

  //           border-radius: 4px;
  //           width: 100%;
  //           height: 200px;
  //           padding: 15px 20px;
  //         }
  //       }
  //       h4 {
  //         font-style: normal;
  //         font-weight: 500;
  //         font-size: 16px;
  //         line-height: 30px;
  //         color: #514949;
  //       }
  //       p {
  //         font-style: normal;
  //         font-weight: normal;
  //         font-size: 14px;
  //         line-height: 30px;
  //         color: #a3a3a3;
  //       }
  //     }
  //   }
  // }
`;
