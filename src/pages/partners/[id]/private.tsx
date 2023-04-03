import { useRouter } from "next/router";
import type { NextPage } from "next/types";
import Authorizations from "../../../components/auth-guard/authorizations";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";
import CardSkeleton from "../../../components/loading/card-skeleton";
import PrivatePartnerProfile from "../../../components/partners/partner-private-profile";
import Layout from "../../../components/layout/layout";

const PrivatePartnerPage: NextPage = () => {
  const router = useRouter();
  const { id: idString } = router.query;
  if (!(typeof idString === "string")) return null;
  const id = parseInt(idString);
  return (
    <PageAuthGuard
      auths={[Authorizations.admin]}
      loadingIcon={<CardSkeleton />}
    >
      <Layout>
        <PrivatePartnerProfile id={id} />
      </Layout>
    </PageAuthGuard>
  );
};

export default PrivatePartnerPage;
