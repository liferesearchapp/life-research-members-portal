import type { member_type } from "@prisma/client";
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

function enSorter(a: member_type, b: member_type) {
  return a.name_en.localeCompare(b.name_en);
}

function frSorter(a: member_type, b: member_type) {
  return a.name_fr.localeCompare(b.name_fr);
}

export const MemberTypesCtx = createContext<{
  memberTypes: member_type[];
  refresh: () => void;
}>(null as any);

async function fetchAllMemberTypes(): Promise<member_type[]> {
  try {
    const res = await fetch(ApiRoutes.allMemberTypes);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const MemberTypesCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [memberTypes, setMemberTypes] = useState<member_type[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getMemberTypes() {
    setMemberTypes(
      (await fetchAllMemberTypes()).sort(en ? enSorter : frSorter)
    );
  }

  useEffect(() => {
    getMemberTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMemberTypes((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getMemberTypes();
  }

  return (
    <MemberTypesCtx.Provider value={{ memberTypes, refresh }}>
      {children}
    </MemberTypesCtx.Provider>
  );
};
