import type { NextPage } from "next/types";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";
import Authorizations from "../../../components/auth-guard/authorizations";
import RegisterEvent from "../../../components/events/event-register";
import Layout from "../../../components/layout/layout";

const Register: NextPage = () => {
  return (
    <PageAuthGuard auths={[Authorizations.admin]}>
      <Layout>
        <RegisterEvent />
      </Layout>
    </PageAuthGuard>
  );
};

export default Register;
