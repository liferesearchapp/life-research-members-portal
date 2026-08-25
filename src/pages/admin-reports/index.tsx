import { useRouter } from "next/router";
import type { NextPage } from "next/types";
import { useEffect } from "react";
import CenteredSpinner from "../../components/loading/centered-spinner";
import Layout from "../../components/layout/layout";
import { adminReport } from "../../reporting/spec/admin-report";

/** /admin-reports -> the report's first page. */
const AdminReportsIndex: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin-reports/${adminReport.pages[0].id}`);
  }, [router]);

  return (
    <Layout>
      <CenteredSpinner />
    </Layout>
  );
};

export default AdminReportsIndex;
