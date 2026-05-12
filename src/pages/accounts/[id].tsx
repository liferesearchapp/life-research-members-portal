import { useRouter } from "next/router";
import type { NextPage } from "next/types";
import AccountProfile from "../../components/accounts/account-profile";
import Authorizations from "../../components/auth-guard/authorizations";
import PageAuthGuard from "../../components/auth-guard/page-auth-guard";
import CardSkeleton from "../../components/loading/card-skeleton";

const AccountProfilePage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  if (!(typeof id === "string")) return null;
  return (
    <PageAuthGuard
      auths={[Authorizations.admin, Authorizations.superAdmin]}
      loadingIcon={<CardSkeleton />}
    >
      <AccountProfile id={parseInt(id)} />
    </PageAuthGuard>
  );
};

export default AccountProfilePage;
