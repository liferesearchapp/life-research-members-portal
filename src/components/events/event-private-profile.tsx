// This component displays the profile of an event, with the possibility to view or edit it

import Empty from "antd/lib/empty";
import Button from "antd/lib/button";
import Card from "antd/lib/card/Card";
import Title from "antd/lib/typography/Title";
import { type FC, type ReactNode, useCallback, useContext, useState } from "react";
import CardSkeleton from "../loading/card-skeleton";
import PublicEventDescription from "./event-public-description";
import usePrivateEventInfo from "../../services/use-private-event-info";
import { LanguageCtx } from "../../services/context/language-ctx";
import Tabs from "antd/lib/tabs";
import type { EventPrivateInfo } from "../../services/_types";
import DeleteEventButton from "./delete-event-button";
import { SaveChangesCtx } from "../../services/context/save-changes-ctx";
import PublicEventForm from "./event-public-form";

type Tab = { label: string; key: string; children: ReactNode };

const keys = { public: "public", private: "private", admin: "admin" };

type Props = {
  id: number;
};

const PrivateEventProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { event, setEvent, loading } = usePrivateEventInfo(id);
  const [editMode, setEditMode] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState(keys.public);
  const { saveChangesPrompt } = useContext(SaveChangesCtx);

  const onSuccess = useCallback(
    (updatedEvent: EventPrivateInfo) => setEvent(updatedEvent),
    [setEvent]
  );

  if (loading) return <CardSkeleton />;
  if (!event) return <Empty />;

  function onCancel() {
    saveChangesPrompt({ onSuccessOrDiscard: () => setEditMode(false) });
  }

  async function onChange(key: string) {
    saveChangesPrompt({ onSuccessOrDiscard: () => setActiveTabKey(key) });
  }

  const editButton = (
    <Button
      size="large"
      type="primary"
      style={{ flexGrow: 1, maxWidth: "10rem" }}
      onClick={() => setEditMode(true)}
    >
      {en ? "Edit" : "Éditer"}
    </Button>
  );

  const doneButton = (
    <Button
      size="large"
      danger
      style={{ flexGrow: 1, maxWidth: "10rem" }}
      onClick={onCancel}
    >
      {en ? "Done" : "Fini"}
    </Button>
  );

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
      {editMode ? doneButton : editButton}
    </div>
  );

  const descriptions: Tab[] = [
    {
      label: en ? "About this event" : "À propos de cet événement",
      key: keys.public,
      children: <PublicEventDescription event={event} />,
    },
    // Add other tab descriptions here
  ];

  const forms: Tab[] = [
    {
      label: en
        ? "Edit event informations"
        : "Éditer les informations de l'événement",

      key: keys.public,
      children: <PublicEventForm event={event} onSuccess={onSuccess} />,
    },
    // Add form components for editing event information here
  ];

  return (
    <Card title={header} bodyStyle={{ paddingTop: 0 }}>
      <Tabs
        items={editMode ? forms : descriptions}
        activeKey={activeTabKey}
        onChange={onChange}
        destroyInactiveTabPane
      />
      <DeleteEventButton
        event={event}
        setEvent={setEvent}
        style={{ marginLeft: "auto", marginTop: "20px", display: "block" }}
      />
    </Card>
  );
};

export default PrivateEventProfile;
