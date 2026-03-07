import {
  createContext,
  type FC,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import type { GrantPublicInfo } from "../_types";

export const AllGrantsCtx = createContext<{
  allGrants: GrantPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllGrantsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [allGrants, setAllGrants] = useState<GrantPublicInfo[]>([]);
  const [loading, setLoading] = useState(true); // true so loading icons are served from server
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAllGrants() {
    try {
      const result = await fetch(ApiRoutes.allGrants);
      if (!result.ok) throw await result.text();
      let grant: GrantPublicInfo[] = await result.json();

      grant.sort((a, b) => a.title?.localeCompare(b.title));
      setAllGrants(grant);
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  useEffect(() => {
    async function firstLoad() {
      await fetchAllGrants();
      setLoading(false);
    }
    firstLoad();
  }, []);

  async function refresh() {
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    await fetchAllGrants();
    setRefreshing(false);
    notification.close();
  }

  return (
    <AllGrantsCtx.Provider value={{ allGrants, loading, refresh, refreshing }}>
      {children}
    </AllGrantsCtx.Provider>
  );
};
