import { useRouter } from "next/router";
import type { NextPage } from "next/types";
import PublicEventProfile from "../../../components/events/event-public-profile";
import Layout from "../../../components/layout/layout";

const PublicEventPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  if (!(typeof id === "string")) return null;
  return (
    <Layout>
      <PublicEventProfile id={parseInt(id)} />
    </Layout>
  );
};

export default PublicEventPage;
