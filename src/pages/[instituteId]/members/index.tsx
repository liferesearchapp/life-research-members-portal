import type { NextPage } from "next/types";

import Layout from "../../../components/layout/layout";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";
import Authorizations from "../../../components/auth-guard/authorizations";
import AllMembers from "../../../components/members/all-members";
import { useRouter } from "next/router";

const MembersPage: NextPage = () => {
  const router = useRouter();
  return (
    <Layout>
      <PageAuthGuard auths={[Authorizations.registered]}>
        <AllMembers />
      </PageAuthGuard>
    </Layout>
  );
};

export default MembersPage;
