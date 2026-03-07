import type { MemberPublicInfo } from "../_types";
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

async function fetchAllMembers(): Promise<MemberPublicInfo[]> {
  try {
    const res = await fetch(ApiRoutes.allMembers);
    if (!res.ok) throw await res.text();
    return await res.json();
  } catch (e: any) {
    new Notification().error(e);
    return [];
  }
}

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
}>(null as any);

export const AllMembersSelectorCtxProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [members, setMembers] = useState<MemberPublicInfo[]>([]);
  const [memberMap, setMemberMap] = useState(
    new Map<number, MemberPublicInfo>()
  );
  const { en } = useContext(LanguageCtx);

  async function getMembers() {
    const members = await fetchAllMembers();
    setMembers(members.sort(en ? enSorter : frSorter));
    setMemberMap(new Map(members.map((m) => [m.id, m])));
  }

  useEffect(() => {
    getMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMembers((prev) => prev.sort(en ? enSorter : frSorter));
  }, [en]);

  function refresh() {
    getMembers();
  }

  function set(member: MemberPublicInfo) {
    setMembers((prev) => {
      const curr = prev.filter((m) => m.id !== member.id);
      curr.push(member);
      return curr.sort(en ? enSorter : frSorter);
    });
  }

  return (
    <AllMembersSelectorCtx.Provider
      value={{ members, memberMap, refresh, set }}
    >
      {children}
    </AllMembersSelectorCtx.Provider>
  );
};
