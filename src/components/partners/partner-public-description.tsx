/**
This component displays the public information of a partner, including organization type, organization scope, and description.
If the partner has partner members and the user is an admin, these members are also displayed.
*/

import Grid from "antd/lib/grid";
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import { FC, useContext } from "react";
import type { PartnerPublicInfo } from "../../services/_types";
import GetLanguage from "../../utils/front-end/get-language";
import React from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import Tag from "antd/lib/tag";
import SafeLink from "../link/safe-link";
import PartnerScopeLink from "../link/partner-scope-link";
import PartnerTypeLink from "../link/partner-type-link";
import PageRoutes from "../../routing/page-routes";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";

const { useBreakpoint } = Grid;

type Props = {
  partner: PartnerPublicInfo;
};

const PublicPartnerDescription: FC<Props> = ({ partner }) => {
  const screens = useBreakpoint();
  const { en } = useContext(LanguageCtx);
  const { localAccount } = useContext(ActiveAccountCtx);

  return (
    <Descriptions
      size="small"
      bordered
      column={1}
      labelStyle={{ whiteSpace: "nowrap", width: 0 }}
      layout={screens.xs ? "vertical" : "horizontal"}
    >
      <Item label={en ? "Orgnanization type" : "Type d'organisation"}>
        <PartnerTypeLink org_type={partner.org_type} />
      </Item>
      <Item label={en ? "Organization Scope" : "Portée de l'organisation"}>
        <PartnerScopeLink org_scope={partner.org_scope} />
      </Item>

      <Item label={en ? "Institute" : "L'institut"}>
        {partner.organizationInstitute.map((entry, i) => (
          <Tag
            key={entry.institute.id}
          >{`${entry.institute.name} - ${entry.institute.urlIdentifier}`}</Tag>
        ))}
      </Item>

      <Item label={en ? "Description" : "Description"}>
        {partner.description}
      </Item>

      {partner.partnership_member_org.length > 0 &&
        localAccount &&
        localAccount.is_admin && (
          <Item label={en ? "Partner Members" : "Membres du partenaire"}>
            {partner.partnership_member_org.map((entry, i) => (
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
        )}
    </Descriptions>
  );
};

export default PublicPartnerDescription;
