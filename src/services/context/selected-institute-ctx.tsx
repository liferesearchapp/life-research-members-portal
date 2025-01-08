import React, {
  createContext,
  useState,
  useContext,
  FC,
  PropsWithChildren,
  useEffect,
} from "react";
import type { MemberInstitutesRes } from "../../pages/api/member-institute";
import { ActiveAccountCtx } from "./active-account-ctx";

interface SelectedInstituteContextType {
  institute: MemberInstitutesRes | null;
  setInstitute: (institute: MemberInstitutesRes | null) => void;
}
const SelectedInstituteCtx = createContext<SelectedInstituteContextType>({
  institute: null,
  setInstitute: () => {},
});

export const SelectedInstituteCtxProvider: FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [institute, setInstitute] = useState<MemberInstitutesRes | null>(null);

  return (
    <SelectedInstituteCtx.Provider value={{ institute, setInstitute }}>
      {children}
    </SelectedInstituteCtx.Provider>
  );
};

// Custom hook for accessing the selected institute
export const useSelectedInstitute = () => {
  const context = useContext(SelectedInstituteCtx);
  if (context === undefined) {
    throw new Error(
      "useSelectedInstitute must be used within a SelectedInstituteCtxProvider"
    );
  }
  return context;
};

export const useMemberDetails = () => {
  const { institute } = useContext(SelectedInstituteCtx);
  const { localAccount } = useContext(ActiveAccountCtx);
  const isMember = localAccount?.member?.institutes.some(
    (member) => member.instituteId === institute?.id
  );
  return isMember;
};

export const useAdminDetails = () => {
  const { institute } = useContext(SelectedInstituteCtx);
  const { localAccount } = useContext(ActiveAccountCtx);
  const isAdmin = localAccount?.instituteAdmin.some(
    (admin) => admin.instituteId === institute?.id
  );
  return isAdmin;
};

export const useSuperAdminDetails = () => {
  const { localAccount } = useContext(ActiveAccountCtx);
  return localAccount?.is_super_admin;
};


