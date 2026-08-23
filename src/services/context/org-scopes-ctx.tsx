import type { org_scope } from "@prisma/client";
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

function enSorter(a: org_scope, b: org_scope) {
  return a.name_en.localeCompare(b.name_en);
}

function frSorter(a: org_scope, b: org_scope) {
  return a.name_fr.localeCompare(b.name_fr);
}

export const OrgScopeCtx = createContext<{
  orgScopes: org_scope[];
  refresh: () => void;
}>(null as any);

async function fetchAllOrgScopes(): Promise<org_scope[]> {
  try {
    const res = await fetch(ApiRoutes.allOrgScopes);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const OrgScopeCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [orgScopes, setOrgScopes] = useState<org_scope[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getOrgScopes() {
    setOrgScopes((await fetchAllOrgScopes()).sort(en ? enSorter : frSorter));
  }

  useEffect(() => {
    getOrgScopes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setOrgScopes((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getOrgScopes();
  }

  return (
    <OrgScopeCtx.Provider value={{ orgScopes, refresh }}>
      {children}
    </OrgScopeCtx.Provider>
  );
};
