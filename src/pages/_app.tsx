import "../styles/globals.scss";
import type { AppProps } from "next/app";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "../../auth-config";
import Head from "next/head";
import Navbar from "../components/navbar/@navbar";
import { LocalAccountCtxProvider } from "../context/local-account-ctx";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>WIIM</title>
      </Head>
      <MsalProvider instance={msalInstance}>
        <LocalAccountCtxProvider>
          <Navbar />
          <Component {...pageProps} />
        </LocalAccountCtxProvider>
      </MsalProvider>
    </>
  );
}

export default MyApp;
