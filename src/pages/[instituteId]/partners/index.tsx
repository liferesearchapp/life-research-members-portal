import type { NextPage } from "next/types";
import AllPartners from "../../../components/partners/all-partners";
import Layout from "../../../components/layout/layout";
import Authorizations from "../../../components/auth-guard/authorizations";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";

const PartnersPage: NextPage = () => {
  return (
    <Layout>
      <PageAuthGuard auths={[Authorizations.registered]}>
        <AllPartners />
      </PageAuthGuard>
    </Layout>
  );
};

export default PartnersPage;
