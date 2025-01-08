import { useRouter } from "next/router";
import type { NextPage } from "next/types";
import InstituteProfile from "../../components/institutes/institute-profile";
import Authorizations from "../../components/auth-guard/authorizations";
import PageAuthGuard from "../../components/auth-guard/page-auth-guard";
import CardSkeleton from "../../components/loading/card-skeleton";

const InstituteProfilePage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  if (!(typeof id === "string")) return null;
  return (
    <PageAuthGuard
      auths={[Authorizations.superAdmin]}
      loadingIcon={<CardSkeleton />}
    >
      <InstituteProfile id={parseInt(id)} />
    </PageAuthGuard>
  );
};

export default InstituteProfilePage;
