import type { status } from "@prisma/client";
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

function enSorter(a: status, b: status) {
  return a.name_en.localeCompare(b.name_en);
}

function frSorter(a: status, b: status) {
  return a.name_fr.localeCompare(b.name_fr);
}

export const GrantStatusCtx = createContext<{
  grantStatuses: status[];
  refresh: () => void;
}>(null as any);

async function fetchAllGrantStatuses(): Promise<status[]> {
  try {
    const res = await fetch(ApiRoutes.allStatuses);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const GrantStatusCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [grantStatuses, setGrantStatuses] = useState<status[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getGrantStatuses() {
    setGrantStatuses(
      (await fetchAllGrantStatuses()).sort(en ? enSorter : frSorter)
    );
  }

  useEffect(() => {
    getGrantStatuses();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setGrantStatuses((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getGrantStatuses();
  }

  return (
    <GrantStatusCtx.Provider value={{ grantStatuses, refresh }}>
      {children}
    </GrantStatusCtx.Provider>
  );
};
