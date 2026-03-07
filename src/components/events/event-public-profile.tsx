// This is a component that displays the public profile of an event.
// It uses the "usePublicEventInfo" hook to fetch the data for the event, and the "LanguageCtx" context to determine the preferred language.

import { type FC, useContext } from "react";
import usePublicEventInfo from "../../services/use-public-event-info";
import CardSkeleton from "../loading/card-skeleton";
import PublicEventDescription from "./event-public-description";
import { LanguageCtx } from "../../services/context/language-ctx";
import { Empty, Card, Typography } from "antd";
const Title = Typography.Title;

type Props = {
  id: number;
};

const EventPublicProfile: FC<Props> = ({ id }) => {
  const { event, loading } = usePublicEventInfo(id);
  const { en } = useContext(LanguageCtx);

  if (loading) return <CardSkeleton />;
  if (!event) return <Empty />;

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
        {en ? event.name_en : event.name_fr}
      </Title>
    </div>
  );

  return (
    <Card title={header}>
      <PublicEventDescription event={event} />
    </Card>
  );
};

export default EventPublicProfile;
