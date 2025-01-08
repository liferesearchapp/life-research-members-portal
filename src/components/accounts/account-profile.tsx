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

const { Item } = Descriptions;

type Props = {
  id: number;
};

const AccountProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { account, setAccount, loading, refresh } = useAccount(id);
  const { institute } = useSelectedInstitute();
  const { localAccount } = useContext(ActiveAccountCtx);
  var hasPermission = false;

  if (localAccount?.is_super_admin) hasPermission = true;
  var permissions = localAccount?.instituteAdmin.map((admin) => admin.instituteId) || [];
  var memberInstituteIds = account?.member?.institutes.map((institute) => institute.instituteId) || [];
  for (var a of permissions) {
    if (memberInstituteIds.includes(a)) {
      hasPermission = true;
      break;
    }
  }

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

  var memberProfile = "";
  if (hasPermission) memberProfile = PageRoutes.privateMemberProfile(account.member?.id || 0);
  else memberProfile = PageRoutes.publicMemberProfile(account.member?.id || 0);
  const memberItem = (
    <Item label={en ? "Member Information" : "Informations sur les membres"}>
      {account.member ? (
        <>
          <Text>
            {trueSymbol}
            {en
              ? "This account is registered as a member"
              : "Ce compte est enregistré en tant que membre"}
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
              ? "This account is not registered as a member"
              : "Ce compte n'est pas enregistré en tant que membre"}
          </Text>
          <RegisterMemberButton account={account} setAccount={setAccount} />
        </>
      )}
    </Item>
  );

  const addToMoreInstitutes = (
    <Item label={en ? "Institute Information" : "Informations sur les membres"}>
      {account.member?.institutes ? (
        <>
          <Text>
            {trueSymbol}
            {en
              ? "This account is part of following institutes"
              : "Ce compte est enregistré en tant que membre"}
          </Text>
          {account.member.institutes.map((institute) => {
            return (
              <Tag key={institute.instituteId}>
                {institute.institute.name} - {institute.institute.urlIdentifier}{" "}
              </Tag>
            );
          })}
          <AddInstituteButton account={account} setAccount={setAccount} />
          <RemoveInstituteButton account={account} setAccount={setAccount} />
        </>
      ) : (
        <>
          <Text>
            {falseSymbol}
            {en
              ? "This account is not registered as a member"
              : "Ce compte n'est pas enregistré en tant que membre"}
          </Text>
          <RegisterMemberButton account={account} setAccount={setAccount} />
        </>
      )}
    </Item>
  );

  return (
    <Card title={header} className="account-profile-card">
      <Descriptions
        layout="vertical"
        bordered
        column={1}
        contentStyle={{
          display: "flex",
          columnGap: 16,
          rowGap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {lastLoginItem}
        {loginItem}
        {adminItem}
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
