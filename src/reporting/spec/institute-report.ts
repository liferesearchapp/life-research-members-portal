import type { Bilingual } from "../metrics/types";
import type { ReportSpec } from "./types";

/**
 * The institute report: a 1:1 port of the six-page 2024 Power BI dashboard (v2.4.1).
 *
 * Deliberate departures from the original, all of them visible here rather than buried in code:
 *
 *  - Every page is institute-scoped. The Power BI model predates multi-institute RIMS and
 *    reported across the whole database.
 *  - Product, grant and supervision counts now count entities rather than join-table rows
 *    (see the metric definitions). Figures on those pages will not match the old dashboard.
 *  - The Power BI sidebar (36 textboxes, 36 action buttons, 18 shapes hand-placed per page) is
 *    not ported; navigation is the app's own.
 *  - The Supervisions page's three duplicated member tables were a Power BI many-to-many
 *    workaround and are replaced by one joined table.
 *  - Internal join ids (member_id, organization_id, product_id) are not shown. Power BI surfaced
 *    them because its tables were bound to join tables; they mean nothing to a reader.
 */

/** Column labels shared across several tables. (`satisfies` needs TS 4.9; this repo is on 4.8.) */
const COL: Record<string, Bilingual> = {
  id: { en: "ID", fr: "ID" },
  title: { en: "Title", fr: "Titre" },
  name: { en: "Name", fr: "Nom" },
  type: { en: "Type", fr: "Type" },
  description: { en: "Description", fr: "Description" },
  note: { en: "Note", fr: "Note" },
  event: { en: "Event", fr: "Événement" },
  startDate: { en: "Start date", fr: "Date de début" },
  endDate: { en: "End date", fr: "Date de fin" },
};

export const instituteReport: ReportSpec = {
  id: "institute",
  title: { en: "Institute Report", fr: "Rapport de l'institut" },
  audience: "institute",
  pages: [
    {
      id: "members",
      title: { en: "Members", fr: "Membres" },
      yearFilter: { label: { en: "Joined year", fr: "Année d'adhésion" } },
      tiles: [
        { span: 6, tile: { type: "card", metric: "members.total" } },
        { span: 6, tile: { type: "card", metric: "members.active" } },
        { span: 12, tile: { type: "column", metric: "members.byJoinedYear" } },
        { span: 12, tile: { type: "donut", metric: "members.byType" } },
        { span: 12, tile: { type: "donut", metric: "members.byFaculty" } },
        { span: 24, tile: { type: "map", metric: "members.byLocation" } },
      ],
    },
    {
      id: "organizations",
      title: { en: "Organizations", fr: "Organisations" },
      tiles: [
        { span: 8, tile: { type: "card", metric: "organizations.total" } },
        { span: 8, tile: { type: "donut", metric: "organizations.byScope" } },
        { span: 8, tile: { type: "donut", metric: "organizations.byType" } },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "organizations.list",
            columns: [
              { key: "id", label: COL.id },
              { key: "name", label: COL.name },
              { key: "description", label: COL.description },
            ],
          },
        },
      ],
    },
    {
      id: "products",
      title: { en: "Products", fr: "Produits" },
      yearFilter: { label: { en: "Publish year", fr: "Année de publication" } },
      tiles: [
        { span: 6, tile: { type: "card", metric: "products.total" } },
        { span: 18, tile: { type: "column", metric: "products.byPublishYear" } },
        { span: 8, tile: { type: "donut", metric: "products.byPeerReviewed" } },
        { span: 8, tile: { type: "donut", metric: "products.byTopic" } },
        { span: 8, tile: { type: "list", metric: "products.byType" } },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "products.list",
            columns: [
              { key: "id", label: COL.id },
              { key: "title", label: COL.title },
              { key: "authors", label: { en: "Authors", fr: "Auteurs" } },
              { key: "published", label: { en: "Published", fr: "Date de publication" } },
            ],
          },
        },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "products.registeredAuthors",
            columns: [
              { key: "author", label: { en: "Author", fr: "Auteur" } },
              { key: "products", label: { en: "Products", fr: "Produits" } },
            ],
          },
        },
      ],
    },
    {
      id: "grants",
      title: { en: "Grants", fr: "Subventions" },
      // Obtained year, as in Power BI. Setting it drops grants never obtained.
      yearFilter: { label: { en: "Obtained year", fr: "Année d'obtention" } },
      tiles: [
        { span: 6, tile: { type: "card", metric: "grants.total" } },
        { span: 6, tile: { type: "card", metric: "grants.totalAmount", format: "currency" } },
        // These three cards are inferred, not ported -- see the note on grantMilestoneCount.
        { span: 4, tile: { type: "card", metric: "grants.submittedCount" } },
        { span: 4, tile: { type: "card", metric: "grants.obtainedCount" } },
        { span: 4, tile: { type: "card", metric: "grants.completedCount" } },
        { span: 12, tile: { type: "donut", metric: "grants.bySource" } },
        { span: 12, tile: { type: "bar", metric: "grants.byStatus", orientation: "horizontal" } },
        { span: 24, tile: { type: "column", metric: "grants.byObtainedYear" } },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "grants.list",
            columns: [
              { key: "id", label: COL.id },
              { key: "title", label: COL.title },
              { key: "amount", label: { en: "Amount", fr: "Montant" }, format: "currency" },
              { key: "status", label: { en: "Status", fr: "Statut" } },
              { key: "source", label: { en: "Source", fr: "Source" } },
              { key: "investigators", label: { en: "Investigators", fr: "Chercheurs" } },
              { key: "obtained", label: { en: "Obtained", fr: "Date d'obtention" } },
            ],
          },
        },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "grants.fromEvents",
            columns: [
              { key: "event", label: COL.event },
              { key: "grant", label: { en: "Grant", fr: "Subvention" } },
              { key: "amount", label: { en: "Amount", fr: "Montant" }, format: "currency" },
            ],
          },
        },
      ],
    },
    {
      id: "supervisions",
      title: { en: "Supervisions", fr: "Supervisions" },
      yearFilter: { label: { en: "Start year", fr: "Année de début" } },
      tiles: [
        { span: 8, tile: { type: "card", metric: "supervisions.total" } },
        { span: 8, tile: { type: "donut", metric: "supervisions.byLevel" } },
        { span: 8, tile: { type: "donut", metric: "supervisions.byFaculty" } },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "supervisions.list",
            columns: [
              { key: "trainee", label: { en: "Trainee", fr: "Stagiaire" } },
              { key: "level", label: { en: "Level", fr: "Niveau" } },
              {
                key: "principalSupervisors",
                label: { en: "Principal supervisors", fr: "Superviseurs principaux" },
              },
              { key: "coSupervisors", label: { en: "Co-supervisors", fr: "Cosuperviseurs" } },
              { key: "startDate", label: COL.startDate },
              { key: "endDate", label: COL.endDate },
              { key: "note", label: COL.note },
            ],
          },
        },
      ],
    },
    {
      id: "events",
      title: { en: "Events", fr: "Événements" },
      yearFilter: { label: { en: "Start year", fr: "Année de début" } },
      tiles: [
        { span: 6, tile: { type: "card", metric: "events.total" } },
        { span: 18, tile: { type: "column", metric: "events.byStartYear" } },
        { span: 12, tile: { type: "donut", metric: "events.byType" } },
        { span: 12, tile: { type: "list", metric: "events.byTopic" } },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "events.list",
            columns: [
              { key: "id", label: COL.id },
              { key: "name", label: COL.name },
              { key: "type", label: COL.type },
              { key: "startDate", label: COL.startDate },
              { key: "endDate", label: COL.endDate },
              { key: "note", label: COL.note },
            ],
          },
        },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "events.membersInvolved",
            columns: [
              { key: "event", label: COL.event },
              { key: "member", label: { en: "Member", fr: "Membre" } },
            ],
          },
        },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "events.partnersInvolved",
            columns: [
              { key: "event", label: COL.event },
              { key: "organization", label: { en: "Partner", fr: "Partenaire" } },
            ],
          },
        },
        {
          span: 24,
          tile: {
            type: "table",
            metric: "events.productsResulted",
            columns: [
              { key: "event", label: COL.event },
              { key: "product", label: { en: "Product", fr: "Produit" } },
            ],
          },
        },
      ],
    },
  ],
};
