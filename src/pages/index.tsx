import Spin from "antd/lib/spin";
import type { NextPage } from "next/types";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Layout from "../components/layout/layout";
import PageRoutes from "../routing/page-routes";
import { useSelectedInstitute } from "../services/context/selected-institute-ctx";

const HomePage: NextPage = () => {
  const router = useRouter();
  const { institute } = useSelectedInstitute();

  useEffect(() => {
    if (!institute?.urlIdentifier) return;

    const nextPath = PageRoutes.instituteHome(institute.urlIdentifier);
    if (router.asPath !== nextPath) {
      router.replace(nextPath);
    }
  }, [institute?.urlIdentifier, router]);

  return (
    <Layout>
      <div
        style={{
          minHeight: "40vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    </Layout>
  );
};

export default HomePage;
