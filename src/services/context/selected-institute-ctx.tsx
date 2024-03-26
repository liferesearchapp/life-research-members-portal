import React, {
  createContext,
  useState,
  useContext,
  FC,
  PropsWithChildren,
  useEffect,
} from "react";
import type { MemberInstitutesRes } from "../../pages/api/member-institute";

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

  useEffect(() => {
    console.log(institute, "checking in selected institute context");
  }, [institute]);

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
