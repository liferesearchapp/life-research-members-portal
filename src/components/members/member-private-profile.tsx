import Empty from "antd/lib/empty";
import Button from "antd/lib/button";
import Card from "antd/lib/card/Card";
import Title from "antd/lib/typography/Title";
import { FC, ReactNode, useCallback, useContext, useState } from "react";
import CardSkeleton from "../loading/card-skeleton";
import PublicMemberDescription from "./member-public-description";
import PublicMemberForm from "./member-public-form";
import usePrivateMemberInfo from "../../services/use-private-member-info";
import { LanguageCtx } from "../../services/context/language-ctx";
import Tabs from "antd/lib/tabs";
import type { MemberPrivateInfo } from "../../services/_types";
import PrivateMemberDescription from "./member-private-description";
import MemberInsightDescription from "./member-insight-description";
import PrivateMemberForm from "./member-private-form";
import MemberInsightForm from "./member-insight-form";
import { SaveChangesCtx } from "../../services/context/save-changes-ctx";
import router from "next/router";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { useAdminDetails } from "../../services/context/selected-institute-ctx";
import PageRoutes from "../../routing/page-routes";

type Tab = { label: string; key: string; children: ReactNode };

const keys = { public: "public", private: "private", insight: "insight" };

type Props = {
  id: number;
};

const PrivateMemberProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { member, setMember, loading } = usePrivateMemberInfo(id);
  const [editMode, setEditMode] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState(keys.public);
  const { saveChangesPrompt } = useContext(SaveChangesCtx);

  const handleRegisterPartner = () => {
    router.push("/partners/register-partner");
  };

  const { localAccount } = useContext(ActiveAccountCtx);
  const isAdmin = useAdminDetails();

  /** check if admin of an institute member is part of, send to public profile if not */
  if (isAdmin) {
    var adminInstituteIds = localAccount?.instituteAdmin.map((admin) => admin.institute.id) || [];
    var memberInstituteIds = member?.institutes.map((institute) => institute.instituteId) || [];
    var hasPermission = false;
    for (var a of adminInstituteIds) if (memberInstituteIds.includes(a)) hasPermission = true;
    if (!hasPermission)
      router.replace(PageRoutes.publicMemberProfile(id));
  }

  /** After saving changes via submit button - dependency of form's submit */
  const onSuccess = useCallback(
    (updatedMember: MemberPrivateInfo) => setMember(updatedMember),
    [setMember]
  );

  if (loading) return <CardSkeleton />;
  if (!member) return <Empty />;

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
        {member.account.first_name + " " + member.account.last_name}
      </Title>
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
    ...(localAccount && isAdmin
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
    ...(localAccount && isAdmin
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
    <Card title={header} bodyStyle={{ paddingTop: 0 }}>
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

export default PrivateMemberProfile;
