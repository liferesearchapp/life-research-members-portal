// Footer component for the selected institute portal
// Displayed at the bottom of every page
// Shows institute-aware copyright information and a link to the privacy policy
// The language for the footer text is determined by the context from the LanguageCtx provider.

import { Row, Col } from "antd";
import SafeLink from "./link/safe-link";
import { useContext } from "react";
import { LanguageCtx } from "../services/context/language-ctx";
import { useSelectedInstitute } from "../services/context/selected-institute-ctx";
import { getLocalizedInstituteName } from "../utils/front-end/institute-branding";

const Footer = () => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();
  const instituteName =
    getLocalizedInstituteName(institute, en) ||
    (en ? "Research Institute Portal" : "Portail des instituts de recherche");

  return (
    <footer>
      <Row justify="space-between" align="middle" style={{ padding: "16px 0" }}>
        <Col>
          <span>
            © {new Date().getFullYear()}{" "}
            {instituteName}
            {" - "}
            {en ? "All rights reserved." : "Tous droits réservés."}
          </span>
        </Col>
        <Col>
          <SafeLink
            href={
              en
                ? "https://www.uottawa.ca/about-us/aipo/privacy-rights"
                : "https://www.uottawa.ca/notre-universite/baipvp/protection-vie-privee"
            }
            external
          >
            {en ? "Privacy Policy" : "Politique de confidentialité"}
          </SafeLink>
        </Col>
      </Row>
    </footer>
  );
};

export default Footer;
