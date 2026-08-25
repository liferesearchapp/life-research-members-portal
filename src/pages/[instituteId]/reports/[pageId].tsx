import type { NextPage } from "next/types";
import Authorizations from "../../../components/auth-guard/authorizations";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";
import Layout from "../../../components/layout/layout";
import ReportView from "../../../reporting/engine/report-view";
import { instituteReport } from "../../../reporting/spec/institute-report";

/**
 * The institute report.
 *
 * PageAuthGuard here is UX only -- it keeps non-admins from seeing a broken page. The real
 * gate is /api/reporting/[instituteId]/[pageId], which authorizes against the session before
 * running a single metric.
 */
const ReportPage: NextPage = () => (
  <Layout>
    <PageAuthGuard auths={[Authorizations.admin]}>
      <ReportView spec={instituteReport} />
    </PageAuthGuard>
  </Layout>
);

export default ReportPage;
