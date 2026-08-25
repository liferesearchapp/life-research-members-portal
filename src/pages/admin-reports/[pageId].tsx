import type { NextPage } from "next/types";
import Authorizations from "../../components/auth-guard/authorizations";
import PageAuthGuard from "../../components/auth-guard/page-auth-guard";
import Layout from "../../components/layout/layout";
import ReportView from "../../reporting/engine/report-view";
import { adminReport } from "../../reporting/spec/admin-report";

/**
 * The RIMS administrator report.
 *
 * PageAuthGuard here is UX only. The real gate is /api/reporting/admin/[pageId], which requires
 * account.is_super_admin server-side before running a single metric.
 */
const AdminReportPage: NextPage = () => (
  <Layout>
    <PageAuthGuard auths={[Authorizations.superAdmin]}>
      <ReportView spec={adminReport} />
    </PageAuthGuard>
  </Layout>
);

export default AdminReportPage;
