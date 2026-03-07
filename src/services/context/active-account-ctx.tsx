import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import {
  createContext,
  Dispatch,
  FC,
  PropsWithChildren,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { loginRequest } from "../../../auth-config";
import ApiRoutes from "../../routing/api-routes";
import getAuthHeader from "../headers/auth-header";
import type { AccountInfo } from "../_types";
import Notification from "../notifications/notification";

export const ActiveAccountCtx = createContext<{
  localAccount: AccountInfo | null;
  loading: boolean;
  refresh: () => void;
  refreshing: boolean;
  login: () => void;
  logout: () => void;
  setLocalAccount: Dispatch<SetStateAction<AccountInfo | null>>;
}>(null as any);

export const ActiveAccountCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const { instance, inProgress, accounts } = useMsal();

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
      if (!res.ok) throw await res.text();
      setLocalAccount(await res.json());
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  // Wait until MsalProvider has finished initializing (and processing any login redirect)
  // before checking auth state. inProgress === None means MSAL is idle.
  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;
    // msal-browser v5 does not auto-set the active account after login/redirect.
    // If accounts exist in the cache but no active account is selected yet, pick the first one.
    // This covers both fresh logins (in case the LOGIN_SUCCESS event fires after this effect)
    // and cached sessions on page refresh.
    if (accounts.length > 0 && !instance.getActiveAccount()) {
      instance.setActiveAccount(accounts[0]);
    }
    async function firstLoad() {
      if (!instance.getActiveAccount()) return setLoading(false);
      const notification = new Notification("bottom-right");
      notification.loading("Loading your account...");
      await fetchAccountUpdateLastLogin();
      setLoading(false);
      notification.close();
    }
    firstLoad();
  }, [instance, inProgress, accounts]);

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
    // clearCache clears MSAL state without triggering a browser redirect (v5 replacement for onRedirectNavigate: () => false)
    instance.clearCache().catch((e: any) => {
      new Notification().error(e);
    });
  }

  return (
    <ActiveAccountCtx.Provider
      value={{ localAccount, loading, login, logout, refresh, refreshing, setLocalAccount }}
    >
      {children}
    </ActiveAccountCtx.Provider>
  );
};
