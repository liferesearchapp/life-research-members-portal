import type { org_scope } from "@prisma/client";
import type { FC } from "react";
import PageRoutes from "../../routing/page-routes";
import GetLanguage from "../../utils/front-end/get-language";
import { queryKeys } from "../partners/all-partners";
import SafeLink from "./safe-link";

type Props = {
  org_scope: org_scope | null;
};

const PartnerScopeLink: FC<Props> = ({ org_scope }) => {
  if (!org_scope) return null;
  return (
    <SafeLink
      href={{
        pathname: PageRoutes.allPartners("lri"),
        query: {
          [queryKeys.partnerScope]: org_scope.id,
          [queryKeys.showScope]: true,
        },
      }}
    >
      <GetLanguage obj={org_scope} />
    </SafeLink>
  );
};

export default PartnerScopeLink;
