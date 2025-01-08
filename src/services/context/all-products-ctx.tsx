import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import type { ProductPublicInfo } from "../_types";
import getAuthHeader from "../headers/auth-header";
import { useSelectedInstitute } from "./selected-institute-ctx";

export const AllProductsCtx = createContext<{
  allProducts: ProductPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllProductsCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [allProducts, setAllProducts] = useState<ProductPublicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { institute } = useSelectedInstitute();

  const fetchAllProducts = useCallback(async () => {
    if (!institute) {
      console.log("Institute not found.");
      setLoading(false);
      return;
    }

    try {
      const queryParam = `?instituteId=${institute?.urlIdentifier}`;
      //const authHeader = await getAuthHeader();
      //if (!authHeader) return;
      //const result = await fetch(`${ApiRoutes.allProducts}${queryParam}`, {
      //  headers: authHeader,
      //});
      const result = await fetch(`${ApiRoutes.allProducts}${queryParam}`);
      if (!result.ok) throw await result.text();
      let products: ProductPublicInfo[] = await result.json();

      setAllProducts(products);
    } catch (e: any) {
      new Notification().error(e.message);
    } finally {
      setLoading(false);
    }
  }, [institute]);

  useEffect(() => {
    async function firstLoad() {
      institute && (await fetchAllProducts());
      setLoading(false);
    }
    firstLoad();
  }, [fetchAllProducts, institute]);

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
      value={{ allProducts, loading, refreshing, refresh }}
    >
      {children}
    </AllProductsCtx.Provider>
  );
};
