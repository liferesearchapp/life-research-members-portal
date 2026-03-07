import { FC, useContext } from "react";
import LogoutButton from "./logout-button";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import LoginButton from "./login-button";
import { useMsal } from "@azure/msal-react";
import { Dropdown, Typography, Card } from "antd";
import { CheckCircleTwoTone } from "@ant-design/icons";

const AvatarMenu: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { localAccount } = useContext(ActiveAccountCtx);
  const { instance } = useMsal();
  const msalAccount = instance.getActiveAccount();

  if (!msalAccount) return <LoginButton />; // Fallback in case of error

  const avatarLabel = localAccount
    ? localAccount.first_name[0] + localAccount.last_name[0]
    : msalAccount.name?.split(" ").reduce((prev, curr) => prev + curr[0], "");

  const name = localAccount
    ? localAccount.first_name + " " + localAccount.last_name
    : msalAccount.name || null;
  const email = localAccount ? localAccount.login_email : msalAccount.username;

  const registered = localAccount ? null : (
    <Typography>
      {en
        ? "This account is not registered. If you are a member, please ask an administrator to register you."
        : "Ce compte n'est pas enregistré. Si vous êtes membre, veuillez demander à un administrateur de vous inscrire."}
    </Typography>
  );

  const administrator = localAccount?.is_admin ? (
    <Typography>
      {en ? "Administrator" : "Administrateur"} &nbsp; <CheckCircleTwoTone />
    </Typography>
  ) : null;

  const member = localAccount?.member ? (
    <Typography>
      {en ? "Member" : "Membre"} &nbsp; <CheckCircleTwoTone />
    </Typography>
  ) : null;

  const dropdown = (
    <Card styles={{ body: { padding: 0 } }}>
      <div className="avatar-dropdown">
        <Typography>{name}</Typography>
        <Typography>{email}</Typography>
        {registered}
        {administrator}
        {member}
        <div style={{ height: 16 }}></div>
        <LogoutButton />
      </div>
    </Card>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdown}
      getPopupContainer={() => document.querySelector(".navbar") || document.body}
    >
      <div className="avatar">{avatarLabel}</div>
    </Dropdown>
  );
};

export default AvatarMenu;
