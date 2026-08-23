// PublicPartnerProfile component displays the public information of an organization using PublicPartnerDescription component and a Card component from Ant Design library.
//It takes the ID of the organization as a prop and uses the usePublicOrganizationInfo hook to retrieve the information of the organization.
//The component also makes use of the LanguageCtx context to toggle the language of the component between English and French.

import { type FC, useContext } from "react";
import usePublicOrganizationInfo from "../../services/use-public-partner-info";
import CardSkeleton from "../loading/card-skeleton";
import PublicPartnerDescription from "./partner-public-description";
import { LanguageCtx } from "../../services/context/language-ctx";
import { Empty, Card, Typography } from "antd";
const Title = Typography.Title;

type Props = {
  id: number;
};

const PublicPartnerProfile: FC<Props> = ({ id }) => {
  const { org, loading } = usePublicOrganizationInfo(id);
  const { en } = useContext(LanguageCtx);

  if (loading) return <CardSkeleton />;
  if (!org) return <Empty />;

  const header = (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <Title
        level={2}
        style={{
          margin: 0,
          minWidth: 0,
          marginRight: "auto",
          paddingRight: 16,
          whiteSpace: "break-spaces",
        }}
      >
        {org.name_en}
      </Title>
    </div>
  );

  return (
    <Card title={header}>
      <PublicPartnerDescription partner={org} />
    </Card>
  );
};

export default PublicPartnerProfile;
