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
import getAuthHeader from "../headers/auth-header";
import Notification from "../notifications/notification";
import type { SupervisionPublicInfo } from "../_types";
import { useSelectedInstitute } from "./selected-institute-ctx"; // Adjust this path as necessary.

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { institute } = useSelectedInstitute();

  const fetchAllSupervisions = useCallback(async () => {
    if (!institute) {
      setLoading(false);
      return;
    }

    try {
      const queryParam = `?instituteId=${institute.urlIdentifier}`;
      // /api/all-supervisions now requires authentication.
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setLoading(false);
        return;
      }
      const result = await fetch(`${ApiRoutes.allSupervisions}${queryParam}`, {
        headers: authHeader,
      });
      if (!result.ok) throw await result.text();
      let supervisions: SupervisionPublicInfo[] = await result.json();

      supervisions.sort((a, b) => a.first_name.localeCompare(b.first_name));
      setAllSupervisions(supervisions);
    } catch (e: any) {
      new Notification().error(e);
    } finally {
      setLoading(false);
    }
  }, [institute]);

  useEffect(() => {
    async function firstLoad() {
      if (institute) {
        await fetchAllSupervisions();
      }
      setLoading(false);
    }
    firstLoad();
  }, [fetchAllSupervisions, institute]);

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
      value={{ allSupervisions, loading, refreshing, refresh }}
    >
      {children}
    </AllSupervisionsCtx.Provider>
  );
};
