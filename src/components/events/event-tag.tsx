// This component is a presentational component that displays an event in a tag format.

import CloseOutlined from "@ant-design/icons/lib/icons/CloseOutlined";
import EditOutlined from "@ant-design/icons/lib/icons/EditOutlined";
import type { event } from "@prisma/client";
import Tag from "antd/lib/tag";
import { CSSProperties, FC, useState } from "react";
import PageRoutes from "../../routing/page-routes";
import colorFromString from "../../utils/front-end/color-from-string";
import GetLanguage from "../../utils/front-end/get-language";
import GetOppositeLanguage from "../../utils/front-end/get-opposite-language";
import SafeLink from "../link/safe-link";
import { queryKeys } from "../events/all-events";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Props = {
  event: event;
  linked?: boolean;
  editable?: boolean;
  deletable?: boolean;
  onClick?: (k: event) => void;
  onDelete?: (id: number) => void;
  onEdit?: (event: event) => void;
  oppositeLanguage?: boolean;
  style?: CSSProperties;
};

const EventTag: FC<Props> = ({
  event: k,
  linked = false,
  editable = false,
  deletable = false,
  onClick,
  onDelete = () => {},
  onEdit = () => {},
  oppositeLanguage = false,
  style,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const { institute } = useSelectedInstitute();

  const classList = ["event-tag"];
  if (linked || editable || onClick) classList.push("cursor-pointer");

  const text = oppositeLanguage ? (
    <GetOppositeLanguage obj={k} />
  ) : (
    <GetLanguage obj={k} />
  );
  const content =
    linked && institute?.urlIdentifier ? (
      <SafeLink
        href={{
          pathname: PageRoutes.allEvents(institute?.urlIdentifier),
          // query: { [queryKeys.events]: k.id },
        }}
      >
        {text}
      </SafeLink>
    ) : (
      text
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
        color={colorFromString((k.name_en || "") + (k.name_fr || ""))}
        closable={deletable}
        onClose={() => onDelete(k.id)}
        closeIcon={closeIcon}
        icon={editable ? <EditOutlined /> : null}
        style={style}
      >
        {content}
      </Tag>
    </>
  );
};

export default EventTag;
