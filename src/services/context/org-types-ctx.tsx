import type { org_type } from "@prisma/client";
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

function enSorter(a: org_type, b: org_type) {
  return a.name_en.localeCompare(b.name_en);
}

function frSorter(a: org_type, b: org_type) {
  return a.name_fr.localeCompare(b.name_fr);
}

export const OrgTypesCtx = createContext<{
  orgTypes: org_type[];
  refresh: () => void;
}>(null as any);

async function fetchAllOrgTypes(): Promise<org_type[]> {
  try {
    const res = await fetch(ApiRoutes.allOrgTypes);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const OrgTypesCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [orgTypes, setOrgTypes] = useState<org_type[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getOrgTypes() {
    setOrgTypes((await fetchAllOrgTypes()).sort(en ? enSorter : frSorter));
  }

  useEffect(() => {
    getOrgTypes();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setOrgTypes((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getOrgTypes();
  }

  return (
    <OrgTypesCtx.Provider value={{ orgTypes, refresh }}>
      {children}
    </OrgTypesCtx.Provider>
  );
};
