import { Dispatch, FC, SetStateAction, useContext } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { AccountInfo } from "../../services/_types";

import updateAccountGrantAdmin from "../../services/update-account-grant-admin";
import { Button, Popconfirm } from "antd";

type Props = { account: AccountInfo; setAccount: Dispatch<SetStateAction<AccountInfo | null>> };

const GrantAdminButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);

  async function submit() {
    const res = await updateAccountGrantAdmin(account.id);
    if (res) setAccount(res);
  }

  const confirmMessage = en
    ? "Are you sure you want to grant this account admin privileges?"
    : "Voulez-vous vraiment accorder des privilèges d'administrateur à ce compte ?";

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
