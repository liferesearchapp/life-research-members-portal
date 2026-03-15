import { useMsal } from "@azure/msal-react";
import {
  createContext,
  Dispatch,
  FC,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { loginRequest, msalInstance } from "../../../auth-config";
import ApiRoutes from "../../routing/api-routes";
import getAuthHeader from "../headers/auth-header";
import type { AuthenticationResult } from "@azure/msal-common/dist/response/AuthenticationResult";
import type { AccountInfo } from "../_types";
import Notification from "../notifications/notification";

// See https://learn.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-acquire-token?tabs=javascript2
function handleResponse(response: AuthenticationResult | null) {
  if (!response) return;
  msalInstance.setActiveAccount(response.account);
}

/** Await this promise to make sure active account is loaded on redirecting from login screen*/
async function onRedirect() {
  return msalInstance
    .handleRedirectPromise()
    .then(handleResponse)
    .catch((e: any) => console.error("Error after redirect:", e));
}

export const ActiveAccountCtx = createContext<{
  localAccount: AccountInfo | null;
  loading: boolean;
  refresh: () => void;
  refreshing: boolean;
  login: () => void;
  logout: () => void;
  setLocalAccount: Dispatch<SetStateAction<AccountInfo | null>>;
}>(null as any);

export const ActiveAccountCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const { instance } = useMsal();

  const [localAccount, setLocalAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true); // Start true so loading icons are served first
  const [refreshing, setRefreshing] = useState(false);

  /** Gets the current user's account from the database */
  async function fetchLocalAccount() {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return setLocalAccount(null);
      const res = await fetch(ApiRoutes.activeAccount, { headers: authHeader });
      if (!res.ok) throw await res.text();
      setLocalAccount(await res.json());
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  /** Update last login on first load */
  async function fetchAccountUpdateLastLogin() {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return setLocalAccount(null);
      const res = await fetch(ApiRoutes.activeAccountUpdateLastLogin, {
        headers: authHeader,
      });

      const tempLocalAccount = await res.json();

      if (!res.ok) throw await res.text();
      setLocalAccount(tempLocalAccount);
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  useEffect(() => {
    async function firstLoad() {
      await onRedirect();
      if (!instance.getActiveAccount()) return setLoading(false);
      const notification = new Notification("bottom-right");
      notification.loading("Loading your account...");
      await fetchAccountUpdateLastLogin();
      setLoading(false);
      notification.close();
    }
    firstLoad();
  }, [instance]);

  async function refresh() {
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    await fetchLocalAccount();
    setRefreshing(false);
    notification.close();
  }

  function login() {
    instance.loginRedirect(loginRequest).catch((e: any) => {
      new Notification().error(e);
    });
  }

  function logout() {
    setLocalAccount(null);
    instance.logoutRedirect().catch((e: any) => {
      new Notification().error(e);
    });
  }

  return (
    <ActiveAccountCtx.Provider
      value={{
        localAccount,
        loading,
        refresh,
        login,
        logout,
        refreshing,
        setLocalAccount,
      }}
    >
      {children}
    </ActiveAccountCtx.Provider>
  );
};
