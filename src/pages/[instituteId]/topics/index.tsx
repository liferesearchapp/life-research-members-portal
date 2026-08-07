import type { NextPage } from "next";
import Authorizations from "../../../components/auth-guard/authorizations";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";
import Layout from "../../../components/layout/layout";
import InstituteTopicManager from "../../../components/topics/institute-topic-manager";

const InstituteTopicsPage: NextPage = () => (
  <PageAuthGuard auths={[Authorizations.admin]}>
    <Layout>
      <InstituteTopicManager />
    </Layout>
  </PageAuthGuard>
);

export default InstituteTopicsPage;
