// This is a functional component that returns a list of names involved in a partnership as a list of Ant Design tags
// The names are wrapped in a SafeLink component that links to the profile of each organization
// The color of each tag is generated from the string value of the name using the colorFromString utility function
// The component uses the LanguageCtx to determine whether to display the English or French name of each organization


import React, { useContext } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import PageRoutes from "../../routing/page-routes";
import SafeLink from "../link/safe-link";
import colorFromString from "../../utils/front-end/color-from-string";
import { Tag } from "antd";

const getMemberOrg = (
  partnership_member_org: Array<{
    organization: {
      id: number;
      name_en: string;
      name_fr: string;
    };
  }>
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { en } = useContext(LanguageCtx);

  const orgNames = partnership_member_org.map((member_org, i) => {
    const org = member_org.organization;
    const name = en ? org.name_en : org.name_fr;

    return (
      <SafeLink key={org.id} href={PageRoutes.organizationProfile(org.id)}>
        <Tag color={colorFromString(name)}>{name}</Tag>
      </SafeLink>
    );
  });
  return <>{orgNames}</>;
};

export default getMemberOrg;
