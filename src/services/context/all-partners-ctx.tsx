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
import type { PartnerPublicInfo } from "../_types";
import getAuthHeader from "../headers/auth-header";
import { useSelectedInstitute } from "./selected-institute-ctx";

export const AllPartnersCtx = createContext<{
  allPartners: PartnerPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllPartnersCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [allPartners, setAllPartners] = useState<PartnerPublicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { institute } = useSelectedInstitute();

  const fetchAllPartners = useCallback(async () => {
    if (!institute) {
      console.log("Institute not found.");
      setLoading(false);
      return;
    }

    try {
      const queryParam = `?instituteId=${institute?.urlIdentifier}`;
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const result = await fetch(`${ApiRoutes.allPartners}${queryParam}`, {
        headers: authHeader,
      });
      if (!result.ok) throw await result.text();
      let partners: PartnerPublicInfo[] = await result.json();

      partners.sort((a, b) => a.name_en!.localeCompare(b.name_en!));
      setAllPartners(partners);
    } catch (e: any) {
      new Notification().error(e.message);
    } finally {
      setLoading(false);
    }
  }, [institute]);

  useEffect(() => {
    async function firstLoad() {
      institute && (await fetchAllPartners());
      setLoading(false);
    }
    firstLoad();
  }, [fetchAllPartners, institute]);

  async function refresh() {
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    await fetchAllPartners();
    setRefreshing(false);
    notification.close();
  }

  return (
    <AllPartnersCtx.Provider
      value={{ allPartners, loading, refreshing, refresh }}
    >
      {children}
    </AllPartnersCtx.Provider>
  );
};
