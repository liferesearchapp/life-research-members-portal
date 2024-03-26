import type { NextPage } from "next/types";
import Layout from "../../components/layout/layout";
import Welcome from "../../components/welcome";
const InstituteHome: NextPage = () => {
  return (
    <Layout>
      <Welcome />
    </Layout>
  );
};

export default InstituteHome;
