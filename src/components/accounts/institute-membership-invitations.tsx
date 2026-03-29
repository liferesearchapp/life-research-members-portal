import Button from "antd/lib/button";
import Card from "antd/lib/card/Card";
import Space from "antd/lib/space";
import Typography from "antd/lib/typography";
import {
  type Dispatch,
  type FC,
  type SetStateAction,
  useContext,
  useMemo,
} from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import respondInstituteInvitation from "../../services/respond-institute-invitation";
import type { AccountInfo } from "../../services/_types";
import { isPendingInstituteMembershipInvitation } from "../../utils/institute-membership-invitations";

const { Text, Title } = Typography;

type Props = {
  account: AccountInfo;
  setAccount?: Dispatch<SetStateAction<AccountInfo | null>>;
  interactive?: boolean;
};

const InstituteMembershipInvitations: FC<Props> = ({
  account,
  setAccount,
  interactive = false,
}) => {
  const { en } = useContext(LanguageCtx);

  const pendingInvitations = useMemo(
    () =>
      [...account.receivedInstituteMembershipInvitations]
        .filter((invitation) =>
          isPendingInstituteMembershipInvitation(invitation.status)
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [account.receivedInstituteMembershipInvitations]
  );

  async function handleRespond(invitationId: number, action: "accept" | "reject") {
    if (!interactive || !setAccount) return;
    const updated = await respondInstituteInvitation(account.id, {
      invitationId,
      action,
    });
    if (updated) setAccount(updated);
  }

  if (pendingInvitations.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <Title level={4} style={{ marginBottom: 12 }}>
        {en ? "Pending Institute Invitations" : "Invitations d'institut en attente"}
      </Title>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {pendingInvitations.map((invitation) => (
          <Card key={invitation.id} size="small">
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <Text strong>
                {invitation.institute.name} ({invitation.institute.urlIdentifier})
              </Text>
              <Text type="secondary">
                {en ? "Invited by " : "Invitation envoyée par "}
                {invitation.invitedByAccount.first_name}{" "}
                {invitation.invitedByAccount.last_name}
              </Text>
              {invitation.note ? <Text>{invitation.note}</Text> : null}
              {interactive ? (
                <Space wrap>
                  <Button
                    type="primary"
                    onClick={() => handleRespond(invitation.id, "accept")}
                  >
                    {en ? "Accept Invitation" : "Accepter l'invitation"}
                  </Button>
                  <Button
                    danger
                    onClick={() => handleRespond(invitation.id, "reject")}
                  >
                    {en ? "Reject Invitation" : "Refuser l'invitation"}
                  </Button>
                </Space>
              ) : null}
            </Space>
          </Card>
        ))}
      </Space>
    </div>
  );
};

export default InstituteMembershipInvitations;
