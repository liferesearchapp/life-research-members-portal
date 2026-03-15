/**
 * PrivatePartnerProfile component is a card which displays private information of a partner.
 * It also allows editing the public information of the partner.
 * The information is fetched from the API using `usePrivatePartnerInfo` hook.
 * The component has two modes, view mode and edit mode.
 * The component also handles the prompt to save changes before navigating away from the form.
 * The component also includes a `DeletePartnerButton` component to delete the partner.
 */

import { type FC, type ReactNode, useContext, useState, useCallback } from "react";
import usePrivatePartnerInfo from "../../services/use-private-partner-info";
import CardSkeleton from "../loading/card-skeleton";
import PublicPartnerDescription from "./partner-public-description";
import { LanguageCtx } from "../../services/context/language-ctx";
import { SaveChangesCtx } from "../../services/context/save-changes-ctx";
import type { PartnerPrivateInfo } from "../../services/_types";
import { Button, Tabs, Empty, Card, Typography } from "antd";
import PublicPartnerForm from "./partner-public-form";
import DeletePartnerButton from "./delete-partner-button";
const Title = Typography.Title;

type Tab = { label: string; key: string; children: ReactNode };

const keys = { public: "public", private: "private", insight: "insight" };

type Props = {
  id: number;
};

const PrivatePartnerProfile: FC<Props> = ({ id }) => {
  const { org, loading, setOrg } = usePrivatePartnerInfo(id);
  const { en } = useContext(LanguageCtx);
  const [editMode, setEditMode] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState(keys.public);
  const { saveChangesPrompt } = useContext(SaveChangesCtx);

  /** After saving changes via submit button - dependency of form's submit */
  const onSuccess = useCallback(
    (updatedPartner: PartnerPrivateInfo) => setOrg(updatedPartner),
    [setOrg]
  );

  if (loading) return <CardSkeleton />;
  if (!org) return <Empty />;

  /** When clicking cancel - prompt to save changes if dirty */
  function onCancel() {
    saveChangesPrompt({ onSuccessOrDiscard: () => setEditMode(false) });
  }

  /** When changing tabs - prompt to save changes if dirty */
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
        {org.name_en}
      </Title>
      {editMode ? doneButton : editButton}
    </div>
  );

  const descriptions: Tab[] = [
    {
      label: en ? "Public info" : "Info publique",
      key: keys.public,
      children: <PublicPartnerDescription partner={org} />,
    },
  ];

  const forms: Tab[] = [
    {
      label: en ? "Public" : "Publique",
      key: keys.public,
      children: <PublicPartnerForm partner={org} onSuccess={onSuccess} />,
    },
  ];

  return (
    <Card title={header} styles={{ body: { paddingTop: 0 } }}>
      <Tabs
        items={editMode ? forms : descriptions}
        // items={descriptions}
        activeKey={activeTabKey}
        onChange={onChange}
        // Very important to destroy inactive forms,
        // so they register their submit function to the save changes context when navigated back
        destroyInactiveTabPane
      />

      <DeletePartnerButton
        partner={org}
        setPartner={setOrg}
        style={{ marginLeft: "auto", marginTop: "20px", display: "block" }}
      />
    </Card>
  );
};

export default PrivatePartnerProfile;
