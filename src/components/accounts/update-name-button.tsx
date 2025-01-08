import useForm from "antd/lib/form/hooks/useForm";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import { type Dispatch, type FC, type SetStateAction, useContext, useEffect, useState } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { AccountInfo } from "../../services/_types";
import updateAccountName from "../../services/update-account-name";

type Data = { first_name: string; last_name: string };
type Props = { account: AccountInfo; setAccount: Dispatch<SetStateAction<AccountInfo | null>> };

const UpdateNameButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();

  useEffect(() => {
    if (!modalOpen || !form.getFieldsValue()) return;
    form.setFieldsValue(account);
  }, [form, account, modalOpen]);

  async function submit(data: Data) {
    const res = await updateAccountName(account.id, data);
    if (res) {
      setAccount(res);
      setModalOpen(false);
    }
  }

  return (
    <>
      <Button ghost type="primary" onClick={() => setModalOpen(true)}>
        {en ? "Change Name" : "Changer de nom"}
      </Button>
      <Modal
        title={
          (en ? "Change Name: " : "Changer de nom: ") + account.first_name + " " + account.last_name
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ htmlType: "submit", form: "update-name-form" }}
        okText={en ? "Submit" : "Soumettre"}
        cancelButtonProps={{ danger: true }}
        cancelText={en ? "Cancel" : "Annuler"}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          id="update-name-form"
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            name="first_name"
            label={en ? "First Name" : "Prénom"}
            rules={[{ required: true, message: "Required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="last_name"
            label={en ? "Last Name" : "Nom de famille"}
            rules={[{ required: true, message: "Required" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UpdateNameButton;
