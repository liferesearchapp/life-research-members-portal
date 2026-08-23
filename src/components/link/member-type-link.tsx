import type { member_type } from "@prisma/client";
import type { FC } from "react";
import PageRoutes from "../../routing/page-routes";
import GetLanguage from "../../utils/front-end/get-language";
import { queryKeys } from "../members/all-members";
import SafeLink from "./safe-link";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Props = {
  member_type: member_type | null;
};

const MemberTypeLink: FC<Props> = ({ member_type }) => {
  const { institute } = useSelectedInstitute();
  if (!member_type) return null;
  return (
    <SafeLink
      href={{
        pathname: PageRoutes.allMembers(institute?.urlIdentifier || ""),
        query: {
          [queryKeys.memberTypes]: member_type.id,
          [queryKeys.showMemberType]: true,
        },
      }}
    >
      <GetLanguage obj={member_type} />
    </SafeLink>
  );
};

export default MemberTypeLink;
