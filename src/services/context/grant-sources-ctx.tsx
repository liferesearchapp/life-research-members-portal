import type { source } from "@prisma/client";
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

function enSorter(a: source, b: source) {
  return a.name_en.localeCompare(b.name_en);
}

function frSorter(a: source, b: source) {
  return a.name_fr.localeCompare(b.name_fr);
}

export const GrantSourcesCtx = createContext<{
  grantSources: source[];
  refresh: () => void;
}>(null as any);

async function fetchAllSources(): Promise<source[]> {
  try {
    const res = await fetch(ApiRoutes.allSources);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const GrantSourcesCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [grantSources, setGrantSources] = useState<source[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getSources() {
    setGrantSources((await fetchAllSources()).sort(en ? enSorter : frSorter));
  }

  useEffect(() => {
    getSources();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setGrantSources((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getSources();
  }

  return (
    <GrantSourcesCtx.Provider value={{ grantSources, refresh }}>
      {children}
    </GrantSourcesCtx.Provider>
  );
};
