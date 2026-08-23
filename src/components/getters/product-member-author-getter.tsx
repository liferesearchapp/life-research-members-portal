// This is a functional component that returns a list of names of members who are authors of a product as a list of Ant Design tags
// The names are wrapped in a SafeLink component that links to the profile of each member
// The color of each tag is generated from the string value of the name using the colorFromString utility function

import React from "react";
import PageRoutes from "../../routing/page-routes";
import SafeLink from "../link/safe-link";
import colorFromString from "../../utils/front-end/color-from-string";
import { Tag } from "antd";

const getMemberAuthor = (
  product_member_author: Array<{
    member: {
      id: number;
      account: { first_name: string; last_name: string };
    };
  }>
) => {
  const memberNames = product_member_author.map((member_author) => {
    const name =
      member_author.member.account.first_name +
      " " +
      member_author.member.account.last_name;
    return (
      <SafeLink
        key={member_author.member.id} // Added the key prop here
        href={PageRoutes.memberProfile(member_author.member.id)}
      >
        <Tag color={colorFromString(name)}>{name}</Tag>
      </SafeLink>
    );
  });
  return <>{memberNames}</>;
};

export default getMemberAuthor;
