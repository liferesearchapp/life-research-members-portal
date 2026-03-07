import type { event_type } from "@prisma/client";
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

function enSorter(a: event_type, b: event_type) {
  return a.name_en.localeCompare(b.name_en);
}

function frSorter(a: event_type, b: event_type) {
  return a.name_fr.localeCompare(b.name_fr);
}

export const EventTypesCtx = createContext<{
  eventTypes: event_type[];
  refresh: () => void;
}>(null as any);

async function fetchAllEventTypes(): Promise<event_type[]> {
  try {
    const res = await fetch(ApiRoutes.allEventTypes);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const EventTypesCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [eventTypes, setEventTypes] = useState<event_type[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getEventTypes() {
    setEventTypes((await fetchAllEventTypes()).sort(en ? enSorter : frSorter));
  }

  useEffect(() => {
    getEventTypes();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setEventTypes((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getEventTypes();
  }

  return (
    <EventTypesCtx.Provider value={{ eventTypes, refresh }}>
      {children}
    </EventTypesCtx.Provider>
  );
};
