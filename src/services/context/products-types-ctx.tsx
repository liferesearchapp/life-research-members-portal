import type { product_type } from "@prisma/client";
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

function enSorter(a: product_type, b: product_type) {
  return a.name_en.localeCompare(b.name_en);
}

function frSorter(a: product_type, b: product_type) {
  return a.name_fr.localeCompare(b.name_fr);
}

export const ProductTypesCtx = createContext<{
  productTypes: product_type[];
  refresh: () => void;
}>(null as any);

async function fetchAllProductTypes(): Promise<product_type[]> {
  try {
    const res = await fetch(ApiRoutes.allProductTypes);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

export const ProductTypesCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [productTypes, setProductTypes] = useState<product_type[]>([]);
  const { en } = useContext(LanguageCtx);

  async function getProductTypes() {
    setProductTypes(
      (await fetchAllProductTypes()).sort(en ? enSorter : frSorter)
    );
  }

  useEffect(() => {
    getProductTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProductTypes((prev) => [...prev].sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getProductTypes();
  }

  return (
    <ProductTypesCtx.Provider value={{ productTypes, refresh }}>
      {children}
    </ProductTypesCtx.Provider>
  );
};
