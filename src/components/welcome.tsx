// This component is the main landing page of the LRI Member Portal.
// The component displays a personalized greeting to the user based on their authentication status and role
// The component also  provides an overview of the portal information and displays a banner image, a tagline, and quick links to key sections of the portal
// The information displayed is dynamic and changes based on the user's authentication status, language preference and profile information.

import { Row, Col, Typography, Divider, Space } from "antd";
import {
  TeamOutlined,
  AppstoreOutlined,
  FundOutlined,
  CalendarOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { AllMembersCtx } from "../services/context/all-members-ctx";
import { AllGrantsCtx } from "../services/context/all-grants-ctx";
import { AllEventsCtx } from "../services/context/all-events-ctx";
import { AllSupervisionsCtx } from "../services/context/all-supervisions-ctx";
import { AllProductsCtx } from "../services/context/all-products-ctx";
import { AllPartnersCtx } from "../services/context/all-partners-ctx";
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from "@azure/msal-react";
import Spin from "antd/lib/spin";
import { FC, useContext } from "react";
import { ActiveAccountCtx } from "../services/context/active-account-ctx";
import { blue, green } from "@ant-design/colors";
import { LanguageCtx } from "../services/context/language-ctx";
import Image from "next/image";
import life from "../../public/life-home2.png";
import PageRoutes from "../routing/page-routes";
import Link from "next/link";
import { useSelectedInstitute } from "../services/context/selected-institute-ctx";

const { Title } = Typography;

const Welcome: FC = () => {
  const { localAccount, loading } = useContext(ActiveAccountCtx);
  const { institute } = useSelectedInstitute();
  const { en } = useContext(LanguageCtx);

  const { allMembers } = useContext(AllMembersCtx);
  const activeMembersCount = allMembers.length;

  const { allGrants } = useContext(AllGrantsCtx);
  const activeGrantsCount = allGrants.length;

  const { allEvents } = useContext(AllEventsCtx);
  const activeEventsCount = allEvents.length;

  const { allSupervisions } = useContext(AllSupervisionsCtx);
  const activeSupervisionsCount = allSupervisions.length;

  const { allProducts } = useContext(AllProductsCtx);
  const activeProductsCount = allProducts.length;

  const { allPartners } = useContext(AllPartnersCtx);
  const activePartnersCount = allPartners.length;

  const adminGreeting = (
    <h4 style={{ color: green[6] }}>
      {en
        ? "You are logged in as an administrator"
        : "Vous êtes connecté(e) en tant qu'administrateur"}
    </h4>
  );

  const noMemberInfo = (
    <>
      <h4>
        {en
          ? "Please update your profile!"
          : "veuillez mettre à jour votre profil!"}
      </h4>
    </>
  );

  const memberGreeting = (
    <>
      <h4>
        {en
          ? "You are logged in as a member"
          : "Vous êtes connecté(e) en tant que membre"}
      </h4>
    </>
  );
  const notRegistered = (
    <>
      <h1>{en ? "This account does not exist." : "Ce compte n'existe pas."}</h1>

      <h4>
        {en
          ? "If you are a member, please ask an administrator to register you by contacting them at "
          : "Si vous êtes membre, veuillez demander à un administrateur de vous inscrire en les contactant à "}
        <a href="mailto:adm@life@uottawa.ca">adm@life@uottawa.ca</a>.
      </h4>
    </>
  );
  const unauthenticatedGreeting = (
    <>
      <h1>
        {en
          ? `Welcome to the ${institute?.name} Member Portal!`
          : `Bienvenue sur le portail des membres de l'${institute?.name}!`}
      </h1>
      <h4>
        {en
          ? "If you are a member, please login to access your profile and other features."
          : "Si vous êtes membre, veuillez vous connecter pour accéder à votre profil et d'autres fonctionnalités."}
      </h4>
    </>
  );

  const greeting = () => {
    if (loading) return <Spin size="large" />;
    if (!localAccount) return notRegistered;
    return (
      <>
        <h3>
          {en
            ? `Hello ${localAccount.first_name}!`
            : `Bonjour ${localAccount.first_name} !`}
        </h3>
        <h1>
          {en
            ? `Welcome to the ${institute?.urlIdentifier.toUpperCase()} Member Portal`
            : `Bienvenue sur le portail des membres de l'${institute?.urlIdentifier.toUpperCase()}`}
        </h1>

        {localAccount.is_admin
          ? adminGreeting
          : localAccount.member
          ? memberGreeting
          : noMemberInfo}
      </>
    );
  };

  return (
    <div className="homepage">
      <div className="banner" style={{ backgroundColor: "#f8f8f8" }}>
        <div className="banner-content">
          <Row gutter={[16, 16]}>
            <Col
              xs={24}
              md={12}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <UnauthenticatedTemplate>
                {unauthenticatedGreeting}
              </UnauthenticatedTemplate>
              <AuthenticatedTemplate>{greeting()}</AuthenticatedTemplate>
            </Col>
            <Col
              className="welcome-image"
              xs={24}
              md={12}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                src={life}
                alt="LIFE Research Institute Home"
                width={530} // Set the width and height to the desired values
                height={340}
              />
            </Col>
          </Row>
        </div>
      </div>
      <div className="center-title">
        <Title level={2}>
          {en ? institute?.description_en : institute?.description_fr}
        </Title>
      </div>

      <div className="four-columns-container">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Title level={4}>
              {en
                ? `${institute?.urlIdentifier.toUpperCase()} Portal at a glance`
                : `Aperçu du portail de l'${institute?.urlIdentifier.toUpperCase()}`}
            </Title>
            <p>
              {en
                ? `The portal provides ${institute?.urlIdentifier.toUpperCase()} members with a comprehensive overview of our research, partnerships, and initiatives. Stay informed and engaged with our work by exploring the portal information today!`
                : `Le portail fournit aux membres de l'${institute?.urlIdentifier.toUpperCase()} un aperçu de nos recherches, partenariats et initiatives. Restez informé(e) et impliqué(e) dans notre travail en explorant l'information de ce portail dès aujourd'hui.`}
            </p>
          </Col>
          <Col xs={24} md={6}>
            <Space direction="vertical">
              {localAccount && institute?.urlIdentifier ? (
                <Link href={PageRoutes.allMembers(institute?.urlIdentifier)}>
                  <a>
                    <div className="rounded-box rounded-box-gradient-1">
                      <TeamOutlined className="icon-gradient" />
                      <span className="count">{activeMembersCount}</span>
                      <span className="title">
                        {en ? "Active Members" : "Membres actifs"}
                      </span>
                    </div>
                  </a>
                </Link>
              ) : (
                <div className="rounded-box rounded-box-gradient-1">
                  <TeamOutlined className="icon-gradient" />
                  <span className="count">{activeMembersCount}</span>
                  <span className="title">
                    {en ? "Active Members" : "Membres actifs"}
                  </span>
                </div>
              )}
              {localAccount?.is_admin && institute?.urlIdentifier ? (
                <Link href={PageRoutes.allGrants(institute?.urlIdentifier)}>
                  <a>
                    <div className="rounded-box rounded-box-gradient-3">
                      <FundOutlined className="icon-gradient" />
                      <span className="count">{activeGrantsCount}</span>
                      <span className="title">
                        {en ? "Grants" : "Subventions"}
                      </span>
                    </div>
                  </a>
                </Link>
              ) : (
                <div className="rounded-box rounded-box-gradient-3">
                  <FundOutlined className="icon-gradient" />
                  <span className="count">{activeGrantsCount}</span>
                  <span className="title">{en ? "Grants" : "Subventions"}</span>
                </div>
              )}
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space direction="vertical">
              {localAccount && institute?.urlIdentifier ? (
                <Link href={PageRoutes.allProducts(institute?.urlIdentifier)}>
                  <a>
                    <div className="rounded-box rounded-box-gradient-2">
                      <AppstoreOutlined className="icon-gradient" />
                      <span className="count">{activeProductsCount}</span>
                      <span className="title">
                        {en ? "Products" : "Produits"}
                      </span>
                    </div>
                  </a>
                </Link>
              ) : (
                <div className="rounded-box rounded-box-gradient-2">
                  <AppstoreOutlined className="icon-gradient" />
                  <span className="count">{activeProductsCount}</span>
                  <span className="title">{en ? "Products" : "Produits"}</span>
                </div>
              )}

              {localAccount &&
              localAccount.is_admin &&
              institute?.urlIdentifier ? (
                <Link href={PageRoutes.allEvents(institute?.urlIdentifier)}>
                  <a>
                    <div className="rounded-box rounded-box-gradient-4">
                      <CalendarOutlined className="icon-gradient" />
                      <span className="count">{activeEventsCount}</span>
                      <span className="title">
                        {en ? "Events" : "Événements"}
                      </span>
                    </div>
                  </a>
                </Link>
              ) : (
                <div className="rounded-box rounded-box-gradient-4">
                  <CalendarOutlined className="icon-gradient" />
                  <span className="count">{activeEventsCount}</span>
                  <span className="title">{en ? "Events" : "Événements"}</span>
                </div>
              )}
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space direction="vertical">
              {localAccount && institute?.urlIdentifier ? (
                <Link href={PageRoutes.allPartners(institute?.urlIdentifier)}>
                  <a>
                    <div className="rounded-box rounded-box-gradient-6">
                      <TeamOutlined className="icon-gradient" />
                      <span className="count">{activePartnersCount}</span>
                      <span className="title">
                        {en ? "Partners" : "Partenaires"}
                      </span>
                    </div>
                  </a>
                </Link>
              ) : (
                <div className="rounded-box rounded-box-gradient-6">
                  <TeamOutlined className="icon-gradient" />
                  <span className="count">{activePartnersCount}</span>
                  <span className="title">
                    {en ? "Partners" : "Partenaires"}
                  </span>
                </div>
              )}

              {localAccount?.is_admin && institute?.urlIdentifier ? (
                <Link
                  href={PageRoutes.allSupervisions(institute?.urlIdentifier)}
                >
                  <a>
                    <div className="rounded-box rounded-box-gradient-5">
                      <SolutionOutlined className="icon-gradient" />
                      <span className="count">{activeSupervisionsCount}</span>
                      <span className="title">
                        {en ? "Supervisions" : "Supervisions"}
                      </span>
                    </div>
                  </a>
                </Link>
              ) : (
                <div className="rounded-box rounded-box-gradient-5">
                  <SolutionOutlined className="icon-gradient" />
                  <span className="count">{activeSupervisionsCount}</span>
                  <span className="title">
                    {en ? "Supervisions" : "Supervisions"}
                  </span>
                </div>
              )}
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};
export default Welcome;
