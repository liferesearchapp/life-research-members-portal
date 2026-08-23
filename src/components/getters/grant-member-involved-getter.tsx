// This is a functional component that returns a list of names of members involved in a grant as a list of Ant Design tags
// The names are wrapped in a SafeLink component that links to the profile of each member
// The color of each tag is generated from the string value of the name using the colorFromString utility function

import React from "react";
import PageRoutes from "../../routing/page-routes";
import SafeLink from "../link/safe-link";
import colorFromString from "../../utils/front-end/color-from-string";
import { Tag } from "antd";

const getMemberInvolved = (
  grant_member_involved: Array<{
    member: {
      id: number;
      account: { first_name: string; last_name: string };
    };
  }>
) => {
  const memberNames = grant_member_involved.map((member_involved) => {
    const name =
      member_involved.member.account.first_name +
      " " +
      member_involved.member.account.last_name;
    return (
      // eslint-disable-next-line react/jsx-key
      <SafeLink href={PageRoutes.memberProfile(member_involved.member.id)}>
        <Tag color={colorFromString(name)}>{name}</Tag>
      </SafeLink>
    );
  });
  return <>{memberNames}</>;
};

export default getMemberInvolved;
