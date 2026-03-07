import { type FC, useContext } from "react";
import type { MemberPrivateInfo } from "../../services/_types";
import React from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import { Grid, Descriptions } from "antd";
const Item = Descriptions.Item;

const { useBreakpoint } = Grid;

type Props = {
  member: MemberPrivateInfo;
};

const PrivateMemberDescription: FC<Props> = ({ member }) => {
  const screens = useBreakpoint();
  const { en } = useContext(LanguageCtx);

  let address = "";
  if (member.address) address += member.address;
  if (member.city) {
    if (address) address += ", ";
    address += member.city;
  }
  if (member.province) {
    if (address) address += ", ";
    address += member.province;
  }
  if (member.country) {
    if (address) address += ", ";
    address += member.country;
  }
  if (member.postal_code) {
    if (address) address += ", ";
    address += member.postal_code;
  }

  return (
    <Descriptions
      size="small"
      bordered
      column={1}
      labelStyle={{ whiteSpace: "nowrap", width: 0 }}
      layout={screens.xs ? "vertical" : "horizontal"}
    >
      <Item label={en ? "Active" : "Active"}>
        {member.is_active
          ? en
            ? "Yes"
            : "Oui"
          : (en ? "No, Last Active: " : "Non, dernièrement actif: ") + member.last_active?.split("T")[0]}
      </Item>
      <Item label={en ? "Date Joined" : "Date d'inscription"}>
        {member.date_joined?.split("T")[0]}
      </Item>
      <Item label={en ? "Mobile Phone" : "Téléphone mobile"}>
        <a href={"tel:" + member.mobile_phone}>{member.mobile_phone}</a>
      </Item>
      <Item label={en ? "Address" : "Adresse"}>{address}</Item>
    </Descriptions>
  );
};

export default PrivateMemberDescription;
