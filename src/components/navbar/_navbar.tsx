import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { type FC, useContext } from "react";
import LoginButton from "./login-button";
import NavMenu from "./nav-menu";
import AvatarMenu from "./avatar-menu";
import HomeLogo from "./home-logo";
import LanguageButton from "./language-button";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { Spin } from "antd";

const Navbar: FC = () => {
  const { loading } = useContext(ActiveAccountCtx);
  return (
    <div className="navbar">
      <HomeLogo />
      <span className="spacer"></span>
      <NavMenu />
      <span className="spacer"></span>
      <LanguageButton />
      <span className="spacer"></span>
      {loading ? (
        <Spin />
      ) : (
        <>
          <UnauthenticatedTemplate>
            <LoginButton />
          </UnauthenticatedTemplate>
          <AuthenticatedTemplate>
            <AvatarMenu />
          </AuthenticatedTemplate>
        </>
      )}
    </div>
  );
};

export default Navbar;
