import { useRouter } from "next/router";
import type { NextPage } from "next/types";
import { useContext, useEffect } from "react";
import { ActiveAccountCtx } from "../../../services/context/active-account-ctx";
import CardSkeleton from "../../../components/loading/card-skeleton";
import PageRoutes from "../../../routing/page-routes";

const PrivatejoePage: NextPage = () => {
  const router = useRouter();
  const { localAccount, loading } = useContext(ActiveAccountCtx);
  const { id: idString } = router.query;

  useEffect(() => {
    if (!(typeof idString === "string")) {
      return;
    }
    if (loading) return;

    const id = parseInt(idString);

    if (localAccount?.is_admin) {
      router.replace(PageRoutes.privateEventProfile(id));
      return;
    } else {
      router.replace(PageRoutes.publicEventProfile(id));
    }
  }, [localAccount, loading, idString, router]);

  return <CardSkeleton />;
};

export default PrivatejoePage;
