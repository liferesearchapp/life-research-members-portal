import type { NextPage } from "next/types";
import AllSupervisions from "../../../components/supervisions/all-supervisions";
import Layout from "../../../components/layout/layout";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";
import Authorizations from "../../../components/auth-guard/authorizations";

const SupervisionsPage: NextPage = () => {
  return (
    <Layout>
      <PageAuthGuard auths={[Authorizations.admin]}>
        <AllSupervisions />;
      </PageAuthGuard>
    </Layout>
  );
};

export default SupervisionsPage;
