import type { NextPage } from "next/types";
import AllGrants from "../../../components/grants/all-grants";
import Layout from "../../../components/layout/layout";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";
import Authorizations from "../../../components/auth-guard/authorizations";
import { Table } from "antd";

const GrantsPage: NextPage = () => {
  return (
    <Layout>
      <PageAuthGuard auths={[Authorizations.admin]}>
        <AllGrants />
      </PageAuthGuard>
    </Layout>
  );
};

export default GrantsPage;
