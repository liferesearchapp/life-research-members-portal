import useForm from "antd/lib/form/hooks/useForm";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";
import {
  type Dispatch,
  type FC,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { AccountInfo } from "../../services/_types";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import addInstitute from "../../services/add-institute";
import { isPendingInstituteMembershipInvitation } from "../../utils/institute-membership-invitations";

const { Option } = Select;
type Data = { instituteId: number[]; note?: string };
type Props = {
  account: AccountInfo;
  setAccount: Dispatch<SetStateAction<AccountInfo | null>>;
};

const AddInstituteButton: FC<Props> = ({ account, setAccount }) => {
  const { en } = useContext(LanguageCtx);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();
  const { localAccount } = useContext(ActiveAccountCtx);

  // Extract IDs of institutes where the localAccount is an admin
  const adminInstituteIds =
    localAccount?.instituteAdmin.map((admin) => admin.institute.id) || [];

  const activeInstituteIds = useMemo(
    () => new Set(account.member?.institutes.map((inst) => inst.institute.id) || []),
    [account.member?.institutes]
  );
  const pendingInstituteIds = useMemo(
    () =>
      new Set(
        account.receivedInstituteMembershipInvitations
          .filter((invitation) =>
            isPendingInstituteMembershipInvitation(invitation.status)
          )
          .map((invitation) => invitation.institute.id)
      ),
    [account.receivedInstituteMembershipInvitations]
  );

  const inviteOptions = useMemo(
    () =>
      (localAccount?.instituteAdmin || []).filter(
        (admin) =>
          !activeInstituteIds.has(admin.institute.id) &&
          !pendingInstituteIds.has(admin.institute.id)
      ),
    [activeInstituteIds, localAccount?.instituteAdmin, pendingInstituteIds]
  );

  async function submit(data: Data) {
    const res = await addInstitute(account.id, data);
    if (res) {
      setAccount(res);
      setModalOpen(false);
    }
  }

  return (
    <>
      <Button
        ghost
        type="primary"
        onClick={() => setModalOpen(true)}
        disabled={inviteOptions.length === 0}
      >
        {en ? "Invite to Institute" : "Inviter à l'institut"}
      </Button>
      <Modal
        title={en ? "Invite to Institute" : "Inviter à l'institut"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ htmlType: "submit", form: "update-institute-form" }}
        okText={en ? "Send Invitation" : "Envoyer l'invitation"}
        cancelButtonProps={{ danger: true }}
        cancelText={en ? "Cancel" : "Annuler"}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          id="update-institute-form"
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            label={en ? "Select Institute" : "Sélectionnez l'institut"}
            name="instituteId"
          >
            <Select mode="multiple">
              {inviteOptions.map((f) => (
                <Option key={f.institute.id} value={f.institute.id}>
                  {`${f.institute.name} - ${f.institute.urlIdentifier}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label={en ? "Invitation note (optional)" : "Note d'invitation (facultative)"}
            name="note"
          >
            <Input.TextArea
              rows={3}
              placeholder={
                en
                  ? "Add context for the invited account."
                  : "Ajoutez un contexte pour le compte invité."
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddInstituteButton;
