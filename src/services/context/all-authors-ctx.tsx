import type { product } from "@prisma/client";
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

export const AllAuthorsCtx = createContext<{
  productAllAuthors: product[];
  refresh: () => void;
}>(null as any);

async function fetchAllProductAllAuthor(): Promise<product[]> {
  try {
    const res = await fetch(ApiRoutes.allAuthors);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const AllAuthorsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [productAllAuthors, setProductAllAuthors] = useState<product[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getProductAllAuthors() {
    setProductAllAuthors(await fetchAllProductAllAuthor());
  }

  useEffect(() => {
    getProductAllAuthors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProductAllAuthors((prev) => [...prev]);
  }, [en]);

  function refresh() {
    getProductAllAuthors();
  }

  return (
    <AllAuthorsCtx.Provider value={{ productAllAuthors, refresh }}>
      {children}
    </AllAuthorsCtx.Provider>
  );
};
