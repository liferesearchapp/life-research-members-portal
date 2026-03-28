import {
  PublicClientApplication,
  type RedirectRequest,
  type Configuration,
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
    cacheLocation: BrowserCacheLocation.LocalStorage, // This configures where your cache will be stored
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

let msalInitializationPromise: Promise<void> | null = null;

export function ensureMsalInitialized() {
  if (!msalInitializationPromise) {
    msalInitializationPromise = msalInstance.initialize();
  }

  return msalInitializationPromise;
}

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
