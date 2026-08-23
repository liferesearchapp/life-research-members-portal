import Table from "antd/lib/table";
import type { NextPage } from "next/types";
import Layout from "../../components/layout/layout";
import AllInstitutes from "../../components/institutes/all-institutes";
import InstituteManagementGuard from "../../components/auth-guard/institute-management-guard";
const InstitutesProfilePage: NextPage = () => {
  return (
    <Layout>
      <InstituteManagementGuard
        loadingIcon={<Table loading={true}></Table>}
      >
        <AllInstitutes />
      </InstituteManagementGuard>
    </Layout>
  );
};

export default InstitutesProfilePage;
