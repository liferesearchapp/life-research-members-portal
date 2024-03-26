import type { MemberPublicInfo } from "../_types";
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
import { LanguageCtx } from "./language-ctx";
import { useSelectedInstitute } from "./selected-institute-ctx";
import getAuthHeader from "../headers/auth-header";

function enSorter(a: MemberPublicInfo, b: MemberPublicInfo): number {
  const aFullName = `${a.account.first_name} ${a.account.last_name}`;
  const bFullName = `${b.account.first_name} ${b.account.last_name}`;
  return aFullName.localeCompare(bFullName);
}

function frSorter(a: MemberPublicInfo, b: MemberPublicInfo): number {
  return enSorter(a, b); // Use the same sorting logic for French names
}

export const AllMembersSelectorCtx = createContext<{
  members: MemberPublicInfo[];
  memberMap: Map<number, MemberPublicInfo>;
  refresh: () => void;
  set: (member: MemberPublicInfo) => void;
  loading: boolean;
  refreshing: boolean;
}>(null as any);

export const AllMembersSelectorCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [members, setMembers] = useState<MemberPublicInfo[]>([]);
  const [memberMap, setMemberMap] = useState(
    new Map<number, MemberPublicInfo>()
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();

  const fetchAllMembers = useCallback(async () => {
    if (!institute) {
      console.log("Institute not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const queryParam = `?instituteId=${institute.urlIdentifier}`;
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const res = await fetch(`${ApiRoutes.allMembers}${queryParam}`, {
        headers: authHeader,
      });
      if (!res.ok) throw await res.text();
      const fetchedMembers: MemberPublicInfo[] = await res.json();

      console.log("Fetched members: ", fetchedMembers);

      setMembers(fetchedMembers.sort(en ? enSorter : frSorter));
      setMemberMap(new Map(fetchedMembers.map((m) => [m.id, m])));
    } catch (e: any) {
      new Notification().error(e.message);
    } finally {
      setLoading(false);
    }
  }, [en, institute]);

  useEffect(() => {
    async function firstLoad() {
      institute && (await fetchAllMembers());
      setLoading(false);
    }
    firstLoad();
  }, [fetchAllMembers, institute]);

  function refresh() {
    if (loading || refreshing) return;
    const notification = new Notification("bottom-right");
    setRefreshing(true);
    notification.loading("Refreshing...");
    fetchAllMembers().then(() => {
      setRefreshing(false);
      notification.close();
    });
  }

  function set(member: MemberPublicInfo) {
    setMembers((prev) => {
      const updatedMembers = prev.filter((m) => m.id !== member.id);
      updatedMembers.push(member);
      return updatedMembers.sort(en ? enSorter : frSorter);
    });
  }

  return (
    <AllMembersSelectorCtx.Provider
      value={{ members, memberMap, refresh, set, loading, refreshing }}
    >
      {children}
    </AllMembersSelectorCtx.Provider>
  );
};
