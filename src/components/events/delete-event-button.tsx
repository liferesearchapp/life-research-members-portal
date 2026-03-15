// This is a modal button component that, when clicked, opens a modal to confirm the deletion of an event.
// The modal includes a form with an input field to confirm the deletion by typing the name of the event.

import {
  type CSSProperties,
  type Dispatch,
  type FC,
  type SetStateAction,
  useContext,
  useState,
} from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { EventPrivateInfo } from "../../services/_types";
import deleteEvent from "../../services/delete-event"; // Update the import statement
import { useRouter } from "next/router";
import PageRoutes from "../../routing/page-routes";
import Notification from "../../services/notifications/notification";
import { Button, Form, Input, Modal, Alert, Typography } from "antd";
const useForm = Form.useForm;
const Text = Typography.Text;

type Data = { confirmation: string };
type Props = {
  event: EventPrivateInfo;
  setEvent: Dispatch<SetStateAction<EventPrivateInfo | null>>;
  style?: CSSProperties;
};

const DeleteEventButton: FC<Props> = ({ event, setEvent, style }) => {
  const { en } = useContext(LanguageCtx);
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();

  const eventName = en ? event.name_en : event.name_fr;

  async function submit() {
    const res = await deleteEvent(event.id);
    if (res) {
      setModalOpen(false);
      router.push(PageRoutes.allEvents);
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
        styles={{ body: { paddingBottom: 0 } }}
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
