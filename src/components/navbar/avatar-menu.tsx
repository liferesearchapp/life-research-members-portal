import Dropdown from "antd/lib/dropdown";
import Menu from "antd/lib/menu";
import { FC, useContext } from "react";
import Typography from "antd/lib/typography";
import LogoutButton from "./logout-button";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import CheckCircleTwoTone from "@ant-design/icons/lib/icons/CheckCircleTwoTone";
import LoginButton from "./login-button";
import { useMsal } from "@azure/msal-react";
import { useAdminDetails } from "../../services/context/selected-institute-ctx";
import type { MenuProps } from "antd";

const AvatarMenu: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { localAccount } = useContext(ActiveAccountCtx);
  const isAdmin = useAdminDetails();
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

  const administrator = isAdmin ? (
    <Typography>
      {en ? "Administrator" : "Administrateur"} &nbsp; <CheckCircleTwoTone />
    </Typography>
  ) : null;

  const member = localAccount?.member ? (
    <Typography>
      {en ? "Member" : "Membre"} &nbsp; <CheckCircleTwoTone />
    </Typography>
  ) : null;

  const superAdmin = localAccount?.is_super_admin ? (
    <Typography>
      {en ? "Super Admin" : "Super Administrateur"} &nbsp; <CheckCircleTwoTone />
    </Typography>
  ) : null;

  const menuItems: MenuProps["items"] = [
    {
      key: "name",
      label: <Typography.Text strong>{name}</Typography.Text>,
      disabled: true,
    },
    {
      key: "email",
      label: <Typography.Text>{email}</Typography.Text>,
      disabled: true,
    },
    ...(registered
      ? [{ key: "registered", label: registered, disabled: true }]
      : []),
    ...(superAdmin
      ? [{ key: "super-admin", label: superAdmin, disabled: true }]
      : []),
    ...(administrator
      ? [{ key: "admin", label: administrator, disabled: true }]
      : []),
    ...(member ? [{ key: "member", label: member, disabled: true }] : []),
    { type: "divider" as const },
    { key: "logout", label: <LogoutButton /> },
  ];

  return (
    <Dropdown
      overlay={<Menu items={menuItems} />}
      getPopupContainer={() =>
        document.querySelector(".navbar") || document.body
      }
    >
      <div className="avatar">{avatarLabel}</div>
    </Dropdown>
  );
};

export default AvatarMenu;
