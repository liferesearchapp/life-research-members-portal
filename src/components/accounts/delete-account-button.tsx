import useForm from "antd/lib/form/hooks/useForm";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import { CSSProperties, type Dispatch, type FC, type SetStateAction, useContext, useState } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { AccountInfo } from "../../services/_types";
import Alert from "antd/lib/alert";
import Text from "antd/lib/typography/Text";
import deleteAccount from "../../services/delete-account";
import { useRouter } from "next/router";
import PageRoutes from "../../routing/page-routes";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import Notification from "../../services/notifications/notification";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Data = { confirmation: string };
type Props = {
  account: AccountInfo;
  setAccount: Dispatch<SetStateAction<AccountInfo | null>>;
  style?: CSSProperties;
};

const DeleteAccountButton: FC<Props> = ({ account, setAccount, style }) => {
  const { en } = useContext(LanguageCtx);
  const { localAccount } = useContext(ActiveAccountCtx);
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();
  const { institute } = useSelectedInstitute();
  const urlIdentifier = institute?.urlIdentifier;

  const memberName = account.first_name + " " + account.last_name;

  async function submit() {
    const res = await deleteAccount(account.id);
    if (res && urlIdentifier) {
      setModalOpen(false);
      router.push(PageRoutes.allAccounts(urlIdentifier));
    }
  }

  function openModal() {
    if (account.id === localAccount?.id)
      return new Notification().warning(
        en
          ? "Admins may not delete themselves. This ensures there is always at least one admin."
          : "Les administrateurs ne peuvent pas se supprimer eux-mêmes. Cela garantit qu'il y a toujours au moins un administrateur."
      );
    setModalOpen(true);
  }

  return (
    <>
      <Button danger type="primary" size="large" onClick={openModal} style={style}>
        {en ? "Delete Account" : "Supprimer le compte"}
      </Button>
      <Modal
        title={(en ? "Delete Account: " : "Supprimer le compte : ") + memberName}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ htmlType: "submit", form: "delete-account-form", danger: true }}
        okText={en ? "Delete Account" : "Supprimer le compte"}
        cancelButtonProps={{ danger: true }}
        cancelText={en ? "Cancel" : "Annuler"}
        destroyOnClose
        bodyStyle={{ paddingBottom: 0 }}
      >
        <Alert
          showIcon
          type="warning"
          message={en ? "Warning!" : "Avertissement !"}
          description={
            en
              ? "This action is irreversible, this account will be permanently deleted along with all associated member information. To confirm, input the account owner's full name."
              : "Cette action est irréversible, ce compte sera définitivement supprimé ainsi que toutes les informations de membre associées. Pour confirmer, saisissez le nom complet du propriétaire du compte."
          }
          style={{ marginBottom: 16 }}
        ></Alert>
        <Form
          form={form}
          layout="vertical"
          id="delete-account-form"
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            name="confirmation"
            label={
              <Text>
                {en ? "Type " : "Tapez "}
                <b>{account.first_name + " " + account.last_name}</b>
                {" to confirm"}
              </Text>
            }
            validateFirst
            rules={[
              { required: true, message: en ? "Required" : "Requis" },
              {
                validator: (_, v) =>
                  v === memberName
                    ? Promise.resolve()
                    : Promise.reject(en ? "Incorrect" : "Incorrect"),
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DeleteAccountButton;
