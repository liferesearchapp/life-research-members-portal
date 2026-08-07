import type { topic } from "@prisma/client";
import {
  createContext,
  type FC,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import { LanguageCtx } from "./language-ctx";
import { useSelectedInstitute } from "./selected-institute-ctx";

async function fetchAllTopics(urlIdentifier: string): Promise<topic[]> {
  try {
    const query = new URLSearchParams({ instituteId: urlIdentifier });
    const res = await fetch(`${ApiRoutes.allTopics}?${query}`);
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
  const { institute } = useSelectedInstitute();

  const getTopics = useCallback(async () => {
    if (!institute) {
      setTopics([]);
      setTargetMap(new Map());
      return;
    }

    const fetchedTopics = await fetchAllTopics(institute.urlIdentifier);
    const sortedTopics = [...fetchedTopics].sort(en ? enSorter : frSorter);
    setTopics(sortedTopics);
    setTargetMap(new Map(sortedTopics.map((topic) => [topic.id, topic])));
  }, [en, institute]);

  useEffect(() => {
    void getTopics();
  }, [getTopics]);

  function refresh() {
    void getTopics();
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
