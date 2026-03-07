import {
  createContext,
  type FC,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";
import ApiRoutes from "../../routing/api-routes";
import Notification from "../notifications/notification";
import type { MemberPublicInfo } from "../_types";

export const AllMembersCtx = createContext<{
  allMembers: MemberPublicInfo[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>(null as any);

export const AllMembersCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const [allMembers, setAllMembers] = useState<MemberPublicInfo[]>([]);
  const [loading, setLoading] = useState(true); // true so loading icons are served from server
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAllMembers() {
    try {
      const result = await fetch(ApiRoutes.allMembers);
      if (!result.ok) throw await result.text();
      let members: MemberPublicInfo[] = await result.json();

      members = members.filter((m) => m.is_active);
      members.sort((a, b) =>
        a.account.first_name.localeCompare(b.account.first_name)
      );
      setAllMembers(members);
    } catch (e: any) {
      new Notification().error(e);
    }
  }

  useEffect(() => {
    async function firstLoad() {
      await fetchAllMembers();
      setLoading(false);
    }
    firstLoad();
  }, []);

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
      value={{ allMembers, loading, refresh, refreshing }}
    >
      {children}
    </AllMembersCtx.Provider>
  );
};
