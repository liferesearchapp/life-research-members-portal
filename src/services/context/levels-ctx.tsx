import type { level } from "@prisma/client";
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

function enSorter(a: level, b: level) {
  return a.name_en.localeCompare(b.name_en);
}

function frSorter(a: level, b: level) {
  return a.name_fr.localeCompare(b.name_fr);
}

export const LevelsCtx = createContext<{
  levels: level[];
  refresh: () => void;
}>(null as any);

async function fetchAllLevels(): Promise<level[]> {
  try {
    const res = await fetch(ApiRoutes.allLevels);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const LevelsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [levels, setLevels] = useState<level[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getLevels() {
    setLevels((await fetchAllLevels()).sort(en ? enSorter : frSorter));
  }

  useEffect(() => {
    getLevels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLevels((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getLevels();
  }

  return (
    <LevelsCtx.Provider value={{ levels, refresh }}>
      {children}
    </LevelsCtx.Provider>
  );
};
