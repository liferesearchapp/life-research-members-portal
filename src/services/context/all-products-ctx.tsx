import {
  createContext,
  type FC,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import type { ProductPublicInfo } from "../_types";

export const AllProductsCtx = createContext<{
  allProducts: ProductPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllProductsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [allProducts, setAllProducts] = useState<ProductPublicInfo[]>([]);
  const [loading, setLoading] = useState(true); // true so loading icons are served from server
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAllProducts() {
    try {
      const result = await fetch(ApiRoutes.allProducts);
      if (!result.ok) throw await result.text();
      let products: ProductPublicInfo[] = await result.json();

      setAllProducts(products);
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  useEffect(() => {
    async function firstLoad() {
      await fetchAllProducts();
      setLoading(false);
    }
    firstLoad();
  }, []);

  async function refresh() {
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    await fetchAllProducts();
    setRefreshing(false);
    notification.close();
  }

  return (
    <AllProductsCtx.Provider
      value={{ allProducts, loading, refresh, refreshing }}
    >
      {children}
    </AllProductsCtx.Provider>
  );
};
