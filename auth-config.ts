import {
  PublicClientApplication,
  RedirectRequest,
  Configuration,
  BrowserCacheLocation,
  EventType,
  type AuthenticationResult,
} from "@azure/msal-browser";

// See https://learn.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react

const msalConfig: Configuration = {
  auth: {
    clientId: "2f1170e0-1177-43a3-9e2d-380d4662175b",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: typeof window === "undefined" ? undefined : window.location.origin, // undefined if in Node.js server
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// MsalProvider (v3+) calls initialize() and handleRedirectPromise() internally.
// This callback runs after a successful login redirect to ensure the active account is set.
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const payload = event.payload as AuthenticationResult;
    msalInstance.setActiveAccount(payload.account);
  }
});

export const scopes = ["User.Read", "openid", "email"];

export const loginRequest: RedirectRequest = {
  scopes,
  prompt: "select_account",
};
