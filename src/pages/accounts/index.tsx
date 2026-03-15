import type { NextPage } from "next/types";
import AllAccounts from "../../components/accounts/all-accounts";
import Authorizations from "../../components/auth-guard/authorizations";
import PageAuthGuard from "../../components/auth-guard/page-auth-guard";
import Layout from "../../components/layout/layout";
import { Table } from "antd";

const AccountsPage: NextPage = () => {
  return (
    <Layout>
      <PageAuthGuard
        auths={[Authorizations.admin]}
        loadingIcon={<Table loading={true}></Table>}
      >
        <AllAccounts />
      </PageAuthGuard>
    </Layout>
  );
};

export default AccountsPage;
