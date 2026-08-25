import type { ReportSpec } from "./types";

/**
 * The RIMS administrator report.
 *
 * Audience: super admins, who manage institutes and admin accounts and monitor usage. There is
 * deliberately no member-level page here -- see SUPER_ADMIN_CAN_READ_INSTITUTE_REPORTS in
 * reporting/auth/scope.ts for the reasoning.
 *
 * "Adoption" is honest about its limits: RIMS records no audit events, so it reports how stale
 * each institute's accounts are, not how heavily the system is used. Real usage reporting needs
 * audit instrumentation first.
 */
export const adminReport: ReportSpec = {
  id: "admin",
  title: { en: "RIMS Administration", fr: "Administration RIMS" },
  audience: "super",
  pages: [
    {
      // Clicking an institute bar scopes every tile on this page to that institute.
      id: "institutes",
      title: { en: "Institutes", fr: "Instituts" },
      tiles: [
        { span: 6, tile: { type: "card", metric: "admin.institutesTotal" } },
        { span: 6, tile: { type: "card", metric: "admin.institutesActive" } },
        { span: 6, tile: { type: "card", metric: "admin.institutesEmpty" } },
        { span: 6, tile: { type: "card", metric: "admin.sharedMembers" } },
        { span: 12, tile: { type: "bar", metric: "admin.institutesByMembers" } },
        { span: 12, tile: { type: "bar", metric: "admin.institutesByContent" } },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "admin.institutesOverview",
            columns: [
              { key: "institute", label: { en: "Institute", fr: "Institut" } },
              { key: "url", label: { en: "URL", fr: "URL" } },
              { key: "status", label: { en: "Status", fr: "Statut" } },
              { key: "admins", label: { en: "Admins", fr: "Administrateurs" } },
              { key: "members", label: { en: "Members", fr: "Membres" } },
              { key: "products", label: { en: "Products", fr: "Produits" } },
              { key: "partners", label: { en: "Partners", fr: "Partenaires" } },
              { key: "grants", label: { en: "Grants", fr: "Subventions" } },
              { key: "events", label: { en: "Events", fr: "Événements" } },
              { key: "supervisions", label: { en: "Supervisions", fr: "Supervisions" } },
            ],
          },
        },
      ],
    },
    {
      // Clicking a recency bucket scopes the cards to those accounts.
      id: "adoption",
      title: { en: "Adoption", fr: "Adoption" },
      tiles: [
        { span: 8, tile: { type: "card", metric: "admin.accountsTotal" } },
        { span: 8, tile: { type: "card", metric: "admin.membersTotal" } },
        { span: 8, tile: { type: "card", metric: "admin.accountsNeverLoggedIn" } },
        { span: 24, tile: { type: "bar", metric: "admin.accountsByLoginRecency" } },
      ],
    },
  ],
};
