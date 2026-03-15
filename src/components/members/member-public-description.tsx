import Grid from "antd/lib/grid";
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import { FC, useContext } from "react";
import type { MemberPublicInfo } from "../../services/_types";
import GetLanguage from "../../utils/front-end/get-language";
import KeywordTag from "../keywords/keyword-tag";
import React from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import {
  FacebookOutlined,
  LinkedinOutlined,
  TwitterOutlined,
} from "@ant-design/icons";
import Tag from "antd/lib/tag";
import SafeLink from "../link/safe-link";
import TikTokIcon from "../icons/tiktok-icon";
import CvIcon from "../icons/cv-icon";
import WebsiteIcon from "../icons/website-icon";
import MemberTypeLink from "../link/member-type-link";
import FacultyLink from "../link/faculty-link";
import getMemberProduct from "../getters/member-product-author-getter";
import getMemberOrg from "../getters/member-partner-getter";
import getMemberSupervision from "../getters/member-supervision-getter";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import getMemberGrant from "../getters/member-grant-getter";
import { useAdminDetails } from "../../services/context/selected-institute-ctx";

const { useBreakpoint } = Grid;

type Props = {
  member: MemberPublicInfo;
};

const PublicMemberDescription: FC<Props> = ({ member }) => {
  const screens = useBreakpoint();
  const { en } = useContext(LanguageCtx);
  const { localAccount } = useContext(ActiveAccountCtx);
  const isAdmin = useAdminDetails();

  return (
    <Descriptions
      size="small"
      bordered
      column={1}
      labelStyle={{ whiteSpace: "nowrap", width: 0 }}
      layout={screens.xs ? "vertical" : "horizontal"}
    >
      <Item
        label={en ? "About Me" : "À propos de moi"}
        style={{ whiteSpace: "break-spaces" }}
      >
        {en ? member.about_me_en : member.about_me_fr}
      </Item>
      <Item label={en ? "Faculty" : "Faculté"}>
        <FacultyLink faculty={member.faculty} />
      </Item>
      <Item label={en ? "Member Type" : "Type de membre"}>
        <MemberTypeLink member_type={member.member_type} />
      </Item>
      <Item
        label={
          en ? "Problems I Work On" : "Problèmes sur lesquels je travaille"
        }
        labelStyle={{ whiteSpace: "break-spaces" }}
      >
        {member.problem.map((p, i) => (
          <React.Fragment key={i}>
            {`${i + 1}. `}
            <GetLanguage obj={p} />
            <br />
          </React.Fragment>
        ))}
      </Item>
      <Item label={en ? "Keywords" : "Mots-clés"}>
        {member.has_keyword.map((entry, i) => (
          <KeywordTag key={i} keyword={entry.keyword} linked />
        ))}
      </Item>
      <Item label={en ? "Email" : "Courriel"}>
        <a href={"mailto:" + member.work_email}>{member.work_email}</a>
      </Item>
      <Item label={en ? "Phone" : "Téléphone"}>
        <a href={"tel:" + member.work_phone}>{member.work_phone}</a>
      </Item>
      <Item label={en ? "Links" : "Liens"}>
        <>
          {member.cv_link ? (
            <SafeLink href={member.cv_link} external>
              <Tag icon={<CvIcon />} color="#002766">
                CV
              </Tag>
            </SafeLink>
          ) : null}

          {member.website_link ? (
            <SafeLink href={member.website_link} external>
              <Tag icon={<WebsiteIcon />} color="#002766">
                Website
              </Tag>
            </SafeLink>
          ) : null}

          {member.linkedin_link ? (
            <SafeLink href={member.linkedin_link} external>
              <Tag icon={<LinkedinOutlined />} color="#0a66c2">
                LinkedIn
              </Tag>
            </SafeLink>
          ) : null}

          {member.facebook_link ? (
            <SafeLink href={member.facebook_link} external>
              <Tag icon={<FacebookOutlined />} color="#4267B2">
                Facebook
              </Tag>
            </SafeLink>
          ) : null}

          {member.twitter_link ? (
            <SafeLink href={member.twitter_link} external>
              <Tag icon={<TwitterOutlined />} color="#1da1f2">
                Twitter
              </Tag>
            </SafeLink>
          ) : null}
        </>
      </Item>

      {member.product_member_author.length > 0 && (
        <Item label={en ? "Member's Products" : "Produits du membre"}>
          {getMemberProduct(member.product_member_author)}
        </Item>
      )}

      {member.partnership_member_org.length > 0 &&
        localAccount &&
        (localAccount.member?.id === member.id || isAdmin) && (
          <Item label={en ? "Member's Partners" : "Partenaires du membre"}>
            {getMemberOrg(member.partnership_member_org)}
          </Item>
        )}

      {member.supervision_principal_supervisor.length > 0 &&
        localAccount &&
        (localAccount.member?.id === member.id || isAdmin) && (
          <Item label={en ? "Member's Supervision" : "Supervisions du membre"}>
            {getMemberSupervision(member.supervision_principal_supervisor)}
          </Item>
        )}

      {member.grant_member_involved.length > 0 &&
        localAccount &&
        (localAccount.member?.id === member.id || isAdmin) && (
          <Item label={en ? "Grant involved" : "Subvention impliqué"}>
            {getMemberGrant(member.grant_member_involved)}
          </Item>
        )}
    </Descriptions>
  );
};

export default PublicMemberDescription;
