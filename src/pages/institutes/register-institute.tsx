import type { NextPage } from "next/types";
import Authorizations from "../../components/auth-guard/authorizations";
import PageAuthGuard from "../../components/auth-guard/page-auth-guard";
import Layout from "../../components/layout/layout";
import RegisterInstitute from "../../components/institutes/register-institute";

const Register: NextPage = () => {
  console.log("Registe Page Institue");
  return (
    <PageAuthGuard auths={[Authorizations.superAdmin]}>
      <Layout>
        <RegisterInstitute />
      </Layout>
    </PageAuthGuard>
  );
};

export default Register;
