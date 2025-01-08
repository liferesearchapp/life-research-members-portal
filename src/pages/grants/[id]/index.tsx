import { useRouter } from "next/router";
import type { NextPage } from "next/types";
import { useContext, useEffect } from "react";
import { ActiveAccountCtx } from "../../../services/context/active-account-ctx";
import CardSkeleton from "../../../components/loading/card-skeleton";
import PageRoutes from "../../../routing/page-routes";
import { useAdminDetails } from "../../../services/context/selected-institute-ctx";

const PrivateGrantPage: NextPage = () => {
  const router = useRouter();
  const { localAccount, loading } = useContext(ActiveAccountCtx);
  const isAdmin = useAdminDetails();
  const { id: idString } = router.query;

  useEffect(() => {
    if (!(typeof idString === "string")) {
      return;
    }
    if (loading) return;

    const id = parseInt(idString);

    if (isAdmin) {
      router.replace(PageRoutes.privateGrantProfile(id));
      return;
    }

    router.replace(PageRoutes.publicGrantProfile(id));
  }, [localAccount, loading, idString, router, isAdmin]);

  return <CardSkeleton />;
};

export default PrivateGrantPage;
