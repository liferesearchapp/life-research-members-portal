import { type FC, type PropsWithChildren, ReactElement, useContext } from "react";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import CenteredSpinner from "../loading/centered-spinner";
import Authorizations from "./authorizations";
import { useAdminDetails, useMemberDetails } from "../../services/context/selected-institute-ctx";
//import { auth } from "googleapis/build/src/apis/abusiveexperiencereport";

type Props = {
  auths: Authorizations[];
  id?: number;
  loadingIcon?: ReactElement;
};

const PageAuthGuard: FC<PropsWithChildren<Props>> = ({
  auths,
  id,
  loadingIcon,
  children,
}) => {
  const { localAccount, loading } = useContext(ActiveAccountCtx);
  const isAdmin = useAdminDetails();
  const isMember = useMemberDetails();
  const { en } = useContext(LanguageCtx);

  if (loading) return loadingIcon || <CenteredSpinner />;

  const notAuthorized = (
    <h1 style={{ textAlign: "center" }}>
      {en
        ? "You are not authorized to view this page."
        : "Vous n'êtes pas autorisé à afficher cette page."}
    </h1>
  );

  const c = <>{children}</>;

  console.log(isAdmin);

  if (!localAccount) return notAuthorized;
  if (auths.includes(Authorizations.registered)) return c;
  if (auths.includes(Authorizations.member) && isMember) return c;
  if (auths.includes(Authorizations.admin) && isAdmin) return c;
  if (auths.includes(Authorizations.superAdmin) && localAccount.is_super_admin)
    return c;
  if (auths.includes(Authorizations.matchAccountId) && localAccount.id === id)
    return c;
  if (!localAccount.member) return notAuthorized;
  if (
    auths.includes(Authorizations.matchMemberId) &&
    localAccount.member.id === id
  )
    return c;
  return notAuthorized;
};

export default PageAuthGuard;
