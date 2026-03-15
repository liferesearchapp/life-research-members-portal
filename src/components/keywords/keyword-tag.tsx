import type { keyword } from "@prisma/client";
import { type CSSProperties, type FC, useState } from "react";
import PageRoutes from "../../routing/page-routes";
import colorFromString from "../../utils/front-end/color-from-string";
import GetLanguage from "../../utils/front-end/get-language";
import GetOppositeLanguage from "../../utils/front-end/get-opposite-language";
import SafeLink from "../link/safe-link";
import { queryKeys } from "../members/all-members";
import EditKeywordModal from "./edit-keyword-modal";
import { Tag } from "antd";
import { CloseOutlined, EditOutlined } from "@ant-design/icons";

type Props = {
  keyword: keyword;
  linked?: boolean;
  editable?: boolean;
  deletable?: boolean;
  onClick?: (k: keyword) => void;
  onDelete?: (id: number) => void;
  onEdit?: (keyword: keyword) => void;
  oppositeLanguage?: boolean;
  style?: CSSProperties;
};

const KeywordTag: FC<Props> = ({
  keyword: k,
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

  const classList = ["keyword-tag"];
  if (linked || editable || onClick) classList.push("cursor-pointer");

  function onEditSuccess(keyword: keyword) {
    setModalOpen(false);
    onEdit(keyword);
  }

  const text = oppositeLanguage ? (
    <GetOppositeLanguage obj={k} />
  ) : (
    <GetLanguage obj={k} />
  );
  const content = linked ? (
    <SafeLink
      href={{
        pathname: PageRoutes.allMembers,
        query: { [queryKeys.keywords]: k.id },
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
        onClick={editable ? () => setModalOpen(true) : () => onClick?.(k)}
        closable={deletable}
        onClose={() => onDelete(k.id)}
        closeIcon={closeIcon}
        icon={editable ? <EditOutlined /> : null}
        style={style}
      >
        {content}
      </Tag>
      {editable ? (
        <EditKeywordModal
          open={modalOpen}
          keyword={k}
          onSuccess={onEditSuccess}
          onCancel={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
};

export default KeywordTag;
