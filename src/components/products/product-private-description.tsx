/*
  This component displays private information about a product.
  It uses the Descriptions component from the Ant Design library to present information in a clear and organized manner.
  The component also uses the LanguageCtx context to determine the language to display the information in.
*/


import { FC, useContext } from "react";
import type { ProductPrivateInfo } from "../../services/_types";
import React from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import { Grid, Descriptions } from "antd";
const Item = Descriptions.Item;

const { useBreakpoint } = Grid;

type Props = {
  product: ProductPrivateInfo;
};

const PrivateProductDescription: FC<Props> = ({ product }) => {
  const screens = useBreakpoint();
  const { en } = useContext(LanguageCtx);

  return (
    <Descriptions
      size="small"
      bordered
      column={1}
      labelStyle={{ whiteSpace: "nowrap", width: 0 }}
      layout={screens.xs ? "vertical" : "horizontal"}
    >
      <Item label={en ? "Peer reviewed" : "Évalué par les pairs"}>
        {product.peer_reviewed ? (en ? "Yes" : "Oui") : en ? "No" : "Non"}
      </Item>

      <Item label={en ? "Ongoing " : "En cours"}>
        {product.on_going ? (en ? "Yes" : "Oui") : en ? "No" : "Non"}
      </Item>
    </Descriptions>
  );
};

export default PrivateProductDescription;
