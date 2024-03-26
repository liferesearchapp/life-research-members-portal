/*
This component allows an admin user to delete a partner from the system. 
The component displays a confirmation modal when the delete button is clicked, and verifies that the user has entered the correct name of the partner before proceeding with the deletion. 
The deletion is performed using the deletePartner service, and the user is redirected to the all partners page upon successful deletion.
*/

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
import type { PartnerPrivateInfo } from "../../services/_types";
import Alert from "antd/lib/alert";
import Text from "antd/lib/typography/Text";
import deletePartner from "../../services/delete-partner"; // Update the import statement
import { useRouter } from "next/router";
import PageRoutes from "../../routing/page-routes";
import Notification from "../../services/notifications/notification";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Data = { confirmation: string };
type Props = {
  partner: PartnerPrivateInfo;
  setPartner: Dispatch<SetStateAction<PartnerPrivateInfo | null>>;
  style?: CSSProperties;
};

const DeletePartnerButton: FC<Props> = ({ partner, setPartner, style }) => {
  const { en } = useContext(LanguageCtx);
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();
  const { institute } = useSelectedInstitute();

  const partnerName = en ? partner.name_en : partner.name_fr;

  async function submit() {
    const res = await deletePartner(partner.id);
    if (res) {
      setModalOpen(false);
      if (institute?.urlIdentifier)
        router.push(PageRoutes.allPartners(institute?.urlIdentifier));
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
        {en ? "Delete Partner" : "Supprimer le partenaire"}
      </Button>
      <Modal
        title={
          (en ? "Delete Partner: " : "Supprimer le partenaire : ") + partnerName
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{
          htmlType: "submit",
          form: "delete-partner-form",
          danger: true,
        }}
        okText={en ? "Delete Partner" : "Supprimer le partenaire"}
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
              ? "This action is irreversible, this partner will be permanently deleted. To confirm, input the partner's name."
              : "Cette action est irréversible, ce partenaire sera définitivement supprimé. Pour confirmer, saisissez le nom du partenaire."
          }
          style={{ marginBottom: 16 }}
        ></Alert>
        <Form
          form={form}
          layout="vertical"
          id="delete-partner-form"
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            name="confirmation"
            label={
              <Text>
                {en ? "Type: " : "Tapez : "}
                <b>{partnerName}</b>
                {" to confirm"}
              </Text>
            }
            validateFirst
            rules={[
              { required: true, message: en ? "Required" : "Requis" },
              {
                validator: (_, v) =>
                  v === partnerName
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

export default DeletePartnerButton;
