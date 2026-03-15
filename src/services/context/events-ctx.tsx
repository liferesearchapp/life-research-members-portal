import type { event } from "@prisma/client";
import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import { LanguageCtx } from "./language-ctx";

async function fetchAllEvents(): Promise<event[]> {
  try {
    const res = await fetch(ApiRoutes.allEvents);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

function enSorter(a: event, b: event): number {
  return (a.name_en || a.name_fr || "").localeCompare(
    b.name_en || b.name_fr || ""
  );
}

function frSorter(a: event, b: event): number {
  return (a.name_fr || a.name_en || "").localeCompare(
    b.name_fr || b.name_en || ""
  );
}

export const EventsCtx = createContext<{
  events: event[];
  eventMap: Map<number, event>;
  refresh: () => void;
  set: (event: event) => void;
}>(null as any);

export const EventsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [events, setEvents] = useState<event[]>([]);
  const [eventMap, setEventMap] = useState(new Map<number, event>());
  const { en } = useContext(LanguageCtx);

  async function getEvents() {
    const events = await fetchAllEvents();
    setEvents(events.sort(en ? enSorter : frSorter));
    setEventMap(new Map(events.map((k) => [k.id, k])));
  }

  useEffect(() => {
    getEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setEvents((prev) => prev.sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getEvents();
  }

  function set(eventItem: event) {
    setEvents((prev) => {
      const curr = prev.filter((k) => k.id !== eventItem.id);
      curr.push(eventItem);
      return curr.sort(en ? enSorter : frSorter);
    });
  }

  return (
    <EventsCtx.Provider value={{ events, eventMap, refresh, set }}>
      {children}
    </EventsCtx.Provider>
  );
};
