import "../antd-react19-patch";
import "../styles/_globals.scss";
import type { AppProps } from "next/app";
import { App } from "antd";
import { MsalProvider } from "@azure/msal-react";
import { useRouter } from "next/router";
import { msalInstance } from "../../auth-config";
import InstituteGuard from "../components/institute-guard";
import Navbar from "../components/navbar/_navbar";
import AllContextProviders from "../services/context/_ctx-bundler";
import InstituteBrandingTheme from "../components/institutes/institute-branding-theme";
import PageTitle from "../components/page-title";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const isInstitutesPage = router.pathname.startsWith("/institutes");

  return (
    <>
      <MsalProvider instance={msalInstance}>
        <App>
          <AllContextProviders>
            <PageTitle />
            <InstituteBrandingTheme />
            <Navbar />
            {isInstitutesPage ? (
              <div className="next-page-container">
                <Component {...pageProps} />
              </div>
            ) : (
              <InstituteGuard>
                <div className="next-page-container">
                  <Component {...pageProps} />
                </div>
              </InstituteGuard>
            )}
          </AllContextProviders>
        </App>
      </MsalProvider>
    </>
  );
}

export default MyApp;
