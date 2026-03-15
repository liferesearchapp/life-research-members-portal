// This is a functional component that returns a list of products authored by members
// The product list is displayed using Ant Design's List component
// Each item in the list includes the product's title and a link to its profile
// The link is wrapped in a SafeLink component
// The color of each product title is generated from the string value of the title using the colorFromString utility function
// The component uses the LanguageCtx to determine whether to display the English or French title of each product

import React, { useContext } from "react";
import PageRoutes from "../../routing/page-routes";
import SafeLink from "../link/safe-link";
import { List } from "antd";
import colorFromString from "../../utils/front-end/color-from-string";
import { LanguageCtx } from "../../services/context/language-ctx";

const getMemberProduct = (
  product_member_author: Array<{
    product: {
      id: number;
      title_en: string;
      title_fr: string;
    };
  }>
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { en } = useContext(LanguageCtx);

  const productList = product_member_author.map((member_product, i) => {
    const title = en
      ? member_product.product.title_en
      : member_product.product.title_fr;

    return {
      num: i + 1,
      title,
      link: PageRoutes.productProfile(member_product.product.id),
      color: colorFromString(title),
    };
  });

  return (
    <List
      dataSource={productList}
      renderItem={(item) => (
        <List.Item>
          <span style={{ marginRight: "8px" }}>{item.num}.</span>
          <SafeLink href={item.link}>{item.title}</SafeLink>
        </List.Item>
      )}
    />
  );
};

export default getMemberProduct;
