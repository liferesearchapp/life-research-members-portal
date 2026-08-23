/**
 * Read-only verification for scripts/migrate-data.js.
 *
 * Uses the same three environment variables:
 *   SOURCE_DATABASE_URL
 *   REFERENCE_DATABASE_URL
 *   TARGET_DATABASE_URL
 *
 * The report is written to migration-verification.md. A failed check makes the
 * process exit with status 1. This script never changes any database.
 */

const fs = require("fs");
const path = require("path");
const sql = require("mssql");
const { parseSqlServerUrl } = require("./migrate-data");

const SUPER_ADMIN_EMAILS = [
  "damyot@uottawa.ca",
  "jucmnav@gmail.com",
  "mshuk005@uottawa.ca",
  "mshah083@uottawa.ca",
];

const APPROVED_REFERENCE_ACCOUNT_IDS = [174, 175, 186, 187, 190, 192];
const APPROVED_REFERENCE_MEMBER_IDS = [427, 428, 438, 440, 441, 442];
const PROFILE_OVERLAY_MEMBER_IDS = [288];
const APPROVED_REFERENCE_ORGANIZATION_IDS = [10];
const APPROVED_REFERENCE_PRODUCT_IDS = [33];
const APPROVED_REFERENCE_EVENT_IDS = [17];
const APPROVED_REFERENCE_GRANT_IDS = [10];
const APPROVED_REFERENCE_INSIGHT_IDS = [136];
const APPROVED_REFERENCE_MEMBER_TYPE_IDS = [9, 10];

const EXACT_COUNT_TABLES = [
  "event_type",
  "faculty",
  "keyword",
  "level",
  "org_scope",
  "org_type",
  "product_type",
  "promotion_strategy",
  "source",
  "status",
  "target",
  "topic",
  "has_keyword",
  "problem",
  "desired_partnership",
  "current_promotion_strategy",
  "desired_promotion_strategy",
  "partnership_member_org",
  "event_member_involved",
  "event_grant_resulted",
  "event_partner_involved",
  "event_product_resulted",
  "event_topic",
  "event_next_event",
  "event_previous_event",
  "event_event",
  "grant_investigator_member",
  "grant_member_involved",
  "product_member_author",
  "product_member_all_author",
  "product_partnership",
  "product_target",
  "product_topic",
  "supervision_co_supervisor",
  "supervision_committee",
  "supervision_principal_supervisor",
  "supervision_trainee",
  "legacy",
];

function quoteIdentifier(value) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return `[${value}]`;
}

async function rows(pool, statement) {
  return (await pool.request().query(statement)).recordset || [];
}

async function count(pool, table, where = "") {
  const result = await rows(
    pool,
    `SELECT COUNT(*) AS [count] FROM ${quoteIdentifier(table)} ${where}`
  );
  return result[0].count;
}

async function allocateReferenceIds(sourcePool, tableName, referenceIds) {
  const result = await rows(
    sourcePool,
    `SELECT COALESCE(MAX([id]), 0) AS [maxId] FROM ${quoteIdentifier(tableName)}`
  );
  const firstAvailableId = Number(result[0].maxId) + 1;
  return new Map(
    [...referenceIds]
      .sort((left, right) => left - right)
      .map((referenceId, index) => [referenceId, firstAvailableId + index])
  );
}

function mappedId(idMap, referenceId) {
  const id = idMap.get(referenceId);
  if (!id) throw new Error(`Missing remapped ID for reference row ${referenceId}.`);
  return id;
}

async function databaseName(pool) {
  return (await rows(pool, "SELECT DB_NAME() AS [name]"))[0].name;
}

function normalize(value) {
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString("base64");
  return value;
}

function comparableRow(row) {
  return Object.fromEntries(
    Object.entries(row)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, normalize(value)])
  );
}

function sameRows(left, right) {
  return JSON.stringify(left.map(comparableRow)) === JSON.stringify(right.map(comparableRow));
}

function markdownEscape(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

async function verify() {
  const sourceConfig = parseSqlServerUrl("SOURCE_DATABASE_URL");
  const referenceConfig = parseSqlServerUrl("REFERENCE_DATABASE_URL");
  const targetConfig = parseSqlServerUrl("TARGET_DATABASE_URL");

  let sourcePool;
  let referencePool;
  let targetPool;
  const checks = [];
  const addCheck = (name, passed, details) => {
    checks.push({ name, passed: Boolean(passed), details });
    console.log(`${passed ? "PASS" : "FAIL"}: ${name} — ${details}`);
  };

  try {
    sourcePool = await new sql.ConnectionPool(sourceConfig).connect();
    referencePool = await new sql.ConnectionPool(referenceConfig).connect();
    targetPool = await new sql.ConnectionPool(targetConfig).connect();

    const databaseNames = await Promise.all([
      databaseName(sourcePool),
      databaseName(referencePool),
      databaseName(targetPool),
    ]);
    addCheck(
      "Database separation",
      new Set(databaseNames).size === 3,
      `source=${databaseNames[0]}, reference=${databaseNames[1]}, target=${databaseNames[2]}`
    );

    const referenceIdMaps = {
      account: await allocateReferenceIds(
        sourcePool,
        "account",
        APPROVED_REFERENCE_ACCOUNT_IDS
      ),
      member: await allocateReferenceIds(
        sourcePool,
        "member",
        APPROVED_REFERENCE_MEMBER_IDS
      ),
      organization: await allocateReferenceIds(
        sourcePool,
        "organization",
        APPROVED_REFERENCE_ORGANIZATION_IDS
      ),
      product: await allocateReferenceIds(
        sourcePool,
        "product",
        APPROVED_REFERENCE_PRODUCT_IDS
      ),
      event: await allocateReferenceIds(
        sourcePool,
        "event",
        APPROVED_REFERENCE_EVENT_IDS
      ),
      grant: await allocateReferenceIds(
        sourcePool,
        "grant",
        APPROVED_REFERENCE_GRANT_IDS
      ),
      insight: await allocateReferenceIds(
        sourcePool,
        "insight",
        APPROVED_REFERENCE_INSIGHT_IDS
      ),
    };

    const instituteRows = await rows(
      targetPool,
      "SELECT * FROM [institute] ORDER BY [id]"
    );
    const referenceInstitutes = await rows(
      referencePool,
      "SELECT * FROM [institute] WHERE [urlIdentifier] IN (N'lri', N'dlri') ORDER BY [id]"
    );
    addCheck(
      "Only approved institutes",
      instituteRows.length === 2 &&
        instituteRows.every((row) => ["lri", "dlri"].includes(row.urlIdentifier)),
      `found ${instituteRows.map((row) => row.urlIdentifier).join(", ") || "none"}`
    );
    addCheck(
      "Institute branding and settings",
      sameRows(instituteRows, referenceInstitutes),
      "LRI and DLRI institute rows match the approved Margi-test reference"
    );

    const instituteIds = Object.fromEntries(
      instituteRows.map((row) => [row.urlIdentifier, row.id])
    );
    const lriId = instituteIds.lri;
    const dlriId = instituteIds.dlri;

    const sourceAdminRows = await rows(
      sourcePool,
      "SELECT [id] FROM [account] WHERE [is_admin] = 1 ORDER BY [id]"
    );
    const targetLriAdminRows = lriId
      ? await rows(
          targetPool,
          `SELECT [accountId] AS [id] FROM [instituteAdmin] WHERE [instituteId] = ${Number(
            lriId
          )} ORDER BY [accountId]`
        )
      : [];
    addCheck(
      "Production admins became LRI admins",
      sameRows(sourceAdminRows, targetLriAdminRows),
      `${targetLriAdminRows.length}/${sourceAdminRows.length} exact account assignments`
    );

    const referenceDlriAdmins = dlriId
      ? await rows(
          referencePool,
          `SELECT [accountId], [instituteId] FROM [instituteAdmin]
            WHERE [instituteId] = ${Number(dlriId)} ORDER BY [accountId]`
        )
      : [];
    const expectedDlriAdmins = referenceDlriAdmins.map((admin) => ({
      ...admin,
      accountId: mappedId(referenceIdMaps.account, admin.accountId),
    }));
    const targetDlriAdmins = dlriId
      ? await rows(
          targetPool,
          `SELECT [accountId], [instituteId] FROM [instituteAdmin]
            WHERE [instituteId] = ${Number(dlriId)} ORDER BY [accountId]`
        )
      : [];
    addCheck(
      "DLRI admins preserved",
      sameRows(expectedDlriAdmins, targetDlriAdmins),
      `${targetDlriAdmins.length} approved DLRI admin assignments`
    );

    const targetSuperAdmins = await rows(
      targetPool,
      "SELECT LOWER([login_email]) AS [email] FROM [account] WHERE [is_super_admin] = 1 ORDER BY [email]"
    );
    const expectedSuperAdmins = SUPER_ADMIN_EMAILS.map((email) => ({
      email: email.toLowerCase(),
    })).sort((left, right) => left.email.localeCompare(right.email));
    addCheck(
      "Super-admin list",
      sameRows(targetSuperAdmins, expectedSuperAdmins),
      `${targetSuperAdmins.length} exact approved super-admin accounts`
    );

    const sourceAdminsWithoutMembers = await rows(
      sourcePool,
      `SELECT a.[id]
         FROM [account] a
         LEFT JOIN [member] m ON m.[account_id] = a.[id]
        WHERE a.[is_admin] = 1 AND m.[id] IS NULL`
    );
    const targetProfilesForAdminOnlyAccounts = sourceAdminsWithoutMembers.length
      ? await rows(
          targetPool,
          `SELECT [account_id] AS [id] FROM [member]
            WHERE [account_id] IN (${sourceAdminsWithoutMembers
              .map((account) => Number(account.id))
              .join(",")})`
        )
      : [];
    addCheck(
      "Admin-only production accounts remain non-members",
      targetProfilesForAdminOnlyAccounts.length === 0,
      `${sourceAdminsWithoutMembers.length} admin-only accounts have no member profiles`
    );
    const instituteAdminMemberColumn = await rows(
      targetPool,
      `SELECT COUNT(*) AS [count]
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = N'instituteAdmin' AND COLUMN_NAME = N'memberId'`
    );
    addCheck(
      "Institute administrators are independent of members",
      instituteAdminMemberColumn[0].count === 0,
      "instituteAdmin contains only account and institute assignments"
    );
    const expectedCounts = {
      account: (await count(sourcePool, "account")) + APPROVED_REFERENCE_ACCOUNT_IDS.length,
      member:
        (await count(sourcePool, "member")) +
        APPROVED_REFERENCE_MEMBER_IDS.length,
      organization:
        (await count(sourcePool, "organization")) +
        APPROVED_REFERENCE_ORGANIZATION_IDS.length,
      product:
        (await count(sourcePool, "product")) + APPROVED_REFERENCE_PRODUCT_IDS.length,
      event: (await count(sourcePool, "event")) + APPROVED_REFERENCE_EVENT_IDS.length,
      grant: (await count(sourcePool, "grant")) + APPROVED_REFERENCE_GRANT_IDS.length,
      supervision: await count(sourcePool, "supervision"),
      insight:
        (await count(sourcePool, "insight")) + APPROVED_REFERENCE_INSIGHT_IDS.length,
      member_type:
        (await count(sourcePool, "member_type")) +
        APPROVED_REFERENCE_MEMBER_TYPE_IDS.length,
    };
    for (const [table, expected] of Object.entries(expectedCounts)) {
      const actual = await count(targetPool, table);
      addCheck(
        `${table} count`,
        actual === expected,
        `expected ${expected}, found ${actual}`
      );
    }

    const referenceMemberTypes = await rows(
      referencePool,
      `SELECT * FROM [member_type] WHERE [id] IN (${APPROVED_REFERENCE_MEMBER_TYPE_IDS.join(
        ","
      )}) ORDER BY [id]`
    );
    const targetMemberTypes = await rows(
      targetPool,
      `SELECT * FROM [member_type] WHERE [id] IN (${APPROVED_REFERENCE_MEMBER_TYPE_IDS.join(
        ","
      )}) ORDER BY [id]`
    );
    addCheck(
      "Approved reference-only member type",
      sameRows(referenceMemberTypes, targetMemberTypes) &&
        targetMemberTypes.length === APPROVED_REFERENCE_MEMBER_TYPE_IDS.length,
      `${targetMemberTypes.length}/${APPROVED_REFERENCE_MEMBER_TYPE_IDS.length} rows match Margi-test exactly`
    );

    const referenceOnlyRows = [
      ["account", APPROVED_REFERENCE_ACCOUNT_IDS, referenceIdMaps.account],
      ["member", APPROVED_REFERENCE_MEMBER_IDS, referenceIdMaps.member],
      [
        "organization",
        APPROVED_REFERENCE_ORGANIZATION_IDS,
        referenceIdMaps.organization,
      ],
      ["product", APPROVED_REFERENCE_PRODUCT_IDS, referenceIdMaps.product],
      ["event", APPROVED_REFERENCE_EVENT_IDS, referenceIdMaps.event],
      ["grant", APPROVED_REFERENCE_GRANT_IDS, referenceIdMaps.grant],
      ["insight", APPROVED_REFERENCE_INSIGHT_IDS, referenceIdMaps.insight],
    ];
    for (const [table, ids, idMap] of referenceOnlyRows) {
      const idList = ids.map(Number).join(",");
      const referenceData = await rows(
        referencePool,
        `SELECT * FROM ${quoteIdentifier(table)} WHERE [id] IN (${idList}) ORDER BY [id]`
      );
      const expectedData = referenceData.map((row) => {
        const expected = { ...row, id: mappedId(idMap, row.id) };
        if (table === "account") {
          expected.is_super_admin = SUPER_ADMIN_EMAILS.includes(
            row.login_email.toLowerCase()
          );
        } else if (table === "member") {
          expected.account_id = mappedId(referenceIdMaps.account, row.account_id);
        } else if (table === "insight") {
          expected.member_id = mappedId(referenceIdMaps.member, row.member_id);
        }
        return expected;
      });
      const targetIds = ids.map((id) => mappedId(idMap, id)).join(",");
      const targetData = await rows(
        targetPool,
        `SELECT * FROM ${quoteIdentifier(table)} WHERE [id] IN (${targetIds}) ORDER BY [id]`
      );
      addCheck(
        `Approved reference-only ${table} data`,
        sameRows(expectedData, targetData) && targetData.length === ids.length,
        `${targetData.length}/${ids.length} approved rows match Margi-test exactly`
      );
    }

    for (const table of EXACT_COUNT_TABLES) {
      const expected = await count(sourcePool, table);
      const actual = await count(targetPool, table);
      addCheck(
        `${table} production count`,
        actual === expected,
        `expected ${expected}, found ${actual}`
      );
    }

    const sourceMemberCount = await count(sourcePool, "member");
    const sourceProductCount = await count(sourcePool, "product");
    const sourceOrganizationCount = await count(sourcePool, "organization");
    const approvedReferenceLriMemberCount = lriId
      ? await count(
          referencePool,
          "memberInstitute",
          `WHERE [instituteId] = ${Number(
            lriId
          )} AND [memberId] IN (${APPROVED_REFERENCE_MEMBER_IDS.join(",")})`
        )
      : 0;
    const targetLriMemberCount = lriId
      ? await count(targetPool, "memberInstitute", `WHERE [instituteId] = ${Number(lriId)}`)
      : 0;
    const targetLriProductCount = lriId
      ? await count(targetPool, "productInstitute", `WHERE [instituteId] = ${Number(lriId)}`)
      : 0;
    const targetLriOrganizationCount = lriId
      ? await count(
          targetPool,
          "organizationInstitute",
          `WHERE [instituteId] = ${Number(lriId)}`
        )
      : 0;
    addCheck(
      "LRI member relationships",
      targetLriMemberCount ===
        sourceMemberCount + approvedReferenceLriMemberCount,
      `${targetLriMemberCount} LRI memberships`
    );
    const sourceActiveMemberCount = await count(
      sourcePool,
      "member",
      "WHERE [is_active] = 1"
    );
    const approvedReferenceActiveLriMemberCount = lriId
      ? (
          await rows(
            referencePool,
            `SELECT COUNT(*) AS [count]
               FROM [memberInstitute] mi
               JOIN [member] m ON m.[id] = mi.[memberId]
              WHERE mi.[instituteId] = ${Number(lriId)}
                AND mi.[memberId] IN (${APPROVED_REFERENCE_MEMBER_IDS.join(",")})
                AND m.[is_active] = 1`
          )
        )[0].count
      : 0;
    const targetLriActiveMemberCount = lriId
      ? (
          await rows(
            targetPool,
            `SELECT COUNT(*) AS [count]
               FROM [memberInstitute] mi
               JOIN [member] m ON m.[id] = mi.[memberId]
              WHERE mi.[instituteId] = ${Number(lriId)} AND m.[is_active] = 1`
          )
        )[0].count
      : 0;
    const expectedLriActiveMemberCount =
      sourceActiveMemberCount + approvedReferenceActiveLriMemberCount;
    addCheck(
      "LRI active members",
      targetLriActiveMemberCount === expectedLriActiveMemberCount,
      `expected ${expectedLriActiveMemberCount}, found ${targetLriActiveMemberCount}`
    );
    addCheck(
      "LRI product relationships",
      targetLriProductCount === sourceProductCount,
      `${targetLriProductCount} production products assigned to LRI`
    );
    addCheck(
      "LRI organization relationships",
      targetLriOrganizationCount === sourceOrganizationCount,
      `${targetLriOrganizationCount} production organizations assigned to LRI`
    );

    for (const table of ["memberInstitute", "productInstitute", "organizationInstitute"]) {
      const referenceRows = dlriId
        ? await rows(
            referencePool,
            `SELECT * FROM ${quoteIdentifier(table)} WHERE [instituteId] = ${Number(
              dlriId
          )} ORDER BY 1, 2`
          )
        : [];
      const [relationshipKey, relationshipMap] =
        table === "memberInstitute"
          ? ["memberId", referenceIdMaps.member]
          : table === "productInstitute"
            ? ["productId", referenceIdMaps.product]
            : ["organizationId", referenceIdMaps.organization];
      const expectedRows = referenceRows.map((row) => ({
        ...row,
        [relationshipKey]: mappedId(relationshipMap, row[relationshipKey]),
      }));
      const targetRows = dlriId
        ? await rows(
            targetPool,
            `SELECT * FROM ${quoteIdentifier(table)} WHERE [instituteId] = ${Number(
              dlriId
            )} ORDER BY 1, 2`
          )
        : [];
      addCheck(
        `${table} DLRI relationships`,
        sameRows(expectedRows, targetRows),
        `${targetRows.length} approved relationships`
      );
    }

    const overlayIds = PROFILE_OVERLAY_MEMBER_IDS.join(",");
    const referenceProfiles = await rows(
      referencePool,
      `SELECT * FROM [member] WHERE [id] IN (${overlayIds}) ORDER BY [id]`
    );
    const targetProfiles = await rows(
      targetPool,
      `SELECT * FROM [member] WHERE [id] IN (${overlayIds}) ORDER BY [id]`
    );
    addCheck(
      "Approved member profile overlays",
      sameRows(referenceProfiles, targetProfiles),
      `${targetProfiles.length}/${PROFILE_OVERLAY_MEMBER_IDS.length} profiles match Margi-test`
    );

    const referenceTopics = lriId
      ? await rows(
          referencePool,
          `SELECT t.*, it.[is_active]
             FROM [topic] t
             JOIN [instituteTopic] it ON it.[topicId] = t.[id]
            WHERE it.[instituteId] = ${Number(lriId)}
            ORDER BY t.[id]`
        )
      : [];
    const targetTopics = lriId
      ? await rows(
          targetPool,
          `SELECT t.*, it.[is_active]
             FROM [topic] t
             JOIN [instituteTopic] it ON it.[topicId] = t.[id]
            WHERE it.[instituteId] = ${Number(lriId)}
            ORDER BY t.[id]`
        )
      : [];
    addCheck(
      "Corrected LRI topics",
      sameRows(referenceTopics, targetTopics) && targetTopics.length === 3,
      `${targetTopics.length} approved active-topic rows`
    );

    const approvedEntityChecks = [
      [
        "organization",
        mappedId(referenceIdMaps.organization, APPROVED_REFERENCE_ORGANIZATION_IDS[0]),
        dlriId,
        "organizationInstitute",
        "organizationId",
      ],
      [
        "product",
        mappedId(referenceIdMaps.product, APPROVED_REFERENCE_PRODUCT_IDS[0]),
        dlriId,
        "productInstitute",
        "productId",
      ],
      [
        "event",
        mappedId(referenceIdMaps.event, APPROVED_REFERENCE_EVENT_IDS[0]),
        dlriId,
        null,
        null,
      ],
      [
        "grant",
        mappedId(referenceIdMaps.grant, APPROVED_REFERENCE_GRANT_IDS[0]),
        dlriId,
        null,
        null,
      ],
    ];
    for (const [table, id, instituteId, junction, junctionKey] of approvedEntityChecks) {
      let present;
      if (junction) {
        present =
          (await count(
            targetPool,
            junction,
            `WHERE ${quoteIdentifier(junctionKey)} = ${Number(
              id
            )} AND [instituteId] = ${Number(instituteId)}`
          )) === 1;
      } else {
        present =
          (await count(
            targetPool,
            table,
            `WHERE [id] = ${Number(id)} AND [instituteId] = ${Number(instituteId)}`
          )) === 1;
      }
      addCheck(
        `Approved DLRI ${table} ${id}`,
        present,
        present ? "present and assigned to DLRI" : "missing or assigned incorrectly"
      );
    }

    const excludedRows = await rows(
      targetPool,
      `SELECT
         (SELECT COUNT(*) FROM [institute] WHERE [urlIdentifier] = N'abc') AS [abc],
         (SELECT COUNT(*) FROM [organization] WHERE [id] = 11 AND [name_en] = N'Margi') AS [margi],
         (SELECT COUNT(*) FROM [supervision]
           WHERE [id] = 17 AND [first_name] = N'Buddy' AND [last_name] = N'Test') AS [buddy]`
    );
    const excludedCount =
      excludedRows[0].abc + excludedRows[0].margi + excludedRows[0].buddy;
    addCheck(
      "Test records excluded",
      excludedCount === 0,
      excludedCount === 0 ? "abc, Margi, and Buddy Test are absent" : `${excludedCount} found`
    );

    const constraints = await rows(
      targetPool,
      "DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS"
    );
    addCheck(
      "Database constraints",
      constraints.length === 0,
      constraints.length === 0 ? "no violations" : `${constraints.length} violations`
    );

    const failures = checks.filter((check) => !check.passed);
    const report = [
      "# Migration Verification Report",
      "",
      `- Generated: ${new Date().toISOString()}`,
      `- Source: ${databaseNames[0]}`,
      `- Reference: ${databaseNames[1]}`,
      `- Target: ${databaseNames[2]}`,
      `- Result: ${failures.length === 0 ? "PASS" : "FAIL"}`,
      "",
      "| Status | Check | Details |",
      "| --- | --- | --- |",
      ...checks.map(
        (check) =>
          `| ${check.passed ? "PASS" : "FAIL"} | ${markdownEscape(
            check.name
          )} | ${markdownEscape(check.details)} |`
      ),
      "",
      failures.length === 0
        ? "All approved migration rules passed."
        : `${failures.length} check(s) failed. Do not connect the application to this target database.`,
      "",
    ].join("\n");

    const outputPath = path.join(__dirname, "..", "migration-verification.md");
    fs.writeFileSync(outputPath, report);
    console.log(`Verification report written to ${outputPath}`);

    if (failures.length) {
      throw new Error(`${failures.length} migration verification check(s) failed.`);
    }
  } finally {
    if (sourcePool) await sourcePool.close();
    if (referencePool) await referencePool.close();
    if (targetPool) await targetPool.close();
  }
}

if (require.main === module) {
  verify().catch((error) => {
    console.error(`Verification failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { verify };
