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

async function fetchAllProducts(): Promise<product[]> {
  try {
    const res = await fetch(ApiRoutes.allProducts);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

function enSorter(a: product, b: product): number {
  return (a.title_en || a.title_fr || "").localeCompare(
    b.title_en || b.title_fr || ""
  );
}

function frSorter(a: product, b: product): number {
  return (a.title_fr || a.title_en || "").localeCompare(
    b.title_fr || b.title_en || ""
  );
}

export const ProductsCtx = createContext<{
  products: product[];
  productMap: Map<number, product>;
  refresh: () => void;
  set: (product: product) => void;
}>(null as any);

export const ProductsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [products, setProducts] = useState<product[]>([]);
  const [productMap, setProductMap] = useState(new Map<number, product>());
  const { en } = useContext(LanguageCtx);

  async function getProducts() {
    const products = await fetchAllProducts();
    setProducts(products.sort(en ? enSorter : frSorter));
    setProductMap(new Map(products.map((p) => [p.id, p])));
  }

  useEffect(() => {
    getProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProducts((prev) => prev.sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getProducts();
  }

  function set(prod: product) {
    setProducts((prev) => {
      const curr = prev.filter((p) => p.id !== prod.id);
      curr.push(prod);
      return curr.sort(en ? enSorter : frSorter);
    });
  }

  return (
    <ProductsCtx.Provider value={{ products, productMap, refresh, set }}>
      {children}
    </ProductsCtx.Provider>
  );
};
