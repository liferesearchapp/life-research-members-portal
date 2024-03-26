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
import type { MemberPublicInfo } from "../_types";
import getAuthHeader from "../headers/auth-header";
import { useSelectedInstitute } from "./selected-institute-ctx";

export const AllMembersCtx = createContext<{
  allMembers: MemberPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

type AllMembersCtxProviderProps = PropsWithChildren<{ instituteId?: string }>;

export const AllMembersCtxProvider: FC<AllMembersCtxProviderProps> = ({
  children,
}) => {
  const [allMembers, setAllMembers] = useState<MemberPublicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { institute } = useSelectedInstitute();

  const fetchAllMembers = useCallback(async () => {
    if (!institute) {
      console.log("Institute not found.");
      setLoading(false);
      return;
    }

    try {
      const queryParam = `?instituteId=${institute?.urlIdentifier}`;
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const result = await fetch(`${ApiRoutes.allMembers}${queryParam}`, {
        headers: authHeader,
      });
      if (!result.ok) throw await result.text();
      const members: MemberPublicInfo[] = await result.json();

      setAllMembers(
        members
          .filter((m) => m.is_active)
          .sort((a, b) =>
            a.account.first_name.localeCompare(b.account.first_name)
          )
      );
    } catch (e: any) {
      new Notification().error(e.message);
    } finally {
      setLoading(false);
    }
  }, [institute]);

  useEffect(() => {
    async function firstLoad() {
      institute && (await fetchAllMembers());
      setLoading(false);
    }
    firstLoad();
  }, [fetchAllMembers, institute]);

  async function refresh() {
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    await fetchAllMembers();
    setRefreshing(false);
    notification.close();
  }

  return (
    <AllMembersCtx.Provider
      value={{
        allMembers,
        loading,
        refresh,
        refreshing,
      }}
    >
      {children}
    </AllMembersCtx.Provider>
  );
};
