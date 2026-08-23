import type { NextPage } from "next/types";
import AllProducts from "../../../components/products/all-products";
import Layout from "../../../components/layout/layout";
import PageAuthGuard from "../../../components/auth-guard/page-auth-guard";
import Authorizations from "../../../components/auth-guard/authorizations";

const Product: NextPage = () => {
  return (
    <Layout>
      <PageAuthGuard auths={[Authorizations.member]}>
        <AllProducts />
      </PageAuthGuard>
    </Layout>
  );
};

export default Product;
