//A functional component that displays the public information of a product in a descriptive layout using Ant Design's Descriptions component.
//The information displayed includes the product's abstract, product type, published date, DOI, product partnerships, product target, authors, and member authors.
//The component uses the LanguageCtx to toggle between English and French content.

import { type FC, useContext } from "react";
import type { ProductPublicInfo } from "../../services/_types";
import React from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import SafeLink from "../link/safe-link";
import ProductTypeLink from "../link/product-type-link";
import type { PublicMemberRes } from "../../pages/api/member/[id]/public";
import { useState, useEffect } from "react";
import getMemberAuthor from "../getters/product-member-author-getter";
import { Grid, Descriptions, Tag } from "antd";
const Item = Descriptions.Item;

const { useBreakpoint } = Grid;

type Props = {
  product: ProductPublicInfo;
};

const PublicProductDescription: FC<Props> = ({ product }) => {
  const screens = useBreakpoint();
  const { en } = useContext(LanguageCtx);

  const [members, setAccounts] = useState<PublicMemberRes[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      const res = await fetch("../../api/all-members");
      const data = await res.json();
      setAccounts(data);
    };

    fetchAccounts();
  }, []);

  return (
    <Descriptions
      size="small"
      bordered
      column={1}
      labelStyle={{ whiteSpace: "nowrap", width: 0 }}
      layout={screens.xs ? "vertical" : "horizontal"}
    >
      <Item
        label={en ? "Abstract" : "Résumé"}
        style={{ whiteSpace: "break-spaces" }}
      >
        {en ? product.note : product.note}
      </Item>

      <Item label={en ? "Product Type" : "Type de produit"}>
        <ProductTypeLink product_type={product.product_type} />
      </Item>

      <Item label={en ? "Published Date" : "Date de publication"}>
        {product.publish_date
          ? new Date(product.publish_date).toISOString().split("T")[0]
          : ""}
      </Item>

      <Item label={en ? "DOI" : "DOI"}>
        <SafeLink href={`https://doi.org/${product.doi}`} external>
          {product.doi}
        </SafeLink>
      </Item>

      <Item label={en ? "Product Partnership" : "Partenaires du produit"}>
        {product.product_partnership.map((entry, i) => (
          <Tag key={entry.organization.id} color="blue">
            {en ? entry.organization.name_en : entry.organization.name_fr}
          </Tag>
        ))}
      </Item>

      <Item label={en ? "Product Target" : "Cible du produit"}>
        {product.product_target.map((entry, i) => (
          <Tag key={entry.target.id} color="blue">
            {en ? entry.target.name_en : entry.target.name_fr}
          </Tag>
        ))}
      </Item>

      <Item label={en ? "Authors" : "Auteurs"}>{product.all_author}</Item>

      <Item label={en ? "Member Authors" : "Auteurs membres"}>
        {product.all_author
          ? getMemberAuthor(product.product_member_author)
          : null}
      </Item>
    </Descriptions>
  );
};

export default PublicProductDescription;
