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

const { Option } = Select;
type Data = { institutes: string[] };
type Props = {
  account: AccountInfo;
  setAccount: Dispatch<SetStateAction<AccountInfo | null>>;
};

const UpdateInstituteButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();
  const { localAccount, loading } = useContext(ActiveAccountCtx);

  const initialValues = {
    institutes: account.member?.institutes
      ? account.member.institutes.map((i) => i.institute.id)
      : [],
  };

  //   useEffect(() => {
  //     if (!modalOpen || !form.getFieldsValue()) return;
  //     form.setFieldsValue({ institutes: account.institutes });
  //   }, [form, account, modalOpen]);

  //TODO: Fix This if/when used
  async function submit(data: Data) {
    const res = "";//await updateInstituteName(account.id, data);
    if (res) {
      setAccount(res);
      setModalOpen(false);
    }
  }

  return (
    <>
      <Button ghost type="primary" onClick={() => setModalOpen(true)}>
        {en ? "Change Institute" : "Changer d'institut"}
      </Button>
      <Modal
        title={en ? "Change Institute: " : "Changer d'institut: "}
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
            name="institutes"
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

export default UpdateInstituteButton;
