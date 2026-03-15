import {
  createContext,
  type FC,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import type { SupervisionPublicInfo } from "../_types";

export const AllSupervisionsCtx = createContext<{
  allSupervisions: SupervisionPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllSupervisionsCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [allSupervisions, setAllSupervisions] = useState<
    SupervisionPublicInfo[]
  >([]);
  const [loading, setLoading] = useState(true); // true so loading icons are served from server
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAllSupervisions() {
    try {
      const result = await fetch(ApiRoutes.allSupervisions);
      if (!result.ok) throw await result.text();
      let supervision: SupervisionPublicInfo[] = await result.json();

      supervision.sort((a, b) => a.first_name?.localeCompare(b.first_name));
      setAllSupervisions(supervision);
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  useEffect(() => {
    async function firstLoad() {
      await fetchAllSupervisions();
      setLoading(false);
    }
    firstLoad();
  }, []);

  async function refresh() {
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    await fetchAllSupervisions();
    setRefreshing(false);
    notification.close();
  }

  return (
    <AllSupervisionsCtx.Provider
      value={{ allSupervisions, loading, refresh, refreshing }}
    >
      {children}
    </AllSupervisionsCtx.Provider>
  );
};
