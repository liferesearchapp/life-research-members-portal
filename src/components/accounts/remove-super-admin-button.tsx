import Button from "antd/lib/button";
import Popconfirm from "antd/lib/popconfirm";
import { type Dispatch, type FC, type SetStateAction, useContext } from "react";
import type { AccountInfo } from "../../services/_types";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import updateAccountRemoveSuperAdmin from "../../services/update-account-remove-super-admin";

type Props = {
  account: AccountInfo;
  setAccount: Dispatch<SetStateAction<AccountInfo | null>>;
};

/**
 * Revokes another account's super admin privileges.
 *
 * Deliberately not offered on your own account: a super admin cannot demote themselves, and the
 * API refuses it, so showing the button would only produce an error. Another super admin can
 * always do it, and the last super admin cannot be demoted at all.
 */
const RemoveSuperAdminButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);
  const { localAccount } = useContext(ActiveAccountCtx);

  if (localAccount?.id === account.id) return null;

  async function submit() {
    const updatedAccount = await updateAccountRemoveSuperAdmin(account.id);
    if (updatedAccount) setAccount(updatedAccount);
  }

  const confirmMessage = en
    ? "Are you sure you want to revoke this account's super admin privileges? It will keep any institute administrator roles it holds."
    : "Voulez-vous vraiment révoquer les privilèges de super administrateur de ce compte? Il conservera les rôles d'administrateur d'institut qu'il détient.";

  return (
    <Popconfirm
      title={confirmMessage}
      onConfirm={submit}
      okText={en ? "Confirm" : "Confirmer"}
      okButtonProps={{ danger: true }}
      cancelText={en ? "Cancel" : "Annuler"}
    >
      <Button danger>
        {en
          ? "Revoke super admin privileges"
          : "Révoquer les privilèges de super administrateur"}
      </Button>
    </Popconfirm>
  );
};

export default RemoveSuperAdminButton;
