import type { topic } from "@prisma/client";
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

async function fetchAllTopics(): Promise<topic[]> {
  try {
    const res = await fetch(ApiRoutes.allTopics);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

function enSorter(a: topic, b: topic): number {
  return (a.name_en || a.name_fr || "").localeCompare(
    b.name_en || b.name_fr || ""
  );
}

function frSorter(a: topic, b: topic): number {
  return (a.name_fr || a.name_en || "").localeCompare(
    b.name_fr || b.name_en || ""
  );
}

export const AllTopicsCtx = createContext<{
  topics: topic[];
  topicMap: Map<number, topic>;
  refresh: () => void;
  set: (topic: topic) => void;
}>(null as any);

export const AllTopicsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [topics, setTopics] = useState<topic[]>([]);
  const [topicMap, setTargetMap] = useState(new Map<number, topic>());
  const { en } = useContext(LanguageCtx);

  async function getTopics() {
    const topics = await fetchAllTopics();
    setTopics(topics.sort(en ? enSorter : frSorter));
    setTargetMap(new Map(topics.map((k) => [k.id, k])));
  }

  useEffect(() => {
    getTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTopics((prev) => prev.sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getTopics();
  }

  function set(keyword: topic) {
    setTopics((prev) => {
      const curr = prev.filter((k) => k.id !== keyword.id);
      curr.push(keyword);
      return curr.sort(en ? enSorter : frSorter);
    });
  }

  return (
    <AllTopicsCtx.Provider value={{ topics, topicMap, refresh, set }}>
      {children}
    </AllTopicsCtx.Provider>
  );
};
