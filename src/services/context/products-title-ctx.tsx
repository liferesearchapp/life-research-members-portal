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

function enSorter(a: product, b: product) {
  return a.title_en.localeCompare(b.title_en);
}

function frSorter(a: product, b: product) {
  return a.title_fr.localeCompare(b.title_fr);
}

export const ProductTitlesCtx = createContext<{
  productTitles: product[];
  refresh: () => void;
}>(null as any);

async function fetchAllProductTitle(): Promise<product[]> {
  try {
    const res = await fetch(ApiRoutes.allProductTitles);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const ProductTitlesCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [productTitles, setProductTitles] = useState<product[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getProductTitles() {
    setProductTitles(
      (await fetchAllProductTitle()).sort(en ? enSorter : frSorter)
    );
  }

  useEffect(() => {
    getProductTitles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProductTitles((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getProductTitles();
  }

  return (
    <ProductTitlesCtx.Provider value={{ productTitles, refresh }}>
      {children}
    </ProductTitlesCtx.Provider>
  );
};
