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
import type { MemberInstitutesInfo } from "../_types";
import getAuthHeader from "../headers/auth-header";
import { ActiveAccountCtx } from "./active-account-ctx";

export const MemberInstituteCtx = createContext<{
  institutes: MemberInstitutesInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

type MemberInstituteCtxProviderProps = PropsWithChildren<{ memberId?: string }>;

export const MemberInstituteCtxProvider: FC<
  MemberInstituteCtxProviderProps
> = ({ children }) => {
  const [institutes, setInstitutes] = useState<MemberInstitutesInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { localAccount } = useContext(ActiveAccountCtx);

  const fetchMemberInstitutes = useCallback(async () => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const result = await fetch(`${ApiRoutes.memberInstitute}`, {
        headers: authHeader,
      });
      if (!result.ok) throw await result.text();
      const institutes: MemberInstitutesInfo[] = await result.json();

      setInstitutes(institutes.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e: any) {
      new Notification().error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function firstLoad() {
      await fetchMemberInstitutes();
      setLoading(false);
    }
    firstLoad();
  }, [fetchMemberInstitutes, localAccount]);

  async function refresh() {
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    await fetchMemberInstitutes();
    setRefreshing(false);
    notification.close();
  }

  return (
    <MemberInstituteCtx.Provider
      value={{
        institutes,
        loading,
        refresh,
        refreshing,
      }}
    >
      {children}
    </MemberInstituteCtx.Provider>
  );
};
