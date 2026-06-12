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
    ? "Are you sure you want to grant this account admin privileges for the currently selected institute? This will also add them as a member of this institute (a member profile is created if they don't have one)."
    : "Voulez-vous vraiment accorder des privilèges d'administrateur à ce compte pour l'institut actuellement sélectionné ? Cela l'ajoutera également en tant que membre de cet institut (un profil de membre est créé s'il n'en a pas).";

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
