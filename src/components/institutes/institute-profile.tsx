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

type Props = {
  id: number;
};

const InstituteProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { institute, setInstitute, loading } = useInstituteInfo(id);
  const [editMode, setEditMode] = useState(false);
  const { saveChangesPrompt } = useContext(SaveChangesCtx);

  /** After saving changes via submit button - dependency of form's submit */
  const onSuccess = useCallback(
    (updatedInstitute: InstituteInfo) => setInstitute(updatedInstitute),
    [setInstitute]
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
        {institute?.name}
      </Title>
      {editMode ? doneButton : editButton}
    </div>
  );

  const form = <InstituteForm institute={institute} onSuccess={onSuccess}/>
  const description = <InstituteDescription institute={institute}/>

  return (
    <Card title={header} bodyStyle={{ paddingTop: 0 }}>
      {editMode ? form : description}
    </Card>
  );
};

export default InstituteProfile;