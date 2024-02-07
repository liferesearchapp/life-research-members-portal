import { useRouter } from "next/router";
import type { NextPage } from "next/types";
import Authorizations from "../../../components/auth-guard/authorizations";
import PageAuthGuard from "../../../components/auth-guard/content-auth-guard";
import CardSkeleton from "../../../components/loading/card-skeleton";
import ReportPage from "../../../components/report/event-private-profile";
import Layout from "antd/lib/layout";

//import PrivateJoeProfile from "../../components/journey/report";

//import PrivateJoeProfile from "../../../components/journey/event-private-profile"; // changed here from event/event-private-profile
//import Layout from "../../../components/layout/layout";
// import PrivateJoePage from "../../joe/[id]";

const ReportPageEvent: NextPage = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();
  const { id: idString } = router.query;
  if (!(typeof idString === "string")) return null;
  const id = parseInt(idString);
  return (
    <PageAuthGuard
      auths={[Authorizations.admin]}
      loadingIcon={<CardSkeleton />}
    >
      <Layout>
        <ReportPage id={id} />
      </Layout>
    </PageAuthGuard>
  );
};

export default ReportPageEvent;
