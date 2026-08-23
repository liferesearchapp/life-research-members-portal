// components/InstituteGuard.tsx
import { useContext, type FC, type ReactNode } from "react";
import { useSelectedInstitute } from "../services/context/selected-institute-ctx";
import { Typography } from "antd";
import InstituteSelector from "./navbar/institute-selector";
import Layout from "./layout/layout";
import { LanguageCtx } from "../services/context/language-ctx";

interface InstituteGuardProps {
  children: ReactNode;
}
const { Title } = Typography;

const InstituteGuard: FC<InstituteGuardProps> = ({ children }) => {
  const { institute } = useSelectedInstitute();
  const { en } = useContext(LanguageCtx);

  if (institute === null) {
    return (
      <Layout>
        <div className="center-title">
          <Title level={2}>
            {en
              ? "Please select an institute to continue."
              : "Veuillez sélectionner un institut pour continuer."}
          </Title>
          <InstituteSelector />
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
};

export default InstituteGuard;
