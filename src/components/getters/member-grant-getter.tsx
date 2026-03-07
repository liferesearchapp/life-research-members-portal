import React from "react";
import PageRoutes from "../../routing/page-routes";
import SafeLink from "../link/safe-link";
import { List } from "antd";
import colorFromString from "../../utils/front-end/color-from-string";

const getMemberGrant = (
  grant_investigator_member: Array<{
    grant: {
      id: number;
      title: string;
    };
  }>
) => {
  const grantList = grant_investigator_member.map((member_grant, i) => {
    const grant = member_grant.grant;
    const title = grant.title;

    return {
      num: i + 1,
      title,
      link: PageRoutes.grantProfile(grant.id),
      color: colorFromString(title),
    };
  });

  return (
    <List
      dataSource={grantList}
      renderItem={(item) => (
        <List.Item>
          <span style={{ marginRight: "8px" }}>{item.num}.</span>
          <SafeLink href={item.link}>{item.title}</SafeLink>
        </List.Item>
      )}
    />
  );
};

export default getMemberGrant;
