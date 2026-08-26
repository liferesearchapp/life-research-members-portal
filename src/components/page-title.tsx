import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, type FC } from "react";
import { LanguageCtx } from "../services/context/language-ctx";
import { useSelectedInstitute } from "../services/context/selected-institute-ctx";
import { getInstituteAcronym } from "../utils/front-end/institute-branding";

/**
 * The browser tab title.
 *
 * It used to be the literal "LIFE", which was wrong for every institute other than the one the
 * portal was first built for (issue #15). It now follows the institute the reader has selected,
 * by acronym because a tab is narrow: "ALPHA - Members".
 *
 * The component has to render *inside* the context providers, which is why this is a component
 * rather than a few lines in `_app.tsx`: the selected institute is not knowable above them. Next
 * collects `<Head>` from anywhere in the tree, so the placement costs nothing.
 */

const SECTIONS: { match: (path: string) => boolean; en: string; fr: string }[] = [
  { match: (p) => p.includes("/accounts"), en: "Accounts", fr: "Comptes" },
  { match: (p) => p.includes("/members"), en: "Members", fr: "Membres" },
  { match: (p) => p.includes("/products"), en: "Products", fr: "Produits" },
  { match: (p) => p.includes("/partners"), en: "Partners", fr: "Partenaires" },
  { match: (p) => p.includes("/grants"), en: "Grants", fr: "Subventions" },
  { match: (p) => p.includes("/events"), en: "Events", fr: "Événements" },
  { match: (p) => p.includes("/supervisions"), en: "Supervisions", fr: "Supervisions" },
  { match: (p) => p.includes("/topics"), en: "Grant Topics", fr: "Sujets de subvention" },
  {
    match: (p) => p.includes("/reports") || p.startsWith("/admin-reports"),
    en: "Reports",
    fr: "Rapports",
  },
  { match: (p) => p.startsWith("/institutes"), en: "Institutes", fr: "Instituts" },
  { match: (p) => p === "/register", en: "Register", fr: "Inscription" },
  { match: (p) => p === "/my-profile", en: "My Profile", fr: "Mon profil" },
  { match: (p) => p === "/" || p === "/[instituteId]", en: "Home", fr: "Accueil" },
];

/**
 * Builds the tab title from the route and the selected institute. Pure and DOM-free, so the
 * route -> title mapping can be tested without React or an institute context.
 *
 * `acronym` is empty before an institute is chosen, and on the institutes list, which sits above
 * any one institute. Both fall back to a name true of the whole portal rather than to one
 * institute's.
 */
export function buildPageTitle(pathname: string, en: boolean, acronym: string): string {
  const section = SECTIONS.find((s) => s.match(pathname));
  const suffix = section ? (en ? section.en : section.fr) : "";
  const base = acronym || (en ? "Research Portal" : "Portail de recherche");

  return suffix ? `${base} - ${suffix}` : base;
}

const PageTitle: FC = () => {
  const router = useRouter();
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();

  return (
    <Head>
      <title>{buildPageTitle(router.pathname, en, getInstituteAcronym(institute))}</title>
    </Head>
  );
};

export default PageTitle;
