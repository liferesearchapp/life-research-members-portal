import Table from "antd/lib/table";
import type { NextPage } from "next/types";
import Layout from "../../components/layout/layout";
import PageAuthGuard from "../../components/auth-guard/page-auth-guard";
import Authorizations from "../../components/auth-guard/authorizations";
import AllInstitutes from "../../components/institutes/all-institutes";
const InstitutesProfilePage: NextPage = () => {
  return (
    <Layout>
      <PageAuthGuard
        auths={[Authorizations.superAdmin]}
        loadingIcon={<Table loading={true}></Table>}
      >
        <AllInstitutes />
      </PageAuthGuard>
    </Layout>
  );
};

export default InstitutesProfilePage;
