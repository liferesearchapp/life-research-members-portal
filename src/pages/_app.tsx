import "../styles/_globals.scss";
import type { AppProps } from "next/app";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "../../auth-config";
import Head from "next/head";
import Navbar from "../components/navbar/_navbar";
import { useRouter } from "next/router";
import PageRoutes from "../routing/page-routes";
import AllContextProviders from "../services/context/_ctx-bundler";
import InstituteGuard from "../components/institute-guard";
import InstituteBrandingTheme from "../components/institutes/institute-branding-theme";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <MsalProvider instance={msalInstance}>
        <AllContextProviders>
          <InstituteBrandingTheme />
          <Navbar />
          <InstituteGuard>
            <div className="next-page-container">
              <Component {...pageProps} />
            </div>
          </InstituteGuard>
        </AllContextProviders>
      </MsalProvider>
    </>
  );
}

export default MyApp;
