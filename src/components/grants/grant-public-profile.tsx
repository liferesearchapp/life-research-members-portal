// This component displays the public grant profile information for a specific grant id.
// It makes use of the usePublicGrantInfo custom hook to fetch grant information and the LanguageCtx to determine the language to be displayed.
// The grant information is displayed within a Card component with a header containing the grant title.
// The grant description is displayed using the PublicGrantDescription component.

import { type FC, useContext } from "react";
import usePublicGrantInfo from "../../services/use-public-grant-info";
import CardSkeleton from "../loading/card-skeleton";
import PublicGrantDescription from "./grant-public-description";
import { LanguageCtx } from "../../services/context/language-ctx";
import { Empty, Card, Typography } from "antd";
const Title = Typography.Title;

type Props = {
  id: number;
};

const PublicGrantProfile: FC<Props> = ({ id }) => {
  const { grant, loading } = usePublicGrantInfo(id);
  const { en } = useContext(LanguageCtx);

  if (loading) return <CardSkeleton />;
  if (!grant) return <Empty />;

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
        {grant.title}
      </Title>
    </div>
  );

  return (
    <Card title={header}>
      <PublicGrantDescription grant={grant} />
    </Card>
  );
};

export default PublicGrantProfile;
