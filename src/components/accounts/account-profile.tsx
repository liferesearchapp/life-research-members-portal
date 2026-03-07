import { FC, useContext, useEffect } from "react";
import CardSkeleton from "../loading/card-skeleton";
import useAccount from "../../services/use-account";
import { LanguageCtx } from "../../services/context/language-ctx";
import { red } from "@ant-design/colors";
import SafeLink from "../link/safe-link";
import PageRoutes from "../../routing/page-routes";
import UpdateNameButton from "./update-name-button";
import UpdateEmailButton from "./update-email-button";
import RemoveAdminButton from "./remove-admin-button";
import GrantAdminButton from "./grant-admin-button";
import DeleteMemberButton from "./delete-member-button";
import RegisterMemberButton from "./register-member-button";
import DeleteAccountButton from "./delete-account-button";
import { Empty, Card, Typography, Descriptions, Button } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
const Title = Typography.Title;
const Text = Typography.Text;

const { Item } = Descriptions;

type Props = {
  id: number;
};

const AccountProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { account, setAccount, loading, refresh } = useAccount(id);

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
      <UpdateNameButton account={account} setAccount={setAccount} />
    </div>
  );

  const loginItem = (
    <Item label={<>{en ? "Login Email" : "Compte courriel"}</>}>
      <a href={"mailto:" + account.login_email}>{account.login_email}</a>
      <UpdateEmailButton account={account} setAccount={setAccount} />
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
      {account.is_admin ? (
        <>
          <Text>
            {trueSymbol}
            {en
              ? "This account has administrative privileges"
              : "Ce compte a des privilèges administratifs"}
          </Text>
          <RemoveAdminButton account={account} setAccount={setAccount} />
        </>
      ) : (
        <>
          <Text>
            {falseSymbol}
            {en
              ? "This account does not have administrative privileges"
              : "Ce compte n'a pas de privilèges administratifs"}
          </Text>
          <GrantAdminButton account={account} setAccount={setAccount} />
        </>
      )}
    </Item>
  );

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
              href={PageRoutes.privateMemberProfile(account.member?.id || 0)}
            >
              {en ? "Go to member profile" : "Accéder au profil du membre"}
            </SafeLink>
          </Button>
          <DeleteMemberButton account={account} setAccount={setAccount} />
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
      </Descriptions>
      <div style={{ display: "block", height: 24 }}></div>
      <DeleteAccountButton
        account={account}
        setAccount={setAccount}
        style={{ marginLeft: "auto", display: "block" }}
      />
    </Card>
  );
};

export default AccountProfile;
