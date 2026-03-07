import { FC, useContext } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import { Button } from "antd";

const LanguageButton: FC = () => {
  const { en, toggleLanguage } = useContext(LanguageCtx);

  return <Button onClick={toggleLanguage}>{en ? "FR" : "EN"}</Button>;
};

export default LanguageButton;
