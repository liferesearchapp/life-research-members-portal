const PageRoutes = {
  home: "/",
  instituteHome: (urlIdentifier: string) => `/${urlIdentifier}`,
  allMembers: (urlIdentifier: string) => `/${urlIdentifier}/members`,
  allProducts: (urlIdentifier: string) => `/${urlIdentifier}/products`,
  allEvents: (urlIdentifier: string) => `/${urlIdentifier}/events`,
  allGrants: (urlIdentifier: string) => `/${urlIdentifier}/grants`,
  allSupervisions: (urlIdentifier: string) => `/${urlIdentifier}/supervisions`,
  allPartners: (urlIdentifier: string) => `/${urlIdentifier}/partners`,
  allAccounts: (urlIdentifier: string) => `/${urlIdentifier}/accounts`,
  allInstitutes: () => "/institutes",
  registerPartner: (urlIdentifier: string) =>
    `/${urlIdentifier}/partners/register-partner`,
  registerSupervision: (urlIdentifier: string) =>
    `/${urlIdentifier}/supervisions/register-supervision`,

  memberProfile: (id: number) => "/members/" + id,
  productProfile: (id: number) => "/products/" + id,
  grantProfile: (id: number) => "/grants/" + id,
  eventProfile: (id: number) => "/events/" + id,
  supervisionProfile: (id: number) => "/supervisions/" + id,
  publicPartnerProfile: (id: number) => "/partners/" + id + "/public",
  privateSupervisionProfile: (id: number) => "/supervisions/" + id + "/private",
  publicSupervisionProfile: (id: number) => "/supervisions/" + id + "/public",
  organizationProfile: (id: number) => "/partners/" + id,
  publicMemberProfile: (id: number) => "/members/" + id + "/public",
  publicProductProfile: (id: number) => "/products/" + id + "/public",
  privateMemberProfile: (id: number) => "/members/" + id + "/private",
  privateProductProfile: (id: number) => "/products/" + id + "/private",
  privatePartnerProfile: (id: number) => "/partners/" + id + "/private",
  privateGrantProfile: (id: number) => "/grants/" + id + "/private",
  publicGrantProfile: (id: number) => "/grants/" + id + "/public",
  privateEventProfile: (id: number) => "/events/" + id + "/private",
  publicEventProfile: (id: number) => "/events/" + id + "/public",

  myProfile: "/my-profile",
  //TODO: remove this products route
  products: "/products",
  accountProfile: (id: number) => "/accounts/" + id,
  register: "/register",
  _404: "/404",
} as const;

export default PageRoutes;
