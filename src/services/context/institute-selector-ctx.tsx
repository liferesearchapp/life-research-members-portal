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
import getAuthHeader from "../headers/auth-header";
import Notification from "../notifications/notification";
import type { InstituteSelectorInfo } from "../_types";
import { ActiveAccountCtx } from "./active-account-ctx";
  
export const InstituteSelectorCtx = createContext<{
    instituteSelection: InstituteSelectorInfo[];
    loading: boolean;
    refreshing: boolean;
    refresh: () => void;
}>(null as any);
  
export const InstituteSelectorCtxProvider: FC<PropsWithChildren> = ({ children }) => {
    const { localAccount, loading: accountLoading } = useContext(ActiveAccountCtx);
    const [instituteSelection, setInstitutes] = useState<InstituteSelectorInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
  
    const fetchInstitutes = useCallback(async () => {
      try {
        const authHeader = localAccount ? await getAuthHeader() : null;
        const result = await fetch(ApiRoutes.instituteSelector, authHeader ? {
          headers: authHeader,
        } : undefined);
        if (!result.ok) throw await result.text();
        const instituteSelection: InstituteSelectorInfo[] = await result.json();
        setInstitutes(instituteSelection.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (e: any) {
        new Notification().error(e.message);
      } finally {
        setLoading(false);
      }
    }, [localAccount]);
  
    useEffect(() => {
      if (accountLoading) return;
      async function firstLoad() {
        await fetchInstitutes();
        setLoading(false);
      }
      firstLoad();
    }, [accountLoading, fetchInstitutes]);
  
    async function refresh() {
      if (loading || refreshing) return;
      const notification = new Notification("bottom-right");
      setRefreshing(true);
      notification.loading("Refreshing...");
      await fetchInstitutes();
      setRefreshing(false);
      notification.close();
    }
  
    return (
      <InstituteSelectorCtx.Provider
        value={{
          instituteSelection,
          loading,
          refresh,
          refreshing,
        }}
      >
        {children}
      </InstituteSelectorCtx.Provider>
    );
  };
  
