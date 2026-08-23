/*
// GrantTag component is a presentational component that displays a grant in a tag format.
// The component can also trigger callbacks for clicking the tag, deleting the tag, and editing the tag.
// The component uses the colorFromString utility to determine the background color of the tag based on the grant title.
// The component uses the SafeLink component to make the tag linkable if specified.
*/


import CloseOutlined from "@ant-design/icons/lib/icons/CloseOutlined";
import EditOutlined from "@ant-design/icons/lib/icons/EditOutlined";
import type { grant } from "@prisma/client";
import Tag from "antd/lib/tag";
import type { CSSProperties, FC } from "react";
import PageRoutes from "../../routing/page-routes";
import colorFromString from "../../utils/front-end/color-from-string";
import GetLanguage from "../../utils/front-end/get-language";

import SafeLink from "../link/safe-link";
import { queryKeys } from "../grants/all-grants";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Props = {
  grant: grant;
  linked?: boolean;
  editable?: boolean;
  deletable?: boolean;
  onClick?: (g: grant) => void;
  onDelete?: (id: number) => void;
  onEdit?: (grant: grant) => void;
  oppositeLanguage?: boolean;
  style?: CSSProperties;
};

const GrantTag: FC<Props> = ({
  grant: g,
  linked = false,
  editable = false,
  deletable = false,
  onClick,
  onDelete = () => {},
  onEdit = () => {},
  oppositeLanguage = false,
  style,
}) => {
  const classList = ["grant-tag"];
  const { institute } = useSelectedInstitute();

  if (linked || editable || onClick) classList.push("cursor-pointer");

  //const text = <GetLanguage obj={g} />;
  const content = linked ? (
    <SafeLink
      href={{
        pathname:
          institute?.urlIdentifier &&
          PageRoutes.allGrants(institute?.urlIdentifier),
        //query: { [queryKeys.grants]: g.id },
      }}
    >
      {g.title}
    </SafeLink>
  ) : (
    g.title
  );

  const closeIcon = (
    <CloseOutlined
      // This is to stop dropdowns from toggling on close
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );

  return (
    <>
      <Tag
        className={classList.join(" ")}
        color={colorFromString(g.title)}
        closable={deletable}
        onClose={() => onDelete(g.id)}
        closeIcon={closeIcon}
        icon={editable ? <EditOutlined /> : null}
        style={style}
      >
        {content}
      </Tag>
    </>
  );
};

export default GrantTag;
