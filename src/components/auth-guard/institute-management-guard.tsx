import { type FC, type PropsWithChildren, ReactElement, useContext } from "react";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import CenteredSpinner from "../loading/centered-spinner";

type Props = {
  instituteId?: number;
  loadingIcon?: ReactElement;
};

const InstituteManagementGuard: FC<PropsWithChildren<Props>> = ({
  instituteId,
  loadingIcon,
  children,
}) => {
  const { localAccount, loading } = useContext(ActiveAccountCtx);
  const { en } = useContext(LanguageCtx);

  if (loading) return loadingIcon || <CenteredSpinner />;
  if (!localAccount) {
    return (
      <h1 style={{ textAlign: "center" }}>
        {en
          ? "You are not authorized to view this page."
          : "Vous n'êtes pas autorisé à afficher cette page."}
      </h1>
    );
  }

  const isSuperAdmin = !!localAccount.is_super_admin;
  const isInstituteAdmin =
    instituteId === undefined
      ? localAccount.instituteAdmin.length > 0
      : localAccount.instituteAdmin.some(
          (admin) => admin.instituteId === instituteId
        );
  const isInstituteMember =
    instituteId === undefined
      ? (localAccount.member?.institutes.length || 0) > 0
      : (localAccount.member?.institutes.some(
          (member) => member.instituteId === instituteId
        ) ?? false);

  if (!isSuperAdmin && !isInstituteAdmin && !isInstituteMember) {
    return (
      <h1 style={{ textAlign: "center" }}>
        {en
          ? "You are not authorized to view this page."
          : "Vous n'êtes pas autorisé à afficher cette page."}
      </h1>
    );
  }

  return <>{children}</>;
};

export default InstituteManagementGuard;
