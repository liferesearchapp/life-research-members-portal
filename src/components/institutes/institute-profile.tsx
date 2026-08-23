import Empty from "antd/lib/empty";
import Button from "antd/lib/button";
import Card from "antd/lib/card/Card";
import Title from "antd/lib/typography/Title";
import { FC, useCallback, useContext, useState } from "react";
import CardSkeleton from "../loading/card-skeleton";
import useInstituteInfo from "../../services/use-institute-info";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { InstituteInfo } from "../../services/_types";
import InstituteDescription from "./institute-description";
import InstituteForm from "./institute-form";
import { SaveChangesCtx } from "../../services/context/save-changes-ctx";
import { InstituteSelectorCtx } from "../../services/context/institute-selector-ctx";
import { MemberInstituteCtx } from "../../services/context/member-institutes-ctx";
import {
  useAdminDetails,
  useSelectedInstitute,
  useSuperAdminDetails,
} from "../../services/context/selected-institute-ctx";
import { getLocalizedInstituteName } from "../../utils/front-end/institute-branding";

type Props = {
  id: number;
};

const InstituteProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { institute, setInstitute: setLoadedInstitute, loading } =
    useInstituteInfo(id);
  const [editMode, setEditMode] = useState(false);
  const { saveChangesPrompt } = useContext(SaveChangesCtx);
  const { refresh: refreshInstituteSelector } =
    useContext(InstituteSelectorCtx);
  const { refresh: refreshMemberInstitutes } = useContext(MemberInstituteCtx);
  const { institute: selectedInstitute, setInstitute: setSelectedInstitute } =
    useSelectedInstitute();
  const isAdmin = useAdminDetails();
  const isSuperAdmin = useSuperAdminDetails();
  const canManageInstitute = !!isAdmin || !!isSuperAdmin;

  /** After saving changes via submit button - dependency of form's submit */
  const onSuccess = useCallback(
    (updatedInstitute: InstituteInfo) => {
      setLoadedInstitute(updatedInstitute);
      if (selectedInstitute?.id === updatedInstitute.id) {
        setSelectedInstitute(updatedInstitute);
      }
      refreshInstituteSelector();
      refreshMemberInstitutes();
    },
    [
      refreshInstituteSelector,
      refreshMemberInstitutes,
      selectedInstitute?.id,
      setLoadedInstitute,
      setSelectedInstitute,
    ]
  );

  if (loading) return <CardSkeleton />;
  if (!institute) return <Empty />;

  /** When clicking cancel - prompt to save changes if dirty */
  function onCancel() {
    saveChangesPrompt({ onSuccessOrDiscard: () => setEditMode(false) });
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
        {getLocalizedInstituteName(institute, en)}
      </Title>
      {canManageInstitute ? (editMode ? doneButton : editButton) : null}
    </div>
  );

  const form = <InstituteForm institute={institute} onSuccess={onSuccess}/>
  const description = <InstituteDescription institute={institute}/>

  return (
    <Card title={header} styles={{ body: { paddingTop: 0 } }}>
      {canManageInstitute && editMode ? form : description}
    </Card>
  );
};

export default InstituteProfile;
