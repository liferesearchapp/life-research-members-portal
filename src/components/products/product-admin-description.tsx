// This is a functional component that displays the private information of a product.
// The component uses the LanguageCtx context to determine the language to display.

import { type FC, useContext } from "react";
import type { ProductPrivateInfo } from "../../services/_types";
import React from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import { Tag, Grid, Descriptions } from "antd";
const Item = Descriptions.Item;

const { useBreakpoint } = Grid;

type Props = {
  product: ProductPrivateInfo;
};

const ProductAdminDescription: FC<Props> = ({ product }) => {
  const screens = useBreakpoint();
  const { en } = useContext(LanguageCtx);

  return (
    <Descriptions
      size="small"
      bordered
      column={1}
      styles={{
        label: { whiteSpace: "break-spaces", width: "8rem" },
        content: { whiteSpace: "break-spaces" },
      }}
      layout={screens.xs ? "vertical" : "horizontal"}
    >
      <Item label={en ? "Product Topic" : "Sujet du produit"}>
        {product.product_topic.map((entry, i) => (
          <Tag key={i} color="blue">
            {en ? entry.topic.name_fr : entry.topic.name_en}
          </Tag>
        ))}
      </Item>
    </Descriptions>
  );
};

export default ProductAdminDescription;
