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
import addInstitute from "../../services/add-institute";

const { Option } = Select;
type Data = { instituteId: number[] };
type Props = {
  account: AccountInfo;
  setAccount: Dispatch<SetStateAction<AccountInfo | null>>;
};

const AddInstituteButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();
  const { localAccount, loading } = useContext(ActiveAccountCtx);

  // Extract IDs of institutes where the localAccount is an admin
  const adminInstituteIds =
    localAccount?.instituteAdmin.map((admin) => admin.institute.id) || [];

  // Filter the account.member.institutes to include only those that match the adminInstituteIds
  const initialInstitutes =
    account.member?.institutes
      .filter((inst) => adminInstituteIds.includes(inst.institute.id))
      .map((inst) => inst.institute.id) || [];

  const initialValues = { instituteId: initialInstitutes };

  async function submit(data: Data) {
    const res = await addInstitute(account.id, data);
    if (res) {
      setAccount(res);
      setModalOpen(false);
    }
  }

  return (
    <>
      <Button ghost type="primary" onClick={() => setModalOpen(true)}>
        {en ? "Add Institute" : "Ajouter l'institut"}
      </Button>
      <Modal
        title={en ? "Add Institute: " : "Ajouter l'institut:"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ htmlType: "submit", form: "update-institute-form" }}
        okText={en ? "Submit" : "Soumettre"}
        cancelButtonProps={{ danger: true }}
        cancelText={en ? "Cancel" : "Annuler"}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          id="update-institute-form"
          initialValues={initialValues}
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            label={en ? "Select Institute" : "Sélectionnez l'institut"}
            name="instituteId"
          >
            <Select mode="multiple">
              <Option value="">{""}</Option>
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

export default AddInstituteButton;
