import type { organization } from "@prisma/client";
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
import getAuthHeader from "../headers/auth-header";
import { LanguageCtx } from "./language-ctx";

async function fetchAllOrganizations(): Promise<organization[]> {
  try {
    // /api/all-organizations now requires authentication; skip silently when logged out (this
    // list only feeds admin forms, not anonymous visitors).
    const authHeader = await getAuthHeader();
    if (!authHeader) return [];
    const res = await fetch(ApiRoutes.allOrganizations, { headers: authHeader });
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

function enSorter(a: organization, b: organization): number {
  return (a.name_en || a.name_fr || "").localeCompare(
    b.name_en || b.name_fr || ""
  );
}

function frSorter(a: organization, b: organization): number {
  return (a.name_fr || a.name_en || "").localeCompare(
    b.name_fr || b.name_en || ""
  );
}

export const AllOrganizationsCtx = createContext<{
  organizations: organization[];
  organizationMap: Map<number, organization>;
  refresh: () => void;
  set: (organization: organization) => void;
}>(null as any);

export const AllOrganizationsCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [organizations, setOrganizations] = useState<organization[]>([]);
  const [organizationMap, setOrganizationMap] = useState(
    new Map<number, organization>()
  );
  const { en } = useContext(LanguageCtx);

  async function getOrganizations() {
    const organizations = await fetchAllOrganizations();
    setOrganizations(organizations.sort(en ? enSorter : frSorter));
    setOrganizationMap(new Map(organizations.map((k) => [k.id, k])));
  }

  useEffect(() => {
    getOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setOrganizations((prev) => prev.sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getOrganizations();
  }

  function set(keyword: organization) {
    setOrganizations((prev) => {
      const curr = prev.filter((k) => k.id !== keyword.id);
      curr.push(keyword);
      return curr.sort(en ? enSorter : frSorter);
    });
  }

  return (
    <AllOrganizationsCtx.Provider
      value={{ organizations, organizationMap, refresh, set }}
    >
      {children}
    </AllOrganizationsCtx.Provider>
  );
};
