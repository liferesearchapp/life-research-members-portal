import type { faculty } from "@prisma/client";
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

function enSorter(a: faculty, b: faculty) {
  return a.name_en.localeCompare(b.name_en);
}

function frSorter(a: faculty, b: faculty) {
  return a.name_fr.localeCompare(b.name_fr);
}

export const FacultiesCtx = createContext<{
  faculties: faculty[];
  refresh: () => void;
}>(null as any);

async function fetchAllFaculties(): Promise<faculty[]> {
  try {
    const res = await fetch(ApiRoutes.allFaculties);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const FacultiesCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [faculties, setFaculties] = useState<faculty[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getFaculties() {
    setFaculties((await fetchAllFaculties()).sort(en ? enSorter : frSorter));
  }

  useEffect(() => {
    getFaculties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFaculties((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getFaculties();
  }

  return (
    <FacultiesCtx.Provider value={{ faculties, refresh }}>
      {children}
    </FacultiesCtx.Provider>
  );
};
