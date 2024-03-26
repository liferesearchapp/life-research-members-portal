import type { org_type } from "@prisma/client";
import type { FC } from "react";
import PageRoutes from "../../routing/page-routes";
import GetLanguage from "../../utils/front-end/get-language";
import { queryKeys } from "../partners/all-partners";
import SafeLink from "./safe-link";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Props = {
  org_type: org_type | null;
};

const PartnerTypeLink: FC<Props> = ({ org_type }) => {
  const { institute } = useSelectedInstitute();
  if (!org_type) return null;
  return (
    <SafeLink
      href={{
        pathname: PageRoutes.allPartners(institute?.urlIdentifier || ""),
        query: {
          [queryKeys.partnerType]: org_type.id,
          [queryKeys.showType]: true,
        },
      }}
    >
      <GetLanguage obj={org_type} />
    </SafeLink>
  );
};

export default PartnerTypeLink;
