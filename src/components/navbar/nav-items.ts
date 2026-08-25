import PageRoutes from "../../routing/page-routes";

/**
 * A single navbar entry. `children` makes it a submenu; the parent `href` is then only a
 * fallback and not used for navigation.
 */
export type NavItem = { label: string; href: string; children?: NavItem[] };

export type NavAccess = {
  urlIdentifier: string | undefined;
  en: boolean;
  loading: boolean;
  canAccessMemberPages: boolean;
  canAccessAdminPages: boolean;
  isSuperAdmin: boolean;
  hasInstituteAccess: boolean;
  hasLocalAccount: boolean;
};

/**
 * Builds the navbar item list from the caller's access flags. Pure and DOM-free so the
 * role -> menu mapping can be unit-tested without React, antd, or a Microsoft login.
 */
export function buildNavItems(o: NavAccess): NavItem[] {
  const { en } = o;
  const id = o.urlIdentifier || "";

  const generalItems: NavItem[] = [
    { label: en ? "Home" : "Accueil", href: PageRoutes.instituteHome(id) },
  ];

  const registeredItemsFirst: NavItem[] = [
    { label: en ? "Members" : "Membres", href: PageRoutes.allMembers(id) },
    { label: en ? "Products" : "Produits", href: PageRoutes.allProducts(id) },
    { label: en ? "Partners" : "Partenaires", href: PageRoutes.allPartners(id) },
  ];

  const registeredItemsLast: NavItem[] = [
    { label: en ? "My Profile" : "Mon profil", href: PageRoutes.myProfile },
  ];

  const adminItems: NavItem[] = [
    { label: en ? "Grants" : "Subventions", href: PageRoutes.allGrants(id) },
    { label: en ? "Events" : "Événements", href: PageRoutes.allEvents(id) },
    { label: en ? "Supervisions" : "Supervisions", href: PageRoutes.allSupervisions(id) },
    { label: en ? "Grant Topics" : "Sujets de subvention", href: PageRoutes.instituteTopics(id) },
  ];

  const adminSuperAdminItems: NavItem = {
    label: en ? "Accounts" : "Comptes",
    href: PageRoutes.allAccounts(id),
    children: [
      { label: en ? "All accounts" : "Tous les comptes", href: PageRoutes.allAccounts(id) },
      { label: en ? "Register an account" : "Enregistrer un compte", href: PageRoutes.register },
    ],
  };

  const superAdminItems: NavItem[] = [
    { label: en ? "Institutes" : "Instituts", href: PageRoutes.allInstitutes() },
  ];

  // Reports (BI dashboards). Institute admins reach their own institute's report; super admins
  // additionally reach the cross-institute report.
  const reportChildren: NavItem[] = [];
  if (o.urlIdentifier && o.canAccessAdminPages)
    reportChildren.push({
      label: en ? "Institute report" : "Rapport de l'institut",
      href: PageRoutes.reports(id),
    });
  if (o.isSuperAdmin)
    reportChildren.push({
      label: en ? "All institutes" : "Tous les instituts",
      href: PageRoutes.adminReports(),
    });

  const items: NavItem[] = [];
  if (o.urlIdentifier) items.push(...generalItems);

  if (!o.loading) {
    if (o.urlIdentifier && o.canAccessMemberPages) items.push(...registeredItemsFirst);
    if (o.urlIdentifier && o.canAccessAdminPages) items.push(...adminItems);

    // With one entitlement, "Reports" is a flat link; with both, a submenu.
    if (o.urlIdentifier && reportChildren.length === 1)
      items.push({ label: en ? "Reports" : "Rapports", href: reportChildren[0].href });
    else if (o.urlIdentifier && reportChildren.length > 1)
      items.push({
        label: en ? "Reports" : "Rapports",
        href: reportChildren[0].href,
        children: reportChildren,
      });

    if (o.urlIdentifier && o.canAccessAdminPages) items.push(adminSuperAdminItems);
    if (o.hasInstituteAccess) items.push(...superAdminItems);
    if (o.urlIdentifier && o.hasLocalAccount) items.push(...registeredItemsLast);
  }

  return items;
}
