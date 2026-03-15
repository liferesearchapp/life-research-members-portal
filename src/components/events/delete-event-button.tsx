// This is a modal button component that, when clicked, opens a modal to confirm the deletion of an event.
// The modal includes a form with an input field to confirm the deletion by typing the name of the event.

import Button from "antd/lib/button";
import Form from "antd/lib/form";
import useForm from "antd/lib/form/hooks/useForm";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import {
  CSSProperties,
  type Dispatch,
  type FC,
  type SetStateAction,
  useContext,
  useState,
} from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { EventPrivateInfo } from "../../services/_types";
import Alert from "antd/lib/alert";
import Text from "antd/lib/typography/Text";
import deleteEvent from "../../services/delete-event"; // Update the import statement
import { useRouter } from "next/router";
import PageRoutes from "../../routing/page-routes";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Data = { confirmation: string };
type Props = {
  event: EventPrivateInfo;
  setEvent: Dispatch<SetStateAction<EventPrivateInfo | null>>;
  style?: CSSProperties;
};

const DeleteEventButton: FC<Props> = ({ event, setEvent, style }) => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();

  const eventName = en ? event.name_en : event.name_fr;

  async function submit() {
    const res = await deleteEvent(event.id);
    if (res && institute?.urlIdentifier) {
      setModalOpen(false);
      router.push(PageRoutes.allEvents(institute?.urlIdentifier));
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
        {en ? "Delete Event" : "Supprimer l'événement"}
      </Button>
      <Modal
        title={(en ? "Delete Event: " : "Supprimer l'événement : ") + eventName}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{
          htmlType: "submit",
          form: "delete-event-form",
          danger: true,
        }}
        okText={en ? "Delete Event" : "Supprimer l'événement"}
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
              ? "This action is irreversible, this event will be permanently deleted. To confirm, input the event's name."
              : "Cette action est irréversible, cet événement sera définitivement supprimé. Pour confirmer, saisissez le nom de l'événement."
          }
          style={{ marginBottom: 16 }}
        ></Alert>
        <Form
          form={form}
          layout="vertical"
          id="delete-event-form"
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            name="confirmation"
            label={
              <Text>
                {en ? "Type: " : "Tapez : "}
                <b>
                  <span style={{ color: "red" }}>{eventName}</span>
                </b>
                {" to confirm"}
              </Text>
            }
            validateFirst
            rules={[
              { required: true, message: "Required" },
              {
                validator: (_, v) =>
                  v === eventName
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

export default DeleteEventButton;
