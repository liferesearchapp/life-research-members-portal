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
import type { EventPublicInfo } from "../_types";
import { useSelectedInstitute } from "./selected-institute-ctx"; // Adjust this path as necessary.

export const AllEventsCtx = createContext<{
  allEvents: EventPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllEventsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [allEvents, setAllEvents] = useState<EventPublicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { institute } = useSelectedInstitute();

  const fetchAllEvents = useCallback(async () => {
    if (!institute) {
      console.log("Institute not found.");
      setLoading(false);
      return;
    }

    try {
      const queryParam = `?instituteId=${institute.urlIdentifier}`;
      const result = await fetch(`${ApiRoutes.allEvents}${queryParam}`);
      if (!result.ok) throw await result.text();
      let events: EventPublicInfo[] = await result.json();

      events.sort((a, b) => a.name_en.localeCompare(b.name_fr));
      setAllEvents(events);
    } catch (e: any) {
      new Notification().error(e);
    }
  }, [institute]);

  useEffect(() => {
    async function firstLoad() {
      if (institute) {
        await fetchAllEvents();
      }
      setLoading(false);
    }
    firstLoad();
  }, [fetchAllEvents, institute]);

  async function refresh() {
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    await fetchAllEvents();
    setRefreshing(false);
    notification.close();
  }

  return (
    <AllEventsCtx.Provider value={{ allEvents, loading, refresh, refreshing }}>
      {children}
    </AllEventsCtx.Provider>
  );
};
