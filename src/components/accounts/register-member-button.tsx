import Button from "antd/lib/button";
import { type Dispatch, type FC, type SetStateAction, useContext } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { AccountInfo } from "../../services/_types";
import Popconfirm from "antd/lib/popconfirm";
import updateAccountRegisterMember from "../../services/update-account-register-member";

type Props = { account: AccountInfo; setAccount: Dispatch<SetStateAction<AccountInfo | null>> };

const RegisterMemberButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);

  async function submit() {
    const res = await updateAccountRegisterMember(account.id);
    if (res) setAccount(res);
  }

  const confirmMessage = en
    ? "Are you sure you want to register this account as a member?"
    : "Êtes-vous sûr de vouloir enregistrer ce compte en tant que membre ?";

  return (
    <>
      <Popconfirm
        title={confirmMessage}
        onConfirm={submit}
        okText={en ? "Confirm" : "Confirmer"}
        cancelButtonProps={{ danger: true }}
        cancelText={en ? "Cancel" : "Annuler"}
      >
        <Button ghost type="primary">
          {en ? "Register as member" : "Inscrivez en tant que membre"}
        </Button>
      </Popconfirm>
    </>
  );
};

export default RegisterMemberButton;
