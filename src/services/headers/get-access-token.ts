import {
  ensureMsalInitialized,
  msalInstance,
  scopes,
} from "../../../auth-config";
import { en } from "../context/language-ctx";
import Notification from "../notifications/notification";

// See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/token-lifetimes.md

export default async function getAccessToken(): Promise<string | null> {
  await ensureMsalInitialized();

  const activeAccount = msalInstance.getActiveAccount();
  const fallbackAccount = msalInstance.getAllAccounts()[0] || null;
  const account = activeAccount || fallbackAccount;

  if (account && !activeAccount) {
    msalInstance.setActiveAccount(account);
  }

  if (!account) return null;

  return msalInstance
    .acquireTokenSilent({ scopes, account })
    .then((res) => res.accessToken)
    .catch((e: any) => {
      // Just assume any error means session has expired
      console.warn(e);
      new Notification().warning(
        en
          ? "Your session has expired, please login again."
          : "Votre session a expiré, veuillez vous reconnecter."
      );
      // Log them out to clear the cache and active user
      msalInstance
        .logoutRedirect()
        .catch((e: any) => new Notification().error(e));
      return null;
    });
}
