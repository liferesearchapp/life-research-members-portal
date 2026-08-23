import { useRouter } from "next/router";
import type { NextPage } from "next/types";
import InstituteProfile from "../../components/institutes/institute-profile";
import CardSkeleton from "../../components/loading/card-skeleton";
import InstituteManagementGuard from "../../components/auth-guard/institute-management-guard";

const InstituteProfilePage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  if (!(typeof id === "string")) return null;
  return (
    <InstituteManagementGuard
      instituteId={parseInt(id)}
      loadingIcon={<CardSkeleton />}
    >
      <InstituteProfile id={parseInt(id)} />
    </InstituteManagementGuard>
  );
};

export default InstituteProfilePage;
