import { Dispatch, FC, SetStateAction, useContext, useState } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { AccountInfo } from "../../services/_types";
import updateAccountRemoveAdmin from "../../services/update-account-remove-admin";

import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import Notification from "../../services/notifications/notification";
import { Button, Popconfirm } from "antd";

type Props = { account: AccountInfo; setAccount: Dispatch<SetStateAction<AccountInfo | null>> };

const RemoveAdminButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);
  const { localAccount } = useContext(ActiveAccountCtx);
  const [popconfirmOpen, setPopconfirmOpen] = useState(false);

  async function submit() {
    const res = await updateAccountRemoveAdmin(account.id);
    if (res) setAccount(res);
  }

  function openPopconfirm() {
    if (account.id === localAccount?.id)
      return new Notification().warning(
        en
          ? "Admins may not remove their own admin permission. This ensures there is always at least one admin."
          : "Les administrateurs ne peuvent pas supprimer leur propre autorisation d'administrateur. Cela garantit qu'il y a toujours au moins un administrateur."
      );
    setPopconfirmOpen(true);
  }

  const confirmMessage = en
    ? "Are you sure you want to remove this account's admin privileges?"
    : "Voulez-vous vraiment supprimer les privilèges d'administrateur de ce compte ?";

  return (
    <>
      <Popconfirm
        open={popconfirmOpen}
        onOpenChange={openPopconfirm}
        onCancel={() => setPopconfirmOpen(false)}
        title={confirmMessage}
        onConfirm={submit}
        okText={en ? "Confirm" : "Confirmer"}
        cancelButtonProps={{ danger: true }}
        cancelText={en ? "Cancel" : "Annuler"}
      >
        <Button danger type="primary">
          {en ? "Remove admin privileges" : "Supprimer privilèges d'admin"}
        </Button>
      </Popconfirm>
    </>
  );
};

export default RemoveAdminButton;
