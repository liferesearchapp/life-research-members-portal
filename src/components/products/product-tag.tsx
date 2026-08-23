// this component is a presentational component that displays a product in a tag format.

import CloseOutlined from "@ant-design/icons/lib/icons/CloseOutlined";
import EditOutlined from "@ant-design/icons/lib/icons/EditOutlined";
import type { product } from "@prisma/client";
import Tag from "antd/lib/tag";
import { CSSProperties, FC, useState } from "react";
import PageRoutes from "../../routing/page-routes";
import colorFromString from "../../utils/front-end/color-from-string";
import GetLanguage from "../../utils/front-end/get-product-language";
import GetProductLanguage from "../../utils/front-end/get-product-language";
import SafeLink from "../link/safe-link";
import { queryKeys } from "../products/all-products";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Props = {
  product: product;
  linked?: boolean;
  editable?: boolean;
  deletable?: boolean;
  onClick?: (p: product) => void;
  onDelete?: (id: number) => void;
  onEdit?: (product: product) => void;
  oppositeLanguage?: boolean;
  style?: CSSProperties;
};

const ProductTag: FC<Props> = ({
  product: p,
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

  const classList = ["product-tag"];
  if (linked || editable || onClick) classList.push("cursor-pointer");

  const text = oppositeLanguage ? (
    <GetProductLanguage obj={p} />
  ) : (
    <GetLanguage obj={p} />
  );
  const content = linked ? (
    <SafeLink
      href={{
        pathname: PageRoutes.allProducts(institute?.urlIdentifier || ""),
        //query: { [queryKeys.products]: p.id },
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
        color={colorFromString((p.title_en || "") + (p.title_fr || ""))}
        closable={deletable}
        onClose={() => onDelete(p.id)}
        closeIcon={closeIcon}
        icon={editable ? <EditOutlined /> : null}
        style={style}
      >
        {content}
      </Tag>
    </>
  );
};

export default ProductTag;
