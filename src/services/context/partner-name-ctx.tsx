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
import { LanguageCtx } from "./language-ctx";

function enSorter(a: organization, b: organization) {
  return a.name_en!.localeCompare(b.name_en!);
}

function frSorter(a: organization, b: organization) {
  return a.name_fr!.localeCompare(b.name_fr!);
}

export const PartnerNameCtx = createContext<{
  partnername: organization[];
  refresh: () => void;
}>(null as any);

async function fetchAllPartnerName(): Promise<organization[]> {
  try {
    const res = await fetch(ApiRoutes.allPartners);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const PartnerNameCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [partnername, setPartnerName] = useState<organization[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getPartnerName() {
    setPartnerName(
      (await fetchAllPartnerName()).sort(en ? enSorter : frSorter)
    );
  }

  useEffect(() => {
    getPartnerName();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPartnerName((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getPartnerName();
  }

  return (
    <PartnerNameCtx.Provider value={{ partnername, refresh }}>
      {children}
    </PartnerNameCtx.Provider>
  );
};
