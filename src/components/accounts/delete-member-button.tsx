import useForm from "antd/lib/form/hooks/useForm";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import { type Dispatch, type FC, type SetStateAction, useContext, useState } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { AccountInfo } from "../../services/_types";
import updateAccountDeleteMember from "../../services/update-account-delete-member";
import Alert from "antd/lib/alert";
import Text from "antd/lib/typography/Text";

type Data = { confirmation: string };
type Props = { account: AccountInfo; setAccount: Dispatch<SetStateAction<AccountInfo | null>> };

const DeleteMemberButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();

  const memberName = account.first_name + " " + account.last_name;

  async function submit() {
    const res = await updateAccountDeleteMember(account.id);
    if (res) {
      setAccount(res);
      setModalOpen(false);
    }
  }

  return (
    <>
      <Button danger type="primary" onClick={() => setModalOpen(true)}>
        {en ? "Delete member info" : "Supprimer info membre"}
      </Button>
      <Modal
        title={(en ? "Delete member info: " : "Supprimer info membre : ") + memberName}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ htmlType: "submit", form: "delete-member-form", danger: true }}
        okText={en ? "Delete member info" : "Supprimer info membre"}
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
              ? "This action is irreversible, all of this account's member information will be lost permanently. To confirm, input the member's full name."
              : "Cette action est irréversible, toutes les informations de membre de ce compte seront définitivement perdues. Pour confirmer, saisissez le nom complet du membre."
          }
          style={{ marginBottom: 16 }}
        ></Alert>
        <Form
          form={form}
          layout="vertical"
          id="delete-member-form"
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
              { required: true, message: "Required" },
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

export default DeleteMemberButton;
