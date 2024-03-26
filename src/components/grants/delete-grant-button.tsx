// This component is a button that opens a modal to delete a grant.
// The modal contains a form that requires the user to confirm the grant name before deletion.

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
import type { GrantPrivateInfo } from "../../services/_types";
import Alert from "antd/lib/alert";
import Text from "antd/lib/typography/Text";
import deleteGrant from "../../services/delete-grant";
import { useRouter } from "next/router";
import PageRoutes from "../../routing/page-routes";
import Notification from "../../services/notifications/notification";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Data = { confirmation: string };
type Props = {
  grant: GrantPrivateInfo;
  setGrant: Dispatch<SetStateAction<GrantPrivateInfo | null>>;
  style?: CSSProperties;
};

const DeleteGrantButton: FC<Props> = ({ grant, setGrant, style }) => {
  const { en } = useContext(LanguageCtx);
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();
  const { institute } = useSelectedInstitute();

  const grantName = grant.title;

  async function submit() {
    const res = await deleteGrant(grant.id);
    if (res) {
      setModalOpen(false);
      if (institute)
        router.push(PageRoutes.allGrants(institute?.urlIdentifier));
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
        {en ? "Delete Grant" : "Supprimer la subvention"}
      </Button>
      <Modal
        title={
          (en ? "Delete Grant: " : "Supprimer la subvention : ") + grantName
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{
          htmlType: "submit",
          form: "delete-grant-form",
          danger: true,
        }}
        okText={en ? "Delete Grant" : "Supprimer la subvention"}
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
              ? "This action is irreversible, this grant will be permanently deleted. To confirm, input the grant's name."
              : "Cette action est irréversible, cette subvention sera définitivement supprimée. Pour confirmer, saisissez le nom de la subvention."
          }
          style={{ marginBottom: 16 }}
        ></Alert>
        <Form
          form={form}
          layout="vertical"
          id="delete-grant-form"
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            name="confirmation"
            label={
              <Text>
                {en ? "Type: " : "Tapez : "}
                <b>
                  <span style={{ color: "red" }}>{grantName}</span>
                </b>
                {" to confirm"}
              </Text>
            }
            validateFirst
            rules={[
              { required: true, message: "Required" },
              {
                validator: (_, v) =>
                  v === grantName
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

export default DeleteGrantButton;
