import Empty from "antd/lib/empty";
import Card from "antd/lib/card/Card";
import Title from "antd/lib/typography/Title";
import { type FC, useContext, useEffect } from "react";
import CardSkeleton from "../loading/card-skeleton";
import useAccount from "../../services/use-account";
import { LanguageCtx } from "../../services/context/language-ctx";
import Descriptions from "antd/lib/descriptions";
import CheckCircleTwoTone from "@ant-design/icons/lib/icons/CheckCircleTwoTone";
import CloseCircleTwoTone from "@ant-design/icons/lib/icons/CloseCircleTwoTone";
import Button from "antd/lib/button";
import { red } from "@ant-design/colors";
import SafeLink from "../link/safe-link";
import PageRoutes from "../../routing/page-routes";
import Text from "antd/lib/typography/Text";
import UpdateNameButton from "./update-name-button";
import UpdateEmailButton from "./update-email-button";
import RemoveAdminButton from "./remove-admin-button";
import GrantAdminButton from "./grant-admin-button";
import DeleteMemberButton from "./delete-member-button";
import RegisterMemberButton from "./register-member-button";
import DeleteAccountButton from "./delete-account-button";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";
import type { AccountInfo } from "../../services/_types";
import { Tag } from "antd";
import AddInstituteButton from "./add-institute-button";
import RemoveInstituteButton from "./remove-institute-button";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { isPendingInstituteMembershipInvitation } from "../../utils/institute-membership-invitations";
import GrantSuperAdminButton from "./grant-super-admin-button";
import { canManageMemberProfile } from "../../utils/front-end/member-access";

const { Item } = Descriptions;

type Props = {
  id: number;
};

const AccountProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { account, setAccount, loading, refresh } = useAccount(id);
  const { institute } = useSelectedInstitute();
  const { localAccount } = useContext(ActiveAccountCtx);
  /**
   * The same rule the member profile uses, from the same place, so the two cannot drift apart.
   *
   * Note the mapping of the third argument: once the account has loaded, an account with no member
   * record has *no* institutes -- an empty list, a definite answer -- while an account that has not
   * loaded yet is `undefined`, meaning "ask again later". Collapsing those two onto `[]` is what
   * made the member profile redirect institute admins away mid-load.
   *
   * Every use of this sits below the loading guard, so it resolves to a real answer by then. Using
   * the shared rule means that stays true even if the guard or the uses move.
   */
  const hasPermission =
    canManageMemberProfile({
      isSuperAdmin: !!localAccount?.is_super_admin,
      adminInstituteIds: localAccount?.instituteAdmin.map((admin) => admin.instituteId) || [],
      memberInstituteIds: account
        ? account.member?.institutes.map((institute) => institute.instituteId) ?? []
        : undefined,
    }) === true;

  const isAdminOfInstitute = (
    account: AccountInfo,
    instituteId: number | undefined
  ) => {
    return account.instituteAdmin.some(
      (admin) => admin.instituteId === instituteId
    );
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <CardSkeleton />;
  if (!account) return <Empty />;

  const header = (
    <div
      className="header"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: 20,
        rowGap: 10,
      }}
    >
      <Title level={2} style={{ display: "inline-block", margin: 0 }}>
        {account.first_name + " " + account.last_name}
      </Title>
      {hasPermission && (<UpdateNameButton account={account} setAccount={setAccount} />)}
    </div>
  );

  const loginItem = (
    <Item label={<>{en ? "Login Email" : "Compte courriel"}</>}>
      <a href={"mailto:" + account.login_email}>{account.login_email}</a>
      {hasPermission && (<UpdateEmailButton account={account} setAccount={setAccount} />)}
    </Item>
  );

  const lastLoginItem = (
    <Item label={en ? "Last Login" : "Dernière connexion"}>
      {account.last_login?.split("T")[0] ||
        (en
          ? "This account has never signed in"
          : "Ce compte ne s'est jamais connecté")}
    </Item>
  );

  const trueSymbol = (
    <CheckCircleTwoTone style={{ fontSize: 18, marginRight: 8 }} />
  );
  const falseSymbol = (
    <CloseCircleTwoTone
      style={{ fontSize: 18, marginRight: 8 }}
      twoToneColor={red[6]}
    />
  );

  const adminItem = (
    <Item label={en ? "Administrator Privileges" : "Privilèges administratifs"}>
      {isAdminOfInstitute(account, institute?.id) ? (
        <>
          <Text>
            {trueSymbol}
            {en
              ? "This account has administrative privileges for " +
                institute?.name
              : "Ce compte a des privilèges administratifs pour " +
                institute?.name}
          </Text>
          <RemoveAdminButton account={account} setAccount={setAccount} />
        </>
      ) : (
        <>
          <Text>
            {falseSymbol}
            {en
              ? "This account does not have administrative privileges for " +
                institute?.name
              : "Ce compte n'a pas de privilèges administratifs pour " +
                institute?.name}
          </Text>
          <GrantAdminButton account={account} setAccount={setAccount} />
        </>
      )}
    </Item>
  );

  const superAdminItem = localAccount?.is_super_admin ? (
    <Item
      label={
        en
          ? "Super Admin Privileges"
          : "Privilèges de super administrateur"
      }
    >
      {account.is_super_admin ? (
        <Text>
          {trueSymbol}
          {en
            ? "This account has super admin privileges."
            : "Ce compte possède des privilèges de super administrateur."}
        </Text>
      ) : (
        <>
          <Text>
            {falseSymbol}
            {en
              ? "This account does not have super admin privileges."
              : "Ce compte ne possède pas de privilèges de super administrateur."}
          </Text>
          <GrantSuperAdminButton account={account} setAccount={setAccount} />
        </>
      )}
    </Item>
  ) : null;

  var memberProfile = "";
  if (hasPermission) memberProfile = PageRoutes.privateMemberProfile(account.member?.id || 0);
  else memberProfile = PageRoutes.publicMemberProfile(account.member?.id || 0);
  const pendingInvitations = account.receivedInstituteMembershipInvitations.filter(
    (invitation) => isPendingInstituteMembershipInvitation(invitation.status)
  );
  const memberItem = (
    <Item label={en ? "Member Information" : "Informations sur les membres"}>
      {account.member ? (
        <>
          <Text>
            {trueSymbol}
            {en
              ? "This account has a member profile (see Institute Information below for per-institute membership)"
              : "Ce compte possède un profil de membre (voir Informations sur l'institut ci-dessous pour l'adhésion par institut)"}
          </Text>
          <Button ghost type="primary">
            <SafeLink
              href={memberProfile}
            >
              {en ? "Go to member profile" : "Accéder au profil du membre"}
            </SafeLink>
          </Button>
          {hasPermission && (<DeleteMemberButton account={account} setAccount={setAccount} />)}
        </>
      ) : (
        <>
          <Text>
            {falseSymbol}
            {en
              ? "This account does not have a member profile"
              : "Ce compte ne possède pas de profil de membre"}
          </Text>
          <div style={{ width: "100%" }} />
          <Text type="secondary">
            {en
              ? "They can create their own member profile from My Profile, or become a member by accepting an institute invitation."
              : "Ils peuvent créer leur propre profil de membre depuis Mon profil, ou devenir membre en acceptant une invitation d'institut."}
          </Text>
          {localAccount?.is_super_admin ? (
            <RegisterMemberButton account={account} setAccount={setAccount} />
          ) : null}
        </>
      )}
    </Item>
  );

  const addToMoreInstitutes = (
    <Item label={en ? "Institute Information" : "Informations sur l'institut"}>
      <>
        <Text>
          {account.member?.institutes.length ? trueSymbol : falseSymbol}
          {account.member?.institutes.length
            ? en
              ? "This account is part of the following institutes"
              : "Ce compte fait partie des instituts suivants"
            : en
            ? "This account is not yet a member of any institute"
            : "Ce compte ne fait encore partie d'aucun institut"}
        </Text>
        {account.member?.institutes.length
          ? account.member.institutes.map((institute) => (
              <Tag key={institute.instituteId}>
                {institute.institute.name} - {institute.institute.urlIdentifier}
              </Tag>
            ))
          : null}

        {pendingInvitations.length ? (
          <>
            <div style={{ width: "100%", height: 8 }} />
            <Text strong>
              {en ? "Pending invitations" : "Invitations en attente"}
            </Text>
            <div style={{ width: "100%", height: 4 }} />
            {pendingInvitations.map((invitation) => (
              <Tag color="gold" key={invitation.id}>
                {invitation.institute.name} - {invitation.institute.urlIdentifier}
              </Tag>
            ))}
          </>
        ) : null}

        <div style={{ width: "100%", height: 12 }} />
        <AddInstituteButton account={account} setAccount={setAccount} />
        {account.member?.institutes.length ? (
          <RemoveInstituteButton account={account} setAccount={setAccount} />
        ) : null}
      </>
    </Item>
  );

  return (
    <Card title={header} className="account-profile-card">
      <Descriptions
        layout="vertical"
        bordered
        column={1}
        styles={{
          content: {
            display: "flex",
            columnGap: 16,
            rowGap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          },
        }}
      >
        {lastLoginItem}
        {loginItem}
        {adminItem}
        {superAdminItem}
        {memberItem}
        {addToMoreInstitutes}
      </Descriptions>
      <div style={{ display: "block", height: 24 }}></div>
      {hasPermission && (<DeleteAccountButton
        account={account}
        setAccount={setAccount}
        style={{ marginLeft: "auto", display: "block" }}
      />)}
    </Card>
  );
};

export default AccountProfile;
