import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { FC, useContext } from "react";
import LoginButton from "./login-button";
import NavMenu from "./nav-menu";
import AvatarMenu from "./avatar-menu";
import HomeLogo from "./home-logo";
import LanguageButton from "./language-button";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import Spin from "antd/lib/spin";
import InstituteSelector from "./institute-selector";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";
import Head from "next/head";
import { useRouter } from "next/router";
import PageRoutes from "../../routing/page-routes";

const Navbar: FC = () => {
  const { loading } = useContext(ActiveAccountCtx);
  const { institute } = useSelectedInstitute();
  const urlIdentifier = institute?.urlIdentifier;

  const router = useRouter();
  function getPrefix() {
    const path = router.asPath;
    if (urlIdentifier && path.startsWith(PageRoutes.allAccounts(urlIdentifier)))
      return "Accounts";
    if (urlIdentifier && path.startsWith(PageRoutes.allGrants(urlIdentifier)))
      return "Grants";
    if (urlIdentifier && path.startsWith(PageRoutes.allPartners(urlIdentifier)))
      return "Partners";
    if (urlIdentifier && path.startsWith(PageRoutes.allProducts(urlIdentifier)))
      return "Products";
    if (urlIdentifier && path.startsWith(PageRoutes.allMembers(urlIdentifier)))
      return "Members";
    if (urlIdentifier && path.startsWith(PageRoutes.register))
      return "Register";
    if (urlIdentifier && path.startsWith(PageRoutes.allInstitutes()))
      return "Institutes";
    if (
      urlIdentifier &&
      path.startsWith(PageRoutes.allSupervisions(urlIdentifier))
    )
      return "Supervisions";
    if (urlIdentifier && path.startsWith(PageRoutes.myProfile))
      return "My Profile";
    if (urlIdentifier && path.startsWith(PageRoutes.allEvents(urlIdentifier)))
      return "Events";
    if (
      urlIdentifier &&
      path.startsWith(PageRoutes.instituteHome(urlIdentifier))
    )
      return "Home";
    return "";
  }
  let prefix = getPrefix();
  let title = institute?.name;
  if (prefix) title = `${prefix} - ${institute?.name}`;

  return (
    <div className="navbar" style={{ display: "flex", alignItems: "center" }}>
      <Head>
        <title>{title}</title>
      </Head>
      {/* Ensure the navbar is a flex container */}
      <HomeLogo />
      <span className="spacer"></span>
      <div style={{ flexGrow: 1 }}>
        <NavMenu urlIdentifier={urlIdentifier} />{" "}
      </div>
      {/* This component will grow to take available space */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {" "}
        {/* New container for right-aligned elements */}
        <InstituteSelector />
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
    </div>
  );
};

export default Navbar;
