import { useRouter } from "next/router";
import { useEffect } from "react";
import type { NextPage } from "next/types";
import CenteredSpinner from "../../../components/loading/centered-spinner";
import Layout from "../../../components/layout/layout";
import { instituteReport } from "../../../reporting/spec/institute-report";

/** /[institute]/reports -> the report's first page. */
const ReportsIndex: NextPage = () => {
  const router = useRouter();
  const urlIdentifier = router.query.instituteId as string | undefined;

  useEffect(() => {
    if (!urlIdentifier) return;
    router.replace(`/${urlIdentifier}/reports/${instituteReport.pages[0].id}`);
  }, [urlIdentifier, router]);

  return (
    <Layout>
      <CenteredSpinner />
    </Layout>
  );
};

export default ReportsIndex;
