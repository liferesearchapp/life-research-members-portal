import type { faculty } from "@prisma/client";
import type { FC } from "react";
import PageRoutes from "../../routing/page-routes";
import GetLanguage from "../../utils/front-end/get-language";
import { queryKeys } from "../members/all-members";
import SafeLink from "./safe-link";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Props = {
  faculty: faculty | null;
};

const FacultyLink: FC<Props> = ({ faculty }) => {
  const { institute } = useSelectedInstitute();
  if (!faculty) return null;

  return (
    <SafeLink
      href={{
        pathname: PageRoutes.allMembers(institute?.urlIdentifier || ""),
        query: {
          [queryKeys.faculties]: faculty.id,
          [queryKeys.showFaculty]: true,
        },
      }}
    >
      <GetLanguage obj={faculty} />
    </SafeLink>
  );
};

export default FacultyLink;
