import {
  createContext,
  type FC,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import type { EventPublicInfo } from "../_types";

export const AllEventsCtx = createContext<{
  allEvents: EventPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllEventsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [allEvents, setAllEvents] = useState<EventPublicInfo[]>([]);
  const [loading, setLoading] = useState(true); // true so loading icons are served from server
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAllEvents() {
    try {
      const result = await fetch(ApiRoutes.allEvents);
      if (!result.ok) throw await result.text();
      let events: EventPublicInfo[] = await result.json();

      events.sort((a, b) => a.name_en.localeCompare(b.name_fr));
      setAllEvents(events);
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  useEffect(() => {
    async function firstLoad() {
      await fetchAllEvents();
      setLoading(false);
    }
    firstLoad();
  }, []);

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
