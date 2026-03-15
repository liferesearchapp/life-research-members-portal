import type { grant } from "@prisma/client";
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

async function fetchAllGrants(): Promise<grant[]> {
  try {
    const res = await fetch(ApiRoutes.allGrants);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

function enSorter(a: grant, b: grant): number {
  return a.title.localeCompare(b.title);
}

function frSorter(a: grant, b: grant): number {
  return a.title.localeCompare(b.title);
}

export const GrantsCtx = createContext<{
  grants: grant[];
  grantMap: Map<number, grant>;
  refresh: () => void;
  set: (grant: grant) => void;
}>(null as any);

export const GrantsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [grants, setGrants] = useState<grant[]>([]);
  const [grantMap, setGrantMap] = useState(new Map<number, grant>());
  const { en } = useContext(LanguageCtx);

  async function getGrants() {
    const grants = await fetchAllGrants();
    setGrants(grants.sort(en ? enSorter : frSorter));
    setGrantMap(new Map(grants.map((g) => [g.id, g])));
  }

  useEffect(() => {
    getGrants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setGrants((prev) => prev.sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getGrants();
  }

  function set(grnt: grant) {
    setGrants((prev) => {
      const curr = prev.filter((g) => g.id !== grnt.id);
      curr.push(grnt);
      return curr.sort(en ? enSorter : frSorter);
    });
  }

  return (
    <GrantsCtx.Provider value={{ grants, grantMap, refresh, set }}>
      {children}
    </GrantsCtx.Provider>
  );
};
