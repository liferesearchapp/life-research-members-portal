// This component is a button that opens a modal to delete a supervision.
// The modal contains a form that requires the user to confirm the supervision trainee name before deletion.

import Button from "antd/lib/button";
import Form from "antd/lib/form";
import useForm from "antd/lib/form/hooks/useForm";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import {
  CSSProperties,
  Dispatch,
  FC,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { SupervisionPrivateInfo } from "../../services/_types";
import Alert from "antd/lib/alert";
import Text from "antd/lib/typography/Text";
import deleteSupervision from "../../services/delete-supervision";
import { useRouter } from "next/router";
import PageRoutes from "../../routing/page-routes";
import Notification from "../../services/notifications/notification";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx"; // Add this import
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Data = { confirmation: string };
type Props = {
  supervision: SupervisionPrivateInfo;
  setSupervision: Dispatch<SetStateAction<SupervisionPrivateInfo | null>>;
  style?: CSSProperties;
};

const DeleteSupervisionButton: FC<Props> = ({
  supervision,
  setSupervision,
  style,
}) => {
  const { en } = useContext(LanguageCtx);
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();
  const { institute } = useSelectedInstitute();

  const supervisionName = supervision.first_name + " " + supervision.last_name;
  const { localAccount } = useContext(ActiveAccountCtx);

  async function submit() {
    const res = await deleteSupervision(supervision.id);
    if (res) {
      setModalOpen(false);
      if (localAccount?.is_admin) {
        router.push(PageRoutes.allSupervisions(institute?.urlIdentifier || ""));
      } else {
        router.push(PageRoutes.myProfile);
      }
    }
  }

  function openModal() {
    setModalOpen(true);
  }

  return (
    <>
      <Button
        danger
        type="primary"
        size="large"
        onClick={openModal}
        style={style}
      >
        {en ? "Delete Supervision" : "Supprimer la supervision"}
      </Button>
      <Modal
        title={
          (en ? "Delete Supervision: " : "Supprimer la supervision : ") +
          supervisionName
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{
          htmlType: "submit",
          form: "delete-supervision-form",
          danger: true,
        }}
        okText={en ? "Delete Supervision" : "Supprimer la supervision"}
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
              ? "This action is irreversible; this supervision will be permanently deleted. To confirm, input the following name."
              : "Cette action est irréversible; cette supervision sera définitivement supprimée. Pour confirmer, saisissez le nom suivant."
          }
          style={{ marginBottom: 16 }}
        ></Alert>
        <Form
          form={form}
          layout="vertical"
          id="delete-supervision-form"
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            name="confirmation"
            label={
              <Text>
                {en ? "Type: " : "Tapez : "}
                <b>
                  <span style={{ color: "red" }}>{supervisionName}</span>
                </b>
                {" to confirm"}
              </Text>
            }
            validateFirst
            rules={[
              { required: true, message: "Required" },
              {
                validator: (_, v) =>
                  v === supervisionName
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

export default DeleteSupervisionButton;
