import Button from "antd/lib/button";
import { type Dispatch, type FC, type SetStateAction, useContext } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { AccountInfo } from "../../services/_types";
import Popconfirm from "antd/lib/popconfirm";
import updateAccountGrantAdmin from "../../services/update-account-grant-admin";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Props = {
  account: AccountInfo;
  setAccount: Dispatch<SetStateAction<AccountInfo | null>>;
};

const GrantAdminButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();

  async function submit() {
    const res =
      institute &&
      (await updateAccountGrantAdmin(account.id, institute.urlIdentifier));
    if (res) setAccount(res);
  }

  const confirmMessage = en
    ? "Are you sure you want to grant this account admin privileges? This will grant admin access for current selected institute!"
    : "Voulez-vous vraiment accorder des privilèges d'administrateur à ce compte ? Cela accordera l'accès administrateur pour l'institut actuellement sélectionné !";

  return (
    <>
      <Popconfirm
        title={confirmMessage}
        onConfirm={submit}
        okText={en ? "Confirm" : "Confirmer"}
        cancelButtonProps={{ danger: true }}
        cancelText={en ? "Cancel" : "Annuler"}
      >
        <Button type="primary">
          {en ? "Grant admin privileges" : "Accorder privilèges d'admin"}
        </Button>
      </Popconfirm>
    </>
  );
};

export default GrantAdminButton;
