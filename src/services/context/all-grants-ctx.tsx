import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import type { GrantPublicInfo } from "../_types";
import { useSelectedInstitute } from "./selected-institute-ctx"; // Adjust this path as necessary.

export const AllGrantsCtx = createContext<{
  allGrants: GrantPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllGrantsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [allGrants, setAllGrants] = useState<GrantPublicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { institute } = useSelectedInstitute();

  const fetchAllGrants = useCallback(async () => {
    if (!institute) {
      console.log("Institute not found.");
      setLoading(false);
      return;
    }

    try {
      const queryParam = `?instituteId=${institute.urlIdentifier}`;
      const result = await fetch(`${ApiRoutes.allGrants}${queryParam}`);
      if (!result.ok) throw await result.text();
      let grants: GrantPublicInfo[] = await result.json();

      grants.sort((a, b) => a.title?.localeCompare(b.title));
      setAllGrants(grants);
    } catch (e: any) {
      new Notification().error(e.message);
    } finally {
      setLoading(false);
    }
  }, [institute]);

  useEffect(() => {
    async function firstLoad() {
      if (institute) {
        await fetchAllGrants();
      }
      setLoading(false);
    }
    firstLoad();
  }, [fetchAllGrants, institute]);

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
    <AllGrantsCtx.Provider value={{ allGrants, loading, refreshing, refresh }}>
      {children}
    </AllGrantsCtx.Provider>
  );
};
