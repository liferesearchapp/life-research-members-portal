import type { NextPage } from "next/types";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";
import Authorizations from "../../../components/auth-guard/authorizations";
import RegisterProduct from "../../../components/products/product-register";
import Layout from "../../../components/layout/layout";

const Register: NextPage = () => {
  return (
    <PageAuthGuard auths={[Authorizations.member]}>
      <Layout>
        <RegisterProduct />
      </Layout>
    </PageAuthGuard>
  );
};

export default Register;
