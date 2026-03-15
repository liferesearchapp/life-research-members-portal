import "../antd-react19-patch";
import "../styles/_globals.scss";
import type { AppProps } from "next/app";
import { App } from "antd";
import { MsalProvider } from "@azure/msal-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { msalInstance } from "../../auth-config";
import InstituteGuard from "../components/institute-guard";
import Navbar from "../components/navbar/_navbar";
import AllContextProviders from "../services/context/_ctx-bundler";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  function getSuffix() {
    const path = router.pathname;
    if (path.includes("/accounts")) return "Accounts";
    if (path.includes("/members")) return "Members";
    if (path.includes("/products")) return "Products";
    if (path.includes("/partners")) return "Partners";
    if (path.includes("/grants")) return "Grants";
    if (path.includes("/events")) return "Events";
    if (path.includes("/supervisions")) return "Supervisions";
    if (path.includes("/institutes")) return "Institutes";
    if (path === "/register") return "Register";
    if (path === "/my-profile") return "My Profile";
    if (path === "/" || path === "/[instituteId]") return "Home";
    return "";
  }

  const suffix = getSuffix();
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
            <InstituteGuard>
              <div className="next-page-container">
                <Component {...pageProps} />
              </div>
            </InstituteGuard>
          </AllContextProviders>
        </App>
      </MsalProvider>
    </>
  );
}

export default MyApp;
