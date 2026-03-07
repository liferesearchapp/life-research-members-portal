import type { target } from "@prisma/client";
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

async function fetchAllTargets(): Promise<target[]> {
  try {
    const res = await fetch(ApiRoutes.allTargets);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

function enSorter(a: target, b: target): number {
  return (a.name_en || a.name_fr || "").localeCompare(
    b.name_en || b.name_fr || ""
  );
}

function frSorter(a: target, b: target): number {
  return (a.name_fr || a.name_en || "").localeCompare(
    b.name_fr || b.name_en || ""
  );
}

export const AllTargetsCtx = createContext<{
  targets: target[];
  targetMap: Map<number, target>;
  refresh: () => void;
  set: (target: target) => void;
}>(null as any);

export const AllTargetsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [targets, setTargets] = useState<target[]>([]);
  const [targetMap, setTargetMap] = useState(new Map<number, target>());
  const { en } = useContext(LanguageCtx);

  async function getTargets() {
    const targets = await fetchAllTargets();
    setTargets(targets.sort(en ? enSorter : frSorter));
    setTargetMap(new Map(targets.map((k) => [k.id, k])));
  }

  useEffect(() => {
    getTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTargets((prev) => prev.sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getTargets();
  }

  function set(keyword: target) {
    setTargets((prev) => {
      const curr = prev.filter((k) => k.id !== keyword.id);
      curr.push(keyword);
      return curr.sort(en ? enSorter : frSorter);
    });
  }

  return (
    <AllTargetsCtx.Provider value={{ targets, targetMap, refresh, set }}>
      {children}
    </AllTargetsCtx.Provider>
  );
};
