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
import { institute } from "@prisma/client";

export const AllInstitutesCtx = createContext<{
  allInstitutes: institute[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllInstitutesCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const { localAccount } = useContext(ActiveAccountCtx);
  const [allInstitutes, setAllInstitutes] = useState<institute[]>([]);
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
      const institutes: institute[] = await result.json();
      institutes.sort((a, b) => a.name.localeCompare(b.name));
      setAllInstitutes(institutes);
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  useEffect(() => {
    if (!localAccount?.is_admin) return;
    async function firstLoad() {
      await fetchAllInstitutes();
      setLoading(false);
    }
    firstLoad();
  }, [localAccount]);

  async function refresh() {
    if (!localAccount?.is_admin) return;
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
