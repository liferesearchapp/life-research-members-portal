import Button from "antd/lib/button";
import Popconfirm from "antd/lib/popconfirm";
import { type Dispatch, type FC, type SetStateAction, useContext } from "react";
import type { AccountInfo } from "../../services/_types";
import { LanguageCtx } from "../../services/context/language-ctx";
import updateAccountGrantSuperAdmin from "../../services/update-account-grant-super-admin";

type Props = {
  account: AccountInfo;
  setAccount: Dispatch<SetStateAction<AccountInfo | null>>;
};

const GrantSuperAdminButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);

  async function submit() {
    const updatedAccount = await updateAccountGrantSuperAdmin(account.id);
    if (updatedAccount) setAccount(updatedAccount);
  }

  const confirmMessage = en
    ? "Are you sure you want to grant this account super admin privileges? This gives access to manage every institute and account."
    : "Voulez-vous vraiment accorder à ce compte des privilèges de super administrateur? Cela lui donnera accès à la gestion de tous les instituts et comptes.";

  return (
    <Popconfirm
      title={confirmMessage}
      onConfirm={submit}
      okText={en ? "Confirm" : "Confirmer"}
      cancelButtonProps={{ danger: true }}
      cancelText={en ? "Cancel" : "Annuler"}
    >
      <Button type="primary">
        {en
          ? "Grant super admin privileges"
          : "Accorder les privilèges de super administrateur"}
      </Button>
    </Popconfirm>
  );
};

export default GrantSuperAdminButton;
