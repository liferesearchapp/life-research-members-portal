import {
  createContext,
  type FC,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import type { PartnerPublicInfo } from "../_types";

export const AllPartnersCtx = createContext<{
  allPartners: PartnerPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllPartnersCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [allPartners, setAllPartners] = useState<PartnerPublicInfo[]>([]);
  const [loading, setLoading] = useState(true); // true so loading icons are served from server
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAllPartners() {
    try {
      const result = await fetch(ApiRoutes.allPartners);
      if (!result.ok) throw await result.text();
      let organization: PartnerPublicInfo[] = await result.json();

      organization.sort((a, b) => a.name_en!.localeCompare(b.name_en!));
      setAllPartners(organization);
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  useEffect(() => {
    async function firstLoad() {
      await fetchAllPartners();
      setLoading(false);
    }
    firstLoad();
  }, []);

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
      value={{ allPartners, loading, refresh, refreshing }}
    >
      {children}
    </AllPartnersCtx.Provider>
  );
};
