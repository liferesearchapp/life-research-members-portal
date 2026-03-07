// A component that displays a private supervision profile.
// It can either show supervision information or allow the user to edit the supervision's information.

import { type FC, type ReactNode, useCallback, useContext, useState } from "react";
import CardSkeleton from "../loading/card-skeleton";
import PublicSupervisionDescription from "./supervision-public-description";
import usePrivateSupervisionInfo from "../../services/use-private-supervision-info";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { SupervisionPrivateInfo } from "../../services/_types";
import DeleteSupervisionButton from "./delete-supervision-button";

import { SaveChangesCtx } from "../../services/context/save-changes-ctx";
import PublicSupervisionForm from "./supervision-public-form";
import { Empty, Button, Card, Typography, Tabs } from "antd";
const Title = Typography.Title;

type Tab = { label: string; key: string; children: ReactNode };

const keys = { public: "public", private: "private", admin: "admin" };

type Props = {
  id: number;
};

const PrivateSupervisionProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { supervision, setSupervision, loading } =
    usePrivateSupervisionInfo(id);
  const [editMode, setEditMode] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState(keys.public);
  const { saveChangesPrompt } = useContext(SaveChangesCtx);

  /** After saving changes via submit button - dependency of form's submit */
  const onSuccess = useCallback(
    (updatedSupervision: SupervisionPrivateInfo) =>
      setSupervision(updatedSupervision),
    [setSupervision]
  );

  if (loading) return <CardSkeleton />;
  if (!supervision) return <Empty />;

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
        {`${supervision.first_name} ${supervision.last_name}`}
      </Title>
      {editMode ? doneButton : editButton}
    </div>
  );

  const descriptions: Tab[] = [
    {
      label: en ? "Supervision info" : "Info sur la supervision",
      key: keys.public,
      children: <PublicSupervisionDescription supervision={supervision} />,
    },
  ];

  const forms: Tab[] = [
    {
      label: en
        ? "Edit supervision's Info"
        : "Éditer les infos de la supervision",
      key: keys.public,
      children: (
        <PublicSupervisionForm
          supervision={supervision}
          onSuccess={onSuccess}
        />
      ),
    },
  ];

  return (
    <Card title={header} styles={{ body: { paddingTop: 0 } }}>
      <Tabs
        items={editMode ? forms : descriptions}
        //items={descriptions}
        activeKey={activeTabKey}
        onChange={onChange}
        // Very important to destroy inactive forms,
        // so they register their submit function to the save changes context when navigated back
        destroyInactiveTabPane
      />
      <DeleteSupervisionButton
        supervision={supervision}
        setSupervision={setSupervision}
        style={{ marginLeft: "auto", marginTop: "20px", display: "block" }}
      />
    </Card>
  );
};

export default PrivateSupervisionProfile;
