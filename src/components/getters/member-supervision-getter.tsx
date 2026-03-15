// This is a functional component that returns a list of names of principal supervisors as a list of Ant Design tags
// The names are wrapped in a SafeLink component that links to the profile of each supervision
// The color of each tag is generated from the string value of the name using the colorFromString utility function

import React, { useContext } from "react";
import PageRoutes from "../../routing/page-routes";
import SafeLink from "../link/safe-link";
import colorFromString from "../../utils/front-end/color-from-string";
import { Tag } from "antd";

const getMemberSupervision = (
  supervision_principal_supervisor: Array<{
    supervision: {
      id: number;
      last_name: string;
      first_name: string;
    };
  }>
) => {
  const supervisionNames = supervision_principal_supervisor.map(
    (member_supervision, i) => {
      const supervision = member_supervision.supervision;
      const name = `${supervision.first_name} ${supervision.last_name}`;

      return (
        <SafeLink
          key={supervision.id}
          href={PageRoutes.supervisionProfile(supervision.id)}
        >
          <Tag color={colorFromString(name)}>{name}</Tag>
        </SafeLink>
      );
    }
  );
  return <>{supervisionNames}</>;
};

export default getMemberSupervision;
