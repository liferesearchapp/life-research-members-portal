import useForm from "antd/lib/form/hooks/useForm";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import { type Dispatch, type FC, type SetStateAction, useContext, useState } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { AccountInfo } from "../../services/_types";
import updateAccountEmail from "../../services/update-account-email";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import Notification from "../../services/notifications/notification";

type Data = { login_email: string; confirm_email: string };
type Props = { account: AccountInfo; setAccount: Dispatch<SetStateAction<AccountInfo | null>> };

const UpdateEmailButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);
  const { localAccount } = useContext(ActiveAccountCtx);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();

  async function submit({ login_email }: Data) {
    const res = await updateAccountEmail(account.id, { login_email });
    if (res) {
      setAccount(res);
      setModalOpen(false);
    }
  }

  function openModal() {
    if (account.id === localAccount?.id)
      return new Notification().warning(
        en
          ? "Admins may not edit their own email. This prevents corrupting your own account."
          : "Les administrateurs ne peuvent pas modifier leur propre e-mail. Cela évite de corrompre votre propre compte."
      );
    setModalOpen(true);
  }

  return (
    <>
      <Button ghost type="primary" onClick={openModal}>
        {en ? "Change Email" : "Changer le courriel"}
      </Button>
      <Modal
        title={
          <>
            {en ? "Change Login Email: " : "Changer le courriel de connexion: "}
            {account.login_email}
          </>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ htmlType: "submit", form: "update-email-form" }}
        okText={en ? "Submit" : "Soumettre"}
        cancelButtonProps={{ danger: true }}
        cancelText={en ? "Cancel" : "Annuler"}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          id="update-email-form"
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            label={en ? "New Email" : "Nouveau courriel"}
            name="login_email"
            rules={[
              { required: true, message: en ? "Required" : "Requis" },
              { type: "email", message: en ? "Invalid Email" : "Courriel invalide" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={en ? "Confirm Email" : "Confirmer courriel"}
            name="confirm_email"
            validateFirst={true}
            rules={[
              { required: true, message: en ? "Required" : "Requis" },
              { type: "email", message: en ? "Invalid Email" : "Courriel invalide" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue("login_email") === value) return Promise.resolve();
                  return Promise.reject(
                    new Error(en ? "Emails do not match" : "Les courriels ne correspondent pas")
                  );
                },
              }),
            ]}
            dependencies={["login_email"]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UpdateEmailButton;
