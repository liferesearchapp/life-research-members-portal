const PageRoutes = {
  home: "/",
  allMembers: "/members",
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
  allAccounts: "/accounts",
  allPartners: "/partners",
  allProducts: "/products",
  allEvents: "/events",
  products: "/products",
  allGrants: "/grants",
  allSupervisions: "/supervisions",
  accountProfile: (id: number) => "/accounts/" + id,
  register: "/register",
  _404: "/404",
} as const;

export default PageRoutes;
