import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import {
  createContext,
  type Dispatch,
  type FC,
  type PropsWithChildren,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { ensureMsalInitialized, loginRequest } from "../../../auth-config";
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

export const ActiveAccountCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
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

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;

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

  async function login() {
    await ensureMsalInitialized();
    instance.loginRedirect(loginRequest).catch((e: any) => {
      new Notification().error(e);
    });
  }

  async function logout() {
    setLocalAccount(null);
    await ensureMsalInitialized();
    instance.clearCache().catch((e: any) => {
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
