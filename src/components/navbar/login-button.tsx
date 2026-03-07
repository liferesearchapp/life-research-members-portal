import Button from "antd/lib/button";
import Image from "next/image";
import { FC, useContext } from "react";
import msIcon from "../../../public/microsoft-logo.png";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";

const LoginButton: FC = () => {
  const { login } = useContext(ActiveAccountCtx);
  const { en } = useContext(LanguageCtx);
  return (
    <Button type="primary" onClick={login} className="login-button">
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flexShrink: 0, lineHeight: 0 }}>
          <Image src={msIcon} alt="ms icon" width={25} height={25} />
        </div>
        <span style={{ width: 12 }}></span>
        <span>{en ? "Login" : "Connecter"}</span>
      </div>
    </Button>
  );
};

export default LoginButton;
