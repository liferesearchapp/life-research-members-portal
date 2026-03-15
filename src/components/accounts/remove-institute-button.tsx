import useForm from "antd/lib/form/hooks/useForm";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";
import {
  type Dispatch,
  type FC,
  type SetStateAction,
  useContext,
  useState,
} from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { AccountInfo } from "../../services/_types";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import removeInstitute from "../../services/remove-institute"; // Assume this service function exists

const { Option } = Select;
type Data = { instituteId: number[] };
type Props = {
  account: AccountInfo;
  setAccount: Dispatch<SetStateAction<AccountInfo | null>>;
};

const RemoveInstituteButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();
  const { localAccount, loading } = useContext(ActiveAccountCtx);

  async function submit(data: Data) {
    const res = await removeInstitute(account.id, data);
    if (res) {
      setAccount(res);
      setModalOpen(false);
    }
  }

  return (
    <>
      <Button danger type="primary" onClick={() => setModalOpen(true)}>
        {en ? "Remove Institute" : "Retirer l'institut"}
      </Button>
      <Modal
        title={en ? "Remove Institute" : "Retirer l'institut"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ htmlType: "submit", form: "remove-institute-form" }}
        okText={en ? "Submit" : "Soumettre"}
        cancelButtonProps={{ danger: true }}
        cancelText={en ? "Cancel" : "Annuler"}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          id="remove-institute-form"
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            label={
              en
                ? "Select Institute to Remove"
                : "Sélectionnez l'institut à retirer"
            }
            name="instituteId"
          >
            <Select mode="multiple">
              {localAccount?.instituteAdmin.map((f) => (
                <Option key={f.institute.id} value={f.institute.id}>
                  {`${f.institute.name} - ${f.institute.urlIdentifier}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default RemoveInstituteButton;
