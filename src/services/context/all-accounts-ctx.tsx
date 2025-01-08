import { createContext, FC, PropsWithChildren, useContext, useEffect, useState } from "react";
import ApiRoutes from "../../routing/api-routes";
import getAuthHeader from "../headers/auth-header";
import Notification from "../notifications/notification";
import type { AccountInfo } from "../_types";
import { ActiveAccountCtx } from "./active-account-ctx";
import { useAdminDetails } from "./selected-institute-ctx";

export const AllAccountsCtx = createContext<{
  allAccounts: AccountInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllAccountsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const { localAccount } = useContext(ActiveAccountCtx);
  const [allAccounts, setAllAccounts] = useState<AccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = useAdminDetails();

  async function fetchAllAccounts() {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const result = await fetch(`${ApiRoutes.allAccounts}`, {
        headers: authHeader,
      });
      if (!result.ok) throw await result.text();
      const accounts: AccountInfo[] = await result.json();
      accounts.sort((a, b) => a.first_name.localeCompare(b.first_name));
      setAllAccounts(accounts);
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  useEffect(() => {
    if (!isAdmin && !localAccount?.is_super_admin) return;
    async function firstLoad() {
      await fetchAllAccounts();
      setLoading(false);
    }
    firstLoad();
  }, [localAccount, isAdmin]);

  async function refresh() {
    if (!isAdmin && !localAccount?.is_super_admin) return;
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    await fetchAllAccounts();
    setRefreshing(false);
    notification.close();
  }

  return (
    <AllAccountsCtx.Provider
      value={{ allAccounts, loading, refresh, refreshing }}
    >
      {children}
    </AllAccountsCtx.Provider>
  );
};
