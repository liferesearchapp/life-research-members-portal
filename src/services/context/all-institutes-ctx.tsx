import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import getAuthHeader from "../headers/auth-header";
import Notification from "../notifications/notification";
import { ActiveAccountCtx } from "./active-account-ctx";
import type { InstituteInfo } from "../_types";

export const AllInstitutesCtx = createContext<{
  allInstitutes: InstituteInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllInstitutesCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const { localAccount } = useContext(ActiveAccountCtx);
  const [allInstitutes, setAllInstitutes] = useState<InstituteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAllInstitutes() {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const result = await fetch(ApiRoutes.allInstitutes, {
        headers: authHeader,
      }); // Ensure ApiRoutes has an 'allInstitutes' endpoint
      if (!result.ok) throw await result.text();
      const institutes: InstituteInfo[] = await result.json();
      institutes.sort((a, b) => a.name.localeCompare(b.name));
      setAllInstitutes(institutes);
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  useEffect(() => {
    if (!localAccount) {
      setLoading(false);
      return;
    }
    if (
      !localAccount.is_super_admin &&
      localAccount.instituteAdmin.length === 0 &&
      (localAccount.member?.institutes.length || 0) === 0
    ) {
      setLoading(false);
      return;
    }
    async function firstLoad() {
      await fetchAllInstitutes();
      setLoading(false);
    }
    firstLoad();
  }, [localAccount]);

  async function refresh() {
    if (!localAccount) return;
    if (
      !localAccount.is_super_admin &&
      localAccount.instituteAdmin.length === 0 &&
      (localAccount.member?.institutes.length || 0) === 0
    )
      return;
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    await fetchAllInstitutes();
    setRefreshing(false);
    notification.close();
  }

  return (
    <AllInstitutesCtx.Provider
      value={{ allInstitutes, loading, refresh, refreshing }}
    >
      {children}
    </AllInstitutesCtx.Provider>
  );
};
