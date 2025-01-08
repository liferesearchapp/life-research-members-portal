/**

PublicGrantDescription component displays the public information of a grant in a table format.
The component uses Ant Design's Descriptions component to render the grant's information.
It takes the grant's information from the grant object passed as a prop.
*/

import Grid from "antd/lib/grid";
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import { FC, useContext } from "react";
import type { GrantPublicInfo } from "../../services/_types";
import { LanguageCtx } from "../../services/context/language-ctx";
import React from "react";
import Tag from "antd/lib/tag";
import SafeLink from "../link/safe-link";
//import GrantSatusLink from "../link/grant-status-link";
//import GrantSourceLink from "../link/grant-source-link";
import PageRoutes from "../../routing/page-routes";
import colorFromString from "../../utils/front-end/color-from-string";
import { useState, useEffect } from "react";

const { useBreakpoint } = Grid;

type Props = {
  grant: GrantPublicInfo;
};

const PublicGrantDescription: FC<Props> = ({ grant }) => {
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
      <Item label={en ? "Title" : "Titre"}>{grant.title}</Item>

      <Item label={en ? "Amount" : "Montant"}>{grant.amount}</Item>

      <Item label={en ? "Through Institute" : "Through Institut"}>
        {grant.throught_lri ? (en ? "Yes" : "Oui") : en ? "No" : "Non"}
      </Item>

      <Item label={en ? "Submission Date" : "Date de soumission"}>
        {grant.submission_date
          ? new Date(grant.submission_date).toISOString().split("T")[0]
          : ""}
      </Item>

      <Item label={en ? "Obtained Date" : "Date d'obtention"}>
        {grant.obtained_date
          ? new Date(grant.obtained_date).toISOString().split("T")[0]
          : ""}
      </Item>

      <Item label={en ? "Completed Date" : "Date d'achèvement"}>
        {grant.completed_date
          ? new Date(grant.completed_date).toISOString().split("T")[0]
          : ""}
      </Item>

      <Item label={en ? "All Investigators" : "Tous les chercheurs"}>
        {grant.all_investigator}
      </Item>

      <Item label={en ? "Investigator Member" : "Membre chercheur"}>
        {grant.grant_investigator_member.map((entry, i) => (
          <SafeLink
            key={entry.member.id}
            href={PageRoutes.memberProfile(entry.member.id)}
          >
            <Tag color="red">
              {entry.member.account.first_name +
                " " +
                entry.member.account.last_name}
            </Tag>
          </SafeLink>
        ))}
      </Item>

      <Item label={en ? "Member Involved" : "Membre impliqué"}>
        {grant.grant_member_involved.map((entry, i) => (
          <SafeLink
            key={entry.member.id}
            href={PageRoutes.memberProfile(entry.member.id)}
          >
            <Tag color="blue">
              {entry.member.account.first_name +
                " " +
                entry.member.account.last_name}
            </Tag>
          </SafeLink>
        ))}
      </Item>

      <Item label={en ? "Topic" : "Sujet"}>
        {grant.topic ? (en ? grant.topic.name_en : grant.topic.name_fr) : ""}
      </Item>

      <Item label={en ? "Institute" : "L'institut"}>
        <Tag
          key={grant.institute.id}
        >{`${grant.institute.name} - ${grant.institute.urlIdentifier}`}</Tag>
      </Item>

      <Item label={en ? "Note" : "Note"} style={{ whiteSpace: "break-spaces" }}>
        {grant.note}
      </Item>
    </Descriptions>
  );
};

export default PublicGrantDescription;
