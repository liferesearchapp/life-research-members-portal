/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { type FC, useContext } from "react";
import PageRoutes from "../../routing/page-routes";
import { LanguageCtx } from "../../services/context/language-ctx";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";
import { getInstituteSmallLogo } from "../../utils/front-end/institute-branding";

const HomeLogo: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();
  const href = institute?.urlIdentifier
    ? PageRoutes.instituteHome(institute.urlIdentifier)
    : PageRoutes.home;
  const logoSrc = getInstituteSmallLogo(institute, en);

  return (
    <Link href={href} className="logo" style={{ lineHeight: 0 }}>
      <img
        src={logoSrc}
        alt={institute?.name ? `${institute.name} logo` : "Portal logo"}
        width={50}
        height={50}
        style={{ display: "block", width: 50, height: 50, objectFit: "contain" }}
      />
    </Link>
  );
};

export default HomeLogo;
