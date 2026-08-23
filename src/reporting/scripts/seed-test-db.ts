import "./load-env"; // must precede any import that touches the database
import db from "../../../prisma/prisma-client";

/**
 * Seeds the local SQL Server test container with synthetic data.
 *
 * TEST DATABASE ONLY -- this deletes every row first.
 *
 * Shaped to exercise the things the reports have to get right:
 *
 *  - The join-table count bug: products/grants/supervisions get 0..4 linked people, so the
 *    inflated-and-lossy Power BI count diverges from the true count. ~15% have none at all,
 *    which is the case the old dashboard dropped silently.
 *  - Two-tier tenancy: some members and products belong to several institutes, so a broken
 *    shared-entity filter shows up as a wrong number rather than as nothing.
 *  - Enough categories to fold: 9 faculties and 9 topics, so the donuts must collapse a tail
 *    into "Other" rather than invent hues.
 *  - Dates spread over 2015-2025, so the page year filters have something to cut.
 *  - Institute lifecycle: one inactive institute and one provisioned-but-empty one, so the
 *    admin report's institutesEmpty / institutesActive are not always trivially 0 and N.
 *  - Adoption: last_login spread across every recency bucket, including never.
 *
 * Deterministic: a fixed-seed PRNG, so re-running gives byte-identical data and the parity
 * report is reproducible. Never Math.random() here.
 */

const COUNTS = { members: 60, products: 180, grants: 45, events: 35, supervisions: 50, orgs: 25 };

/** mulberry32 — small, fast, deterministic. */
function makeRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20260715);

const int = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];
const chance = (p: number) => rng() < p;
/** A date between Jan 1 `from` and Dec 31 `to`, or null with probability `nullRate`. */
const someDate = (from: number, to: number, nullRate = 0) =>
  chance(nullRate) ? null : new Date(Date.UTC(int(from, to), int(0, 11), int(1, 28)));

const FIRST = ["Ana","Ben","Chloe","Daniel","Elena","Farid","Grace","Hugo","Ines","Jamal","Kira","Louis","Maya","Nadia","Omar","Pia","Quentin","Rosa","Sami","Tara","Ugo","Vera","Wes","Xin","Yara","Zied","Alice","Bruno","Camille","Dario"];
const LAST = ["Arsenault","Bouchard","Chen","Dubois","Eze","Fontaine","Gagnon","Haddad","Ibrahim","Jansen","Kowalski","Lemay","Moreau","Nguyen","Okafor","Petrov","Quinn","Roy","Sauve","Tremblay","Ueda","Vaillancourt","Wong","Xu","Yousef","Zhang"];
const CITIES: [string, string][] = [["Ottawa","Canada"],["Gatineau","Canada"],["Toronto","Canada"],["Montreal","Canada"],["Kingston","Canada"],["Vancouver","Canada"],["Paris","France"],["Brussels","Belgium"]];

async function main() {
  // Children before parents.
  await db.product_member_author.deleteMany();
  await db.product_topic.deleteMany();
  await db.product_partnership.deleteMany();
  await db.productInstitute.deleteMany();
  await db.event_product_resulted.deleteMany();
  await db.event_grant_resulted.deleteMany();
  await db.event_partner_involved.deleteMany();
  await db.event_member_involved.deleteMany();
  await db.event_topic.deleteMany();
  await db.event.deleteMany();
  await db.product.deleteMany();
  await db.grant_member_involved.deleteMany();
  await db.grant_investigator_member.deleteMany();
  await db.grant.deleteMany();
  await db.supervision_principal_supervisor.deleteMany();
  await db.supervision_co_supervisor.deleteMany();
  await db.supervision_committee.deleteMany();
  await db.supervision_trainee.deleteMany();
  await db.supervision.deleteMany();
  await db.partnership_member_org.deleteMany();
  await db.organizationInstitute.deleteMany();
  await db.organization.deleteMany();
  await db.memberInstitute.deleteMany();
  await db.instituteAdmin.deleteMany();
  await db.instituteMembershipInvitation.deleteMany(); // new in f03e5d7's follow-up
  await db.instituteTopic.deleteMany(); // topics are now institute-scoped
  await db.has_keyword.deleteMany();
  await db.insight.deleteMany();
  await db.problem.deleteMany();
  await db.desired_partnership.deleteMany();
  await db.current_promotion_strategy.deleteMany();
  await db.desired_promotion_strategy.deleteMany();
  await db.member.deleteMany();
  await db.account.deleteMany();
  await db.institute.deleteMany();
  await db.product_type.deleteMany();
  await db.member_type.deleteMany();
  await db.faculty.deleteMany();
  await db.topic.deleteMany();
  await db.source.deleteMany();
  await db.status.deleteMany();
  await db.level.deleteMany();
  await db.org_scope.deleteMany();
  await db.org_type.deleteMany();
  await db.event_type.deleteMany();

  // --- Institutes -------------------------------------------------------------------------
  // name_fr is new in the main schema (bilingual institute names).
  const alpha = await db.institute.create({
    data: { name: "Alpha Research Institute", name_fr: "Institut de recherche Alpha", urlIdentifier: "alpha" },
  });
  const beta = await db.institute.create({
    data: { name: "Beta Research Institute", name_fr: "Institut de recherche Beta", urlIdentifier: "beta" },
  });
  const gamma = await db.institute.create({
    data: { name: "Gamma Institute", name_fr: "Institut Gamma", urlIdentifier: "gamma", is_active: false },
  });
  // Provisioned but never populated -- admin.institutesEmpty should find exactly this one.
  const delta = await db.institute.create({
    data: { name: "Delta Institute", name_fr: "Institut Delta", urlIdentifier: "delta" },
  });

  // --- Lookups ----------------------------------------------------------------------------
  const mk = async <T,>(fn: (n: [string, string]) => Promise<T>, names: [string, string][]) =>
    Promise.all(names.map(fn));

  // 9 faculties and 9 topics: past the 6-slice donut cap, so the fold is exercised.
  const faculties = await mk(
    ([en, fr]) => db.faculty.create({ data: { name_en: en, name_fr: fr } }),
    [["Faculty of Science","Faculté des sciences"],["Faculty of Medicine","Faculté de médecine"],["Faculty of Social Sciences","Faculté des sciences sociales"],["Faculty of Engineering","Faculté de génie"],["Faculty of Arts","Faculté des arts"],["Faculty of Law","Faculté de droit"],["Faculty of Education","Faculté d'éducation"],["Faculty of Health Sciences","Faculté des sciences de la santé"],["Telfer School of Management","École de gestion Telfer"]]
  );
  const memberTypes = await mk(
    ([en, fr]) => db.member_type.create({ data: { name_en: en, name_fr: fr } }),
    [["Full Professor","Professeur titulaire"],["Associate Professor","Professeur agrégé"],["Assistant Professor","Professeur adjoint"],["Postdoctoral Fellow","Stagiaire postdoctoral"],["Graduate Student","Étudiant aux cycles supérieurs"]]
  );
  const productTypes = await mk(
    ([en, fr]) => db.product_type.create({ data: { name_en: en, name_fr: fr } }),
    [["Journal Article","Article de revue"],["Conference Paper","Communication"],["Book Chapter","Chapitre de livre"],["Technical Report","Rapport technique"],["Book","Livre"],["Dataset","Jeu de données"]]
  );
  const topics = await mk(
    ([en, fr]) => db.topic.create({ data: { name_en: en, name_fr: fr } }),
    [["Aging","Vieillissement"],["Ethics","Éthique"],["Mental Health","Santé mentale"],["Mobility","Mobilité"],["Nutrition","Nutrition"],["Digital Health","Santé numérique"],["Rehabilitation","Réadaptation"],["Policy","Politiques"],["Caregiving","Proche aidance"]]
  );

  // instituteTopic: topics are now curated per institute (new join, with is_active). This is a
  // separate concept from the topics already attached to products/events via product_topic /
  // event_topic -- those are unchanged, so "by topic" reports still count what records carry.
  // Each populated institute enables most topics; a couple are left inactive to exercise the
  // is_active flag. Delta (the deliberately-empty institute) gets none.
  for (const inst of [alpha, beta, gamma]) {
    await db.instituteTopic.createMany({
      data: topics.map((t, i) => ({ instituteId: inst.id, topicId: t.id, is_active: i < 7 })),
    });
  }
  const sources = await mk(
    ([en, fr]) => db.source.create({ data: { name_en: en, name_fr: fr } }),
    [["NSERC","CRSNG"],["CIHR","IRSC"],["SSHRC","CRSH"],["CFI","FCI"],["Mitacs","Mitacs"],["Internal","Interne"]]
  );
  const statuses = await mk(
    ([en, fr]) => db.status.create({ data: { name_en: en, name_fr: fr } }),
    [["Obtained","Obtenue"],["Submitted","Soumise"],["Completed","Terminée"],["Rejected","Refusée"],["In Preparation","En préparation"]]
  );
  const levels = await mk(
    ([en, fr]) => db.level.create({ data: { name_en: en, name_fr: fr } }),
    [["PhD","Doctorat"],["Master's","Maîtrise"],["Undergraduate","Premier cycle"],["Postdoctoral","Postdoctorat"],["Visiting","Visiteur"]]
  );
  const orgScopes = await mk(
    ([en, fr]) => db.org_scope.create({ data: { name_en: en, name_fr: fr } }),
    [["Local","Local"],["Provincial","Provincial"],["National","National"],["International","International"]]
  );
  const orgTypes = await mk(
    ([en, fr]) => db.org_type.create({ data: { name_en: en, name_fr: fr } }),
    [["NGO","ONG"],["Government","Gouvernement"],["Industry","Industrie"],["Academic","Universitaire"],["Hospital","Hôpital"]]
  );
  const eventTypes = await mk(
    ([en, fr]) => db.event_type.create({ data: { name_en: en, name_fr: fr } }),
    [["Workshop","Atelier"],["Conference","Conférence"],["Seminar","Séminaire"],["Symposium","Symposium"],["Public Lecture","Conférence publique"]]
  );

  // --- Members ----------------------------------------------------------------------------
  // last_login spread across every adoption bucket, including never.
  const today = Date.UTC(2026, 6, 15);
  const daysAgo = (d: number) => new Date(today - d * 86_400_000);

  const members: { id: number; institutes: number[] }[] = [];
  for (let i = 0; i < COUNTS.members; i++) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[i % LAST.length];
    const [city, country] = pick(CITIES);

    // Most belong to one institute; ~15% are shared across two (the tenancy case that matters).
    const home = rng() < 0.55 ? alpha.id : rng() < 0.75 ? beta.id : gamma.id;
    const institutes = [home];
    if (chance(0.15)) {
      const other = home === alpha.id ? beta.id : alpha.id;
      institutes.push(other);
    }

    const loginRoll = rng();
    const last_login =
      loginRoll < 0.25 ? daysAgo(int(0, 30))
      : loginRoll < 0.45 ? daysAgo(int(31, 90))
      : loginRoll < 0.7 ? daysAgo(int(91, 365))
      : loginRoll < 0.85 ? daysAgo(int(366, 1200))
      : null; // never signed in

    const account = await db.account.create({
      data: {
        login_email: `${first}.${last}.${i}@example.test`.toLowerCase(),
        first_name: first,
        last_name: last,
        last_login,
      },
    });
    const member = await db.member.create({
      data: {
        account_id: account.id,
        type_id: pick(memberTypes).id,
        faculty_id: pick(faculties).id,
        is_active: chance(0.85),
        date_joined: someDate(2015, 2025, 0.05),
        city,
        country,
        work_email: account.login_email,
        institutes: { create: institutes.map((instituteId) => ({ instituteId })) },
      },
    });
    members.push({ id: member.id, institutes });
  }

  const membersOf = (instituteId: number) => members.filter((m) => m.institutes.includes(instituteId));

  // --- Organizations ----------------------------------------------------------------------
  const orgs: { id: number; institutes: number[] }[] = [];
  for (let i = 0; i < COUNTS.orgs; i++) {
    const institutes = chance(0.2) ? [alpha.id, beta.id] : [chance(0.6) ? alpha.id : beta.id];
    const org = await db.organization.create({
      data: {
        name_en: `${pick(["Centre","Institute","Network","Alliance","Foundation"])} for ${pick(["Aging","Health","Mobility","Policy","Innovation"])} ${i + 1}`,
        name_fr: `Organisme partenaire ${i + 1}`,
        scope_id: pick(orgScopes).id,
        type_id: pick(orgTypes).id,
        description: "Synthetic partner organization for reporting tests.",
        organizationInstitute: { create: institutes.map((instituteId) => ({ instituteId })) },
      },
    });
    orgs.push({ id: org.id, institutes });
  }

  // --- Products ---------------------------------------------------------------------------
  let zeroAuthorProducts = 0;
  const products: { id: number; institutes: number[] }[] = [];
  for (let i = 0; i < COUNTS.products; i++) {
    const institutes = chance(0.12) ? [alpha.id, beta.id] : [rng() < 0.6 ? alpha.id : rng() < 0.85 ? beta.id : gamma.id];
    const pool = membersOf(institutes[0]);

    // 0..4 registered authors. ~15% have none -- the products the Power BI dashboard dropped.
    const authorCount = chance(0.15) ? 0 : int(1, Math.min(4, Math.max(1, pool.length)));
    if (authorCount === 0) zeroAuthorProducts++;
    const authors = new Set<number>();
    while (authors.size < authorCount && pool.length) authors.add(pick(pool).id);

    const product = await db.product.create({
      data: {
        title_en: `${pick(["Assessing","Modelling","Evaluating","Exploring","Measuring"])} ${pick(["frailty","mobility","caregiver burden","digital adherence","nutrition"])} in ${pick(["older adults","rural communities","clinical settings","long-term care"])} (${i + 1})`,
        title_fr: `Produit de recherche ${i + 1}`,
        product_type_id: pick(productTypes).id,
        peer_reviewed: chance(0.7),
        on_going: chance(0.1),
        publish_date: someDate(2015, 2025, 0.08),
        all_author: "Includes external co-authors not registered in RIMS",
        doi: `10.1000/synthetic.${i + 1}`,
        institutes: { create: institutes.map((instituteId) => ({ instituteId })) },
        product_member_author: { create: [...authors].map((member_id) => ({ member_id })) },
        product_topic: {
          create: [...new Set([pick(topics).id, ...(chance(0.3) ? [pick(topics).id] : [])])].map(
            (topic_id) => ({ topic_id })
          ),
        },
      },
    });
    products.push({ id: product.id, institutes });
  }

  // --- Grants -----------------------------------------------------------------------------
  let zeroInvolvedGrants = 0;
  const grants: { id: number; instituteId: number }[] = [];
  for (let i = 0; i < COUNTS.grants; i++) {
    const instituteId = rng() < 0.6 ? alpha.id : rng() < 0.85 ? beta.id : gamma.id;
    const pool = membersOf(instituteId);

    const involvedCount = chance(0.15) ? 0 : int(1, Math.min(4, Math.max(1, pool.length)));
    if (involvedCount === 0) zeroInvolvedGrants++;
    const involved = new Set<number>();
    while (involved.size < involvedCount && pool.length) involved.add(pick(pool).id);

    const submission = someDate(2015, 2024, 0.05);
    // Only some submitted grants are obtained; only some obtained are completed.
    const obtained = submission && chance(0.65) ? new Date(submission.getTime() + int(60, 400) * 86_400_000) : null;
    const completed = obtained && chance(0.5) ? new Date(obtained.getTime() + int(365, 1400) * 86_400_000) : null;

    const grant = await db.grant.create({
      data: {
        title: `${pick(["Advancing","Building","Scaling","Sustaining"])} ${pick(["community care","healthy aging","digital access","mobility research"])} (${i + 1})`,
        amount: int(1, 200) * 10000,
        instituteId,
        source_id: pick(sources).id,
        status_id: completed ? statuses[2].id : obtained ? statuses[0].id : submission ? statuses[1].id : pick(statuses).id,
        submission_date: submission,
        obtained_date: obtained,
        completed_date: completed,
        all_investigator: "Includes external investigators not registered in RIMS",
        grant_member_involved: { create: [...involved].map((member_id) => ({ member_id })) },
      },
    });
    grants.push({ id: grant.id, instituteId });
  }

  // --- Supervisions ------------------------------------------------------------------------
  let zeroPrincipalSupervisions = 0;
  for (let i = 0; i < COUNTS.supervisions; i++) {
    const instituteId = rng() < 0.6 ? alpha.id : rng() < 0.85 ? beta.id : gamma.id;
    const pool = membersOf(instituteId);

    // 0..2 principal supervisors: the join-table count bug, in its supervisions form.
    const principalCount = chance(0.15) ? 0 : chance(0.25) ? 2 : 1;
    if (principalCount === 0) zeroPrincipalSupervisions++;
    const principals = new Set<number>();
    while (principals.size < principalCount && pool.length) principals.add(pick(pool).id);
    const cos = new Set<number>();
    while (cos.size < (chance(0.4) ? 1 : 0) && pool.length) cos.add(pick(pool).id);

    const start = someDate(2015, 2024, 0.03);
    await db.supervision.create({
      data: {
        first_name: pick(FIRST),
        last_name: pick(LAST),
        instituteId,
        level_id: pick(levels).id,
        faculty_id: pick(faculties).id,
        start_date: start,
        end_date: start && chance(0.55) ? new Date(start.getTime() + int(365, 1800) * 86_400_000) : null,
        note: chance(0.3) ? "Co-supervised with an external institution." : null,
        supervision_principal_supervisor: { create: [...principals].map((member_id) => ({ member_id })) },
        supervision_co_supervisor: { create: [...cos].map((member_id) => ({ member_id })) },
      },
    });
  }

  // --- Events -----------------------------------------------------------------------------
  for (let i = 0; i < COUNTS.events; i++) {
    const instituteId = rng() < 0.6 ? alpha.id : rng() < 0.85 ? beta.id : gamma.id;
    const pool = membersOf(instituteId);
    const orgPool = orgs.filter((o) => o.institutes.includes(instituteId));
    const productPool = products.filter((p) => p.institutes.includes(instituteId));
    const grantPool = grants.filter((g) => g.instituteId === instituteId);

    const start = someDate(2015, 2025, 0.03);
    const involved = new Set<number>();
    while (involved.size < int(0, 3) && pool.length) involved.add(pick(pool).id);
    const partners = new Set<number>();
    while (partners.size < int(0, 2) && orgPool.length) partners.add(pick(orgPool).id);

    const event = await db.event.create({
      data: {
        name_en: `${pick(["Annual","Spring","Fall","Regional","International"])} ${pick(eventTypes).name_en} on ${pick(["Aging","Mobility","Ethics","Digital Health"])} (${i + 1})`,
        name_fr: `Événement ${i + 1}`,
        instituteId,
        event_type_id: pick(eventTypes).id,
        topic_id: pick(topics).id,
        start_date: start,
        end_date: start ? new Date(start.getTime() + int(0, 3) * 86_400_000) : null,
        note: chance(0.4) ? "Hybrid delivery; recording available on request." : null,
        event_topic: { create: [{ topic_id: pick(topics).id }] },
        event_member_involved: { create: [...involved].map((member_id) => ({ member_id })) },
        event_partner_involved: { create: [...partners].map((organization_id) => ({ organization_id })) },
      },
    });

    if (productPool.length && chance(0.4))
      await db.event_product_resulted.create({
        data: { event_id: event.id, product_id: pick(productPool).id },
      });
    if (grantPool.length && chance(0.3))
      await db.event_grant_resulted.create({
        data: { event_id: event.id, grant_id: pick(grantPool).id },
      });
  }

  // --- A real sign-in account ---------------------------------------------------------------
  //
  // The email comes from .env (git-ignored) rather than being hard-coded: this repo is public,
  // and a seed fixture is no place for someone's real address. getAccountFromRequest matches on
  // microsoft_id OR lower-cased login_email, and stamps microsoft_id on first sign-in.
  //
  // Given NO member row on purpose. Since commit f03e5d7 ("separate institute admins from
  // members"), instituteAdmin is keyed on (accountId, instituteId) only -- an institute admin is
  // no longer required to be a member. Seeding the admin with no member exercises that new case,
  // so a report that wrongly assumes admin => member fails here rather than in production. It
  // also keeps the account out of every member figure it is meant to be checking.
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    const [first, ...rest] = (process.env.SEED_ADMIN_NAME ?? "RIMS Admin").split(" ");
    const adminAccount = await db.account.create({
      data: {
        login_email: adminEmail,
        first_name: first,
        last_name: rest.join(" ") || "",
        is_super_admin: true, // opens /admin-reports
        last_login: daysAgo(1),
      },
    });
    await db.instituteAdmin.createMany({
      data: [alpha.id, beta.id, gamma.id].map((instituteId) => ({
        accountId: adminAccount.id,
        instituteId,
      })),
    });
    console.log(
      `Sign-in account: ${adminEmail} (super admin; institute admin of alpha, beta, gamma; not a member)`
    );
  } else {
    console.log("No SEED_ADMIN_EMAIL set -- seeded without a sign-in account.");
  }

  // --- Membership invitations (new instituteMembershipInvitation table) ---------------------
  // A small funnel across statuses so the admin invitation report has data: pending / accepted /
  // rejected, with respondedAt set on the resolved ones so time-to-respond is measurable.
  const inviter = await db.account.findFirst({ select: { id: true } });
  if (inviter) {
    let invited = 0;
    for (let i = 0; i < 18; i++) {
      const invitee = await db.account.create({
        data: {
          login_email: `invitee.${i}@example.test`,
          first_name: `Invitee${i}`,
          last_name: "Prospective",
        },
      });
      const status = i < 8 ? "PENDING" : i < 14 ? "ACCEPTED" : "REJECTED";
      const created = daysAgo(int(10, 200));
      const responded =
        status === "PENDING" ? null : new Date(created.getTime() + int(1, 40) * 86_400_000);
      await db.instituteMembershipInvitation.create({
        data: {
          accountId: invitee.id, // fresh account => unique (accountId, instituteId)
          instituteId: pick([alpha, beta]).id,
          invitedByAccountId: inviter.id,
          status,
          createdAt: created,
          ...(responded ? { respondedAt: responded } : {}),
          note: chance(0.3) ? "Invited after the spring symposium." : null,
        },
      });
      invited++;
    }
    console.log(`Seeded ${invited} membership invitations (8 pending, 6 accepted, 4 rejected).`);
  }

  console.log(
    `\nSeeded ${COUNTS.members} members, ${COUNTS.products} products, ${COUNTS.grants} grants, ` +
      `${COUNTS.supervisions} supervisions, ${COUNTS.events} events, ${COUNTS.orgs} organizations ` +
      `across 4 institutes (gamma inactive, delta empty).`
  );
  console.log(
    `Count-bug fixtures: ${zeroAuthorProducts} products with no registered author, ` +
      `${zeroInvolvedGrants} grants with no involved member, ` +
      `${zeroPrincipalSupervisions} supervisions with no principal supervisor ` +
      `(all invisible in the old Power BI figures).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
