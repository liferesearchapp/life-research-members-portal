import { FC, useContext } from "react";
import usePublicMemberInfo from "../../services/use-public-member-info";
import CardSkeleton from "../loading/card-skeleton";
import PublicMemberDescription from "./member-public-description";
import { LanguageCtx } from "../../services/context/language-ctx";
import { Empty, Card, Typography } from "antd";
const Title = Typography.Title;

type Props = {
  id: number;
};

const PublicMemberProfile: FC<Props> = ({ id }) => {
  const { member, loading } = usePublicMemberInfo(id);
  const { en } = useContext(LanguageCtx);

  if (loading) return <CardSkeleton />;
  if (!member) return <Empty />;
  if (!member.is_active)
    return <Title>{en ? "Member is inactive." : "Le membre est inactif."}</Title>;

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
        {member.account.first_name + " " + member.account.last_name}
      </Title>
    </div>
  );

  return (
    <Card title={header}>
      <PublicMemberDescription member={member} />
    </Card>
  );
};

export default PublicMemberProfile;
