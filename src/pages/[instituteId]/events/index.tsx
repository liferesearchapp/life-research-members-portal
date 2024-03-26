import type { NextPage } from "next/types";
import AllEvents from "../../../components/events/all-events";
import Layout from "../../../components/layout/layout";
import Authorizations from "../../../components/auth-guard/authorizations";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";
import { Table } from "antd";

const EventsPage: NextPage = () => {
  return (
    <Layout>
      <PageAuthGuard auths={[Authorizations.admin]}>
        <AllEvents />
      </PageAuthGuard>
    </Layout>
  );
};

export default EventsPage;
