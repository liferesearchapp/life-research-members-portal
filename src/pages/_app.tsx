import "@ant-design/v5-patch-for-react-19";
import "../styles/_globals.scss";
import type { AppProps } from "next/app";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "../../auth-config";
import Head from "next/head";
import Navbar from "../components/navbar/_navbar";
import { useRouter } from "next/router";
import PageRoutes from "../routing/page-routes";
import AllContextProviders from "../services/context/_ctx-bundler";
import { App } from "antd";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  function getSuffix() {
    const path = router.pathname;
    if (path.startsWith(PageRoutes.allAccounts)) return "Accounts";
    if (path.startsWith(PageRoutes.allMembers)) return "Members";
    if (path.startsWith(PageRoutes.register)) return "Register";
    if (path.startsWith(PageRoutes.myProfile)) return "My Profile";
    if (path === PageRoutes.home) return "Home";
    return "";
  }
  let suffix = getSuffix();
  let title = "LIFE";
  if (suffix) title += " - " + suffix;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <MsalProvider instance={msalInstance}>
        <App>
          <AllContextProviders>
            <Navbar />
            <div className="next-page-container">
              <Component {...pageProps} />
            </div>
          </AllContextProviders>
        </App>
      </MsalProvider>
    </>
  );
}

export default MyApp;
