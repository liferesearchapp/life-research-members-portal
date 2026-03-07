import type { keyword } from "@prisma/client";
import { createContext, type FC, type PropsWithChildren, useContext, useEffect, useState } from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import { LanguageCtx } from "./language-ctx";

async function fetchAllKeywords(): Promise<keyword[]> {
  try {
    const res = await fetch(ApiRoutes.allKeywords);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

function enSorter(a: keyword, b: keyword): number {
  return (a.name_en || a.name_fr || "").localeCompare(b.name_en || b.name_fr || "");
}

function frSorter(a: keyword, b: keyword): number {
  return (a.name_fr || a.name_en || "").localeCompare(b.name_fr || b.name_en || "");
}

export const AllKeywordsCtx = createContext<{
  keywords: keyword[];
  keywordMap: Map<number, keyword>;
  refresh: () => void;
  set: (keyword: keyword) => void;
}>(null as any);

export const AllKeywordsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [keywords, setKeywords] = useState<keyword[]>([]);
  const [keywordMap, setKeywordMap] = useState(new Map<number, keyword>());
  const { en } = useContext(LanguageCtx);

  async function getKeywords() {
    const keywords = await fetchAllKeywords();
    setKeywords(keywords.sort(en ? enSorter : frSorter));
    setKeywordMap(new Map(keywords.map((k) => [k.id, k])));
  }

  useEffect(() => {
    getKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setKeywords((prev) => prev.sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getKeywords();
  }

  function set(keyword: keyword) {
    setKeywords((prev) => {
      const curr = prev.filter((k) => k.id !== keyword.id);
      curr.push(keyword);
      return curr.sort(en ? enSorter : frSorter);
    });
  }

  return (
    <AllKeywordsCtx.Provider value={{ keywords, keywordMap, refresh, set }}>
      {children}
    </AllKeywordsCtx.Provider>
  );
};
