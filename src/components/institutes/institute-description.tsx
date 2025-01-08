import Grid from "antd/lib/grid";
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import { FC, useContext } from "react";
import type { InstituteInfo } from "../../services/_types";
import React from "react";
import { LanguageCtx } from "../../services/context/language-ctx";

const { useBreakpoint } = Grid;

type Props = {
  institute: InstituteInfo;
};

const InstituteDescription: FC<Props> = ({ institute }) => {
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
      <Item label={en ? "Active" : "Active"}>
        {institute.is_active
          ? en
            ? "Yes"
            : "Oui"
          : (en ? "No" : "Non")}
      </Item>
      <Item label={en ? "Name" : "Nom"}>{institute.name}</Item>
      <Item label={en ? "URL Identifier" : "Identifiant URL"}>{institute.urlIdentifier}</Item>
      <Item label="Description (EN)">{institute.description_en}</Item>
      <Item label="Description (FR)">{institute.description_fr}</Item>
    </Descriptions>
  );
};

export default InstituteDescription;
