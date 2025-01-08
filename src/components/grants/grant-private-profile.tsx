// This component is a detailed view of a private grant's profile.
// It contains tabs for public and private information, and the ability to edit and delete the grant.
// The component has two modes, view mode and edit mode.
// The component uses the save-changes context to prompt the user to save unsaved changes before navigating away.

import Empty from "antd/lib/empty";
import Button from "antd/lib/button";
import Card from "antd/lib/card/Card";
import Title from "antd/lib/typography/Title";
import { type FC, ReactNode, useCallback, useContext, useState } from "react";
import CardSkeleton from "../loading/card-skeleton";

import usePrivateGrantInfo from "../../services/use-private-grant-info";
import { LanguageCtx } from "../../services/context/language-ctx";
import Tabs from "antd/lib/tabs";
import type { GrantPrivateInfo } from "../../services/_types";
import { SaveChangesCtx } from "../../services/context/save-changes-ctx";
import PublicGrantDescription from "./grant-public-description";
//import GrantAdminDescription from "./grant-admin-description";
//import PrivateGrantDescription from "./grant-private-description";
//import PrivateGrantForm from "./grant-private-form";
import PublicGrantForm from "./grant-public-form";
//import GrantAdminForm from "./grant-admin-form";
import DeleteGrantButton from "./delete-grant-button";

type Tab = { label: string; key: string; children: ReactNode };

const keys = { public: "public", private: "private", admin: "admin" };

type Props = {
  id: number;
};

const PrivateGrantProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { grant, setGrant, loading } = usePrivateGrantInfo(id);
  const [editMode, setEditMode] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState(keys.public);
  const { saveChangesPrompt } = useContext(SaveChangesCtx);

  /** After saving changes via submit button - dependency of form's submit */
  const onSuccess = useCallback(
    (updatedGrant: GrantPrivateInfo) => setGrant(updatedGrant),
    [setGrant]
  );

  if (loading) return <CardSkeleton />;
  if (!grant) return <Empty />;

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
        {grant.title}
      </Title>
      {editMode ? doneButton : editButton}
    </div>
  );

  const descriptions: Tab[] = [
    {
      label: en ? "Public" : "Publique",
      key: keys.public,
      children: <PublicGrantDescription grant={grant} />,
    },
    /*  {
      label: en ? "Private" : "Privé",
      key: keys.private,
      children: <PrivateGrantDescription grant={grant} />,
    },

    {
      label: en ? "Admin" : "Admin",
      key: keys.admin,
      children: <GrantAdminDescription grant={grant} />,
    }, */
  ];

  const forms: Tab[] = [
    {
      label: en ? "Public" : "Publique",
      key: keys.public,
      children: <PublicGrantForm grant={grant} onSuccess={onSuccess} />,
    },
    /*
    {
      label: en ? "Private" : "Privé",
      key: keys.private,
      children: <PrivateGrantForm grant={grant} onSuccess={onSuccess} />,
    },
    {
      label: en ? "Admin" : "Admin",
      key: keys.admin,
      children: <GrantAdminForm grant={grant} onSuccess={onSuccess} />,
    },
    */
  ];

  return (
    <Card title={header} bodyStyle={{ paddingTop: 0 }}>
      <Tabs
        items={editMode ? forms : descriptions}
        // items={descriptions}
        activeKey={activeTabKey}
        onChange={onChange}
        // Very important to destroy inactive forms,
        // so they register their submit function to the save changes context when navigated back
        destroyInactiveTabPane
      />
      <DeleteGrantButton
        grant={grant}
        setGrant={setGrant}
        style={{ marginLeft: "auto", marginTop: "20px", display: "block" }}
      />
    </Card>
  );
};

export default PrivateGrantProfile;
