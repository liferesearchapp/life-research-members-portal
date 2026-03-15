import CloseOutlined from "@ant-design/icons/lib/icons/CloseOutlined";
import EditOutlined from "@ant-design/icons/lib/icons/EditOutlined";
import type { target } from "@prisma/client";
import Tag from "antd/lib/tag";
import { CSSProperties, FC, useState } from "react";
import PageRoutes from "../../routing/page-routes";
import colorFromString from "../../utils/front-end/color-from-string";
import GetLanguage from "../../utils/front-end/get-language";
import GetOppositeLanguage from "../../utils/front-end/get-opposite-language";
import SafeLink from "../link/safe-link";
import { queryKeys } from "../products/all-products";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Props = {
  target: target;
  linked?: boolean;
  editable?: boolean;
  deletable?: boolean;
  onClick?: (k: target) => void;
  onDelete?: (id: number) => void;
  onEdit?: (target: target) => void;
  oppositeLanguage?: boolean;
  style?: CSSProperties;
};

const TargetTag: FC<Props> = ({
  target: k,
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

  const classList = ["keyword-tag"];
  if (linked || editable || onClick) classList.push("cursor-pointer");

  const text = oppositeLanguage ? (
    <GetOppositeLanguage obj={k} />
  ) : (
    <GetLanguage obj={k} />
  );
  const content = linked ? (
    <SafeLink
      href={{
        pathname: PageRoutes.allProducts(institute?.urlIdentifier || ""),
        query: { [queryKeys.targets]: k.id },
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

export default TargetTag;
