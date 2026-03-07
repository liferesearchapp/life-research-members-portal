import React, {
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import CardSkeleton from "../loading/card-skeleton";
import PublicMemberDescription from "./member-public-description";
import PublicMemberForm from "./member-public-form";
import MyProfileRegister from "./my-profile-register";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { MemberPrivateInfo } from "../../services/_types";
import PrivateMemberDescription from "./member-private-description";
import MemberInsightDescription from "./member-insight-description";
import PrivateMemberForm from "./member-private-form";
import MemberInsightForm from "./member-insight-form";
import { SaveChangesCtx } from "../../services/context/save-changes-ctx";
import router from "next/router";
import { Button, Card, Typography, Tabs } from "antd";
const Title = Typography.Title;

type Tab = { label: string; key: string; children: ReactNode };

const keys = { public: "public", private: "private", insight: "insight" };

const MyProfile: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { localAccount, setLocalAccount, loading, refresh } =
    useContext(ActiveAccountCtx);
  const [editMode, setEditMode] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState(keys.public);
  const { saveChangesPrompt } = useContext(SaveChangesCtx);

  const handleRegisterPartner = () => {
    router.push("/partners/register-partner");
  };

  const handleRegisterSupervision = () => {
    router.push("/supervisions/register-supervision");
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** After saving changes via submit button - dependency of form's submit */
  const onSuccess = useCallback(
    (updatedMember: MemberPrivateInfo) => {
      setLocalAccount((prev) => {
        if (prev)
          return {
            ...prev,
            member: updatedMember,
            first_name: updatedMember.account.first_name,
            last_name: updatedMember.account.last_name,
          };
        return prev;
      });
    },
    [setLocalAccount]
  );

  if (loading) return <CardSkeleton />;
  if (!localAccount) return null; // Auth guard should prevent this
  if (!localAccount.member) return <MyProfileRegister />;
  const member = localAccount.member;

  /** When clicking cancel - prompt to save changes if dirty */
  function onCancel() {
    saveChangesPrompt({ onSuccessOrDiscard: () => setEditMode(false) });
  }

  /** When changing tabs - prompt to save changes if dirty */
  async function onChange(key: string) {
    saveChangesPrompt({ onSuccessOrDiscard: () => setActiveTabKey(key) });
  }

  const addPartnerButton = localAccount && (
    <Button
      type="primary"
      size="large"
      onClick={() => handleRegisterPartner()}
      style={{ marginRight: 16 }}
    >
      {en ? "Add a partner" : "Ajouter un partenaire"}
    </Button>
  );

  const addSupervisionButton = localAccount && (
    <Button
      type="primary"
      size="large"
      onClick={() => handleRegisterSupervision()}
      style={{ marginRight: 16 }}
    >
      {en ? "Add a supervision" : "Ajouter une supervision"}
    </Button>
  );

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
        {localAccount.first_name + " " + localAccount.last_name}
      </Title>
      {addSupervisionButton}
      {addPartnerButton}
      {editMode ? doneButton : editButton}
    </div>
  );

  const descriptions: Tab[] = [
    {
      label: en ? "Public" : "Public",
      key: keys.public,
      children: <PublicMemberDescription member={member} />,
    },
    {
      label: en ? "Private" : "Privé",
      key: keys.private,
      children: <PrivateMemberDescription member={member} />,
    },
    ...(localAccount && localAccount.is_admin
      ? [
          {
            label: en ? "Insight" : "Aperçu",
            key: keys.insight,
            children: <MemberInsightDescription member={member} />,
          },
        ]
      : []),
  ];

  const forms: Tab[] = [
    {
      label: en ? "Public" : "Public",
      key: keys.public,
      children: <PublicMemberForm member={member} onSuccess={onSuccess} />,
    },
    {
      label: en ? "Private" : "Privé",
      key: keys.private,
      children: <PrivateMemberForm member={member} onSuccess={onSuccess} />,
    },
    ...(localAccount && localAccount.is_admin
      ? [
          {
            label: en ? "Insight" : "Aperçu",
            key: keys.insight,
            children: (
              <MemberInsightForm member={member} onSuccess={onSuccess} />
            ),
          },
        ]
      : []),
  ];

  return (
    <Card title={header} styles={{ body: { paddingTop: 0 } }}>
      <Tabs
        items={editMode ? forms : descriptions}
        activeKey={activeTabKey}
        onChange={onChange}
        // Very important to destroy inactive forms,
        // so they register their submit function to the save changes context when navigated back
        destroyInactiveTabPane
      />
    </Card>
  );
};

export default MyProfile;
