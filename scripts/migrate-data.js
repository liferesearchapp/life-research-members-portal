/**
 * Build a new-format portal database from two read-only sources.
 *
 * SOURCE_DATABASE_URL: current life-database (authoritative Heroku production data)
 * REFERENCE_DATABASE_URL: lri-database-margi-test (approved post-migration data)
 * TARGET_DATABASE_URL: a new, empty database whose schema already matches
 *                      prisma/schema.prisma
 *
 * The script never alters either source. All target writes run in one
 * transaction and are rolled back if any step fails.
 */

const sql = require("mssql");

const SUPER_ADMIN_EMAILS = new Set([
  "damyot@uottawa.ca",
  "jucmnav@gmail.com",
  "mshuk005@uottawa.ca",
  "mshah083@uottawa.ca",
]);

// Member 438/account 186 used to look like an overlay when lri-database was
// treated as production. Accounts 174/175 and members 427/428 are the two
// approved super-admin identities also missing from real production. These and
// the DLRI rows are reference-only records, so every ID is safely remapped.
const APPROVED_REFERENCE_ACCOUNT_IDS = [174, 175, 186, 187, 190, 192];
const APPROVED_REFERENCE_MEMBER_IDS = [427, 428, 438, 440, 441, 442];
const PROFILE_OVERLAY_MEMBER_IDS = [288];
const APPROVED_REFERENCE_ORGANIZATION_IDS = [10];
const APPROVED_REFERENCE_PRODUCT_IDS = [33];
const APPROVED_REFERENCE_EVENT_IDS = [17];
const APPROVED_REFERENCE_GRANT_IDS = [10];
const APPROVED_REFERENCE_INSIGHT_IDS = [136];
const APPROVED_REFERENCE_MEMBER_TYPE_IDS = [9, 10];

const REQUIRED_TARGET_TABLES = [
  "account",
  "event",
  "grant",
  "institute",
  "instituteAdmin",
  "instituteMembershipInvitation",
  "instituteTopic",
  "member",
  "memberInstitute",
  "organization",
  "organizationInstitute",
  "product",
  "productInstitute",
  "supervision",
  "topic",
];

const LOOKUP_TABLES = [
  "event_type",
  "faculty",
  "keyword",
  "level",
  "member_type",
  "org_scope",
  "org_type",
  "product_type",
  "promotion_strategy",
  "source",
  "status",
  "target",
  "topic",
];

const RELATION_TABLES = [
  "has_keyword",
  "insight",
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
];

function parseSqlServerUrl(name) {
  const raw = process.env[name];
  if (!raw) throw new Error(`${name} is required.`);

  const value = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!value.toLowerCase().startsWith("sqlserver://")) {
    throw new Error(`${name} must use Prisma's sqlserver:// URL format.`);
  }

  const parts = value.slice("sqlserver://".length).split(";");
  const authority = parts.shift();
  const separator = authority.lastIndexOf(":");
  const server = separator === -1 ? authority : authority.slice(0, separator);
  const port = separator === -1 ? 1433 : Number(authority.slice(separator + 1));
  const options = new Map();

  for (const part of parts) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    options.set(part.slice(0, index).toLowerCase(), part.slice(index + 1));
  }

  const database = options.get("database");
  const user = options.get("user");
  const password = options.get("password");
  if (!server || !database || !user || !password || !Number.isFinite(port)) {
    throw new Error(`${name} is missing server, database, user, password, or port.`);
  }

  return {
    server,
    port,
    database,
    user: decodeURIComponent(user),
    password: decodeURIComponent(password),
    options: {
      encrypt: options.get("encrypt") !== "false",
      trustServerCertificate: options.get("trustservercertificate") === "true",
    },
    // The Basic Azure SQL tier can throttle sustained row-by-row writes during
    // this one-time migration. Keep a generous per-request timeout while the
    // surrounding transaction still guarantees all-or-nothing target writes.
    requestTimeout: 600000,
    connectionTimeout: 60000,
  };
}

function quoteIdentifier(value) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return `[${value}]`;
}

function addParameter(request, name, value) {
  if (typeof value === "string") {
    request.input(name, sql.NVarChar(sql.MAX), value);
  } else if (Buffer.isBuffer(value)) {
    request.input(name, sql.VarBinary(sql.MAX), value);
  } else if (value instanceof Date) {
    request.input(name, sql.DateTime2, value);
  } else if (typeof value === "boolean") {
    request.input(name, sql.Bit, value);
  } else {
    request.input(name, value);
  }
}

function createRequest(context) {
  return context instanceof sql.Transaction
    ? new sql.Request(context)
    : context.request();
}

async function query(context, statement, parameters = {}) {
  const request = createRequest(context);
  for (const [name, value] of Object.entries(parameters)) {
    addParameter(request, name, value);
  }
  return request.query(statement);
}

async function rows(context, statement, parameters = {}) {
  return (await query(context, statement, parameters)).recordset;
}

const identityColumnCache = new Map();

async function getIdentityColumn(targetPool, tableName) {
  if (identityColumnCache.has(tableName)) {
    return identityColumnCache.get(tableName);
  }

  const result = await rows(
    targetPool,
    `SELECT c.name AS column_name
       FROM sys.identity_columns c
       JOIN sys.tables t ON t.object_id = c.object_id
      WHERE t.name = @tableName`,
    { tableName }
  );
  const identityColumn = result[0]?.column_name || null;
  identityColumnCache.set(tableName, identityColumn);
  return identityColumn;
}

async function insertRow(target, targetPool, tableName, row) {
  const columns = Object.keys(row);
  if (!columns.length) return;

  const request = createRequest(target);
  const valueExpressions = columns.map((column, index) => {
    const value = row[column];
    if (value === null || value === undefined) return "NULL";
    const parameterName = `p${index}`;
    addParameter(request, parameterName, value);
    return `@${parameterName}`;
  });

  const identityColumn = await getIdentityColumn(targetPool, tableName);
  const usesIdentityInsert = identityColumn && columns.includes(identityColumn);
  const table = quoteIdentifier(tableName);
  const insert = `INSERT INTO ${table} (${columns
    .map(quoteIdentifier)
    .join(", ")}) VALUES (${valueExpressions.join(", ")});`;
  const statement = usesIdentityInsert
    ? `SET IDENTITY_INSERT ${table} ON; ${insert} SET IDENTITY_INSERT ${table} OFF;`
    : insert;

  await request.query(statement);
}

async function insertRows(target, targetPool, tableName, sourceRows) {
  if (!sourceRows.length) {
    console.log(`  ${tableName}: inserted 0`);
    return;
  }

  const columns = Object.keys(sourceRows[0]);
  const maxBatchSize = Math.max(
    1,
    Math.min(50, Math.floor(1800 / Math.max(columns.length, 1)))
  );
  const identityColumn = await getIdentityColumn(targetPool, tableName);
  const usesIdentityInsert = identityColumn && columns.includes(identityColumn);
  const table = quoteIdentifier(tableName);

  for (let offset = 0; offset < sourceRows.length; offset += maxBatchSize) {
    const batch = sourceRows.slice(offset, offset + maxBatchSize);
    const request = createRequest(target);
    let parameterIndex = 0;
    const valueGroups = batch.map((row) => {
      const rowColumns = Object.keys(row);
      if (
        rowColumns.length !== columns.length ||
        rowColumns.some((column, index) => column !== columns[index])
      ) {
        throw new Error(`Inconsistent column shape while batching ${tableName}.`);
      }
      const values = columns.map((column) => {
        const value = row[column];
        if (value === null || value === undefined) return "NULL";
        const parameterName = `p${parameterIndex++}`;
        addParameter(request, parameterName, value);
        return `@${parameterName}`;
      });
      return `(${values.join(", ")})`;
    });
    const insert = `INSERT INTO ${table} (${columns
      .map(quoteIdentifier)
      .join(", ")}) VALUES ${valueGroups.join(", ")};`;
    const statement = usesIdentityInsert
      ? `SET IDENTITY_INSERT ${table} ON; ${insert} SET IDENTITY_INSERT ${table} OFF;`
      : insert;
    await request.query(statement);
  }
  console.log(`  ${tableName}: inserted ${sourceRows.length}`);
}

async function updateRow(target, tableName, id, row) {
  const columns = Object.keys(row).filter((column) => column !== "id");
  const request = createRequest(target);
  const assignments = [];

  columns.forEach((column, index) => {
    const value = row[column];
    if (value === null || value === undefined) {
      assignments.push(`${quoteIdentifier(column)} = NULL`);
      return;
    }
    const parameterName = `p${index}`;
    addParameter(request, parameterName, value);
    assignments.push(`${quoteIdentifier(column)} = @${parameterName}`);
  });
  addParameter(request, "id", id);
  const result = await request.query(
    `UPDATE ${quoteIdentifier(tableName)} SET ${assignments.join(", ")} WHERE [id] = @id`
  );
  return result.rowsAffected[0];
}

async function insertIfMissing(
  target,
  targetPool,
  tableName,
  row,
  keyColumns
) {
  const request = createRequest(target);
  const predicates = keyColumns.map((column, index) => {
    const parameterName = `key${index}`;
    addParameter(request, parameterName, row[column]);
    return `${quoteIdentifier(column)} = @${parameterName}`;
  });
  const existing = await request.query(
    `SELECT TOP 1 1 AS found FROM ${quoteIdentifier(tableName)} WHERE ${predicates.join(
      " AND "
    )}`
  );
  if (existing.recordset.length) return false;
  await insertRow(target, targetPool, tableName, row);
  return true;
}

async function assertTargetSchema(targetPool) {
  const availableRows = await rows(
    targetPool,
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
  );
  const available = new Set(availableRows.map((row) => row.TABLE_NAME));
  const migratedTables = [
    ...new Set([
      ...REQUIRED_TARGET_TABLES,
      ...LOOKUP_TABLES,
      ...RELATION_TABLES,
      "legacy",
      "organizationInstitute",
      "productInstitute",
      "memberInstitute",
    ]),
  ];
  const missing = migratedTables.filter((table) => !available.has(table));
  if (missing.length) {
    throw new Error(
      `Target does not have the new portal schema. Missing tables: ${missing.join(", ")}`
    );
  }

  const legacyAdminMemberColumn = await rows(
    targetPool,
    `SELECT COUNT(*) AS [count]
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = N'instituteAdmin' AND COLUMN_NAME = N'memberId'`
  );
  if (legacyAdminMemberColumn[0].count !== 0) {
    throw new Error(
      "Target schema still couples institute administrators to members through instituteAdmin.memberId."
    );
  }

  for (const table of migratedTables) {
    const count = await rows(
      targetPool,
      `SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`
    );
    if (count[0].count !== 0) {
      throw new Error(
        `Target must be empty. ${table} already contains ${count[0].count} rows.`
      );
    }
  }
}

async function assertDifferentDatabases(sourcePool, referencePool, targetPool) {
  const names = [];
  for (const pool of [sourcePool, referencePool, targetPool]) {
    names.push((await rows(pool, "SELECT DB_NAME() AS name"))[0].name);
  }
  if (new Set(names).size !== names.length) {
    throw new Error(`Source, reference, and target must be different databases: ${names.join(", ")}`);
  }
  console.log(`Source: ${names[0]} (read only)`);
  console.log(`Reference: ${names[1]} (read only)`);
  console.log(`Target: ${names[2]} (write only)`);
}

async function selectByIds(pool, tableName, ids) {
  if (!ids.length) return [];
  return rows(
    pool,
    `SELECT * FROM ${quoteIdentifier(tableName)} WHERE [id] IN (${ids
      .map(Number)
      .join(",")}) ORDER BY [id]`
  );
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

function mappedId(idMap, referenceId, description) {
  const id = idMap.get(referenceId);
  if (!id) {
    throw new Error(`Missing remapped ID for ${description} ${referenceId}.`);
  }
  return id;
}

async function assertOverlayIdentity(sourcePool, referencePool, memberId) {
  const statement = `SELECT LOWER(a.[login_email]) AS [email]
    FROM [member] m
    JOIN [account] a ON a.[id] = m.[account_id]
    WHERE m.[id] = @memberId`;
  const source = await rows(sourcePool, statement, { memberId });
  const reference = await rows(referencePool, statement, { memberId });
  if (
    source.length !== 1 ||
    reference.length !== 1 ||
    source[0].email !== reference[0].email
  ) {
    throw new Error(
      `Approved profile overlay member ${memberId} does not identify the same account in both databases.`
    );
  }
}

async function ensureApprovedReferenceRows(sourcePool, referencePool) {
  const expectations = [
    ["account", APPROVED_REFERENCE_ACCOUNT_IDS],
    ["member", APPROVED_REFERENCE_MEMBER_IDS],
    ["organization", APPROVED_REFERENCE_ORGANIZATION_IDS],
    ["product", APPROVED_REFERENCE_PRODUCT_IDS],
    ["event", APPROVED_REFERENCE_EVENT_IDS],
    ["grant", APPROVED_REFERENCE_GRANT_IDS],
    ["insight", APPROVED_REFERENCE_INSIGHT_IDS],
    ["member_type", APPROVED_REFERENCE_MEMBER_TYPE_IDS],
  ];

  for (const [table, ids] of expectations) {
    const found = await selectByIds(referencePool, table, ids);
    if (found.length !== ids.length) {
      throw new Error(
        `Reference database is missing approved ${table} rows. Expected IDs: ${ids.join(", ")}`
      );
    }

  }

  const approvedAccounts = await selectByIds(
    referencePool,
    "account",
    APPROVED_REFERENCE_ACCOUNT_IDS
  );
  for (const account of approvedAccounts) {
    const duplicate = await rows(
      sourcePool,
      "SELECT [id] FROM [account] WHERE LOWER([login_email]) = @email",
      { email: account.login_email.toLowerCase() }
    );
    if (duplicate.length) {
      throw new Error(
        `Approved reference account ${account.id} already exists logically in production as account ${duplicate[0].id}.`
      );
    }
  }

  for (const memberId of PROFILE_OVERLAY_MEMBER_IDS) {
    await assertOverlayIdentity(sourcePool, referencePool, memberId);
  }

  const memberTypeCollisions = await selectByIds(
    sourcePool,
    "member_type",
    APPROVED_REFERENCE_MEMBER_TYPE_IDS
  );
  if (memberTypeCollisions.length) {
    throw new Error(
      `Approved Margi-test member type IDs collide with production: ${memberTypeCollisions
        .map((row) => row.id)
        .join(", ")}.`
    );
  }
}

async function applySuperAdmins(target) {
  await query(target, "UPDATE [account] SET [is_super_admin] = 0");
  for (const email of SUPER_ADMIN_EMAILS) {
    const result = await query(
      target,
      "UPDATE [account] SET [is_super_admin] = 1 WHERE LOWER([login_email]) = @email",
      { email: email.toLowerCase() }
    );
    if (result.rowsAffected[0] !== 1) {
      throw new Error(`Expected exactly one approved super-admin account for ${email}.`);
    }
  }
}

async function migrate() {
  const sourceConfig = parseSqlServerUrl("SOURCE_DATABASE_URL");
  const referenceConfig = parseSqlServerUrl("REFERENCE_DATABASE_URL");
  const targetConfig = parseSqlServerUrl("TARGET_DATABASE_URL");

  let sourcePool;
  let referencePool;
  let targetPool;
  let transaction;

  try {
    sourcePool = await new sql.ConnectionPool(sourceConfig).connect();
    referencePool = await new sql.ConnectionPool(referenceConfig).connect();
    targetPool = await new sql.ConnectionPool(targetConfig).connect();

    await assertDifferentDatabases(sourcePool, referencePool, targetPool);
    await assertTargetSchema(targetPool);
    await ensureApprovedReferenceRows(sourcePool, referencePool);

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

    const productionAdmins = await rows(
      sourcePool,
      "SELECT id, login_email FROM [account] WHERE [is_admin] = 1 ORDER BY id"
    );
    console.log(`Production admins to convert into LRI admins: ${productionAdmins.length}`);

    transaction = new sql.Transaction(targetPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    console.log("\nCreating approved institutes...");
    const institutes = await rows(
      referencePool,
      "SELECT * FROM [institute] WHERE [urlIdentifier] IN (N'lri', N'dlri') ORDER BY id"
    );
    if (institutes.length !== 2) {
      throw new Error("Reference database must contain exactly the approved lri and dlri institutes.");
    }
    await insertRows(transaction, targetPool, "institute", institutes);
    const lriId = institutes.find((row) => row.urlIdentifier === "lri").id;
    const dlriId = institutes.find((row) => row.urlIdentifier === "dlri").id;

    console.log("\nCopying production lookup tables...");
    for (const table of LOOKUP_TABLES) {
      await insertRows(
        transaction,
        targetPool,
        table,
        await rows(sourcePool, `SELECT * FROM ${quoteIdentifier(table)}`)
      );
    }
    console.log("\nCopying approved reference-only member type...");
    await insertRows(
      transaction,
      targetPool,
      "member_type",
      await selectByIds(
        referencePool,
        "member_type",
        APPROVED_REFERENCE_MEMBER_TYPE_IDS
      )
    );

    console.log("\nCopying production accounts...");
    const productionAccounts = (await rows(sourcePool, "SELECT * FROM [account]")).map(
      (row) => {
        const { is_admin: ignored, ...account } = row;
        return {
          ...account,
          is_super_admin: SUPER_ADMIN_EMAILS.has(account.login_email.toLowerCase()),
        };
      }
    );
    await insertRows(transaction, targetPool, "account", productionAccounts);

    console.log("\nCopying approved reference-only accounts...");
    const referenceAccounts = (
      await selectByIds(referencePool, "account", APPROVED_REFERENCE_ACCOUNT_IDS)
    ).map((account) => ({
      ...account,
      id: mappedId(referenceIdMaps.account, account.id, "account"),
      is_super_admin: SUPER_ADMIN_EMAILS.has(account.login_email.toLowerCase()),
    }));
    await insertRows(transaction, targetPool, "account", referenceAccounts);

    console.log("\nCopying members and approved profile updates...");
    await insertRows(
      transaction,
      targetPool,
      "member",
      await rows(sourcePool, "SELECT * FROM [member]")
    );
    await insertRows(
      transaction,
      targetPool,
      "member",
      (
        await selectByIds(referencePool, "member", APPROVED_REFERENCE_MEMBER_IDS)
      ).map((member) => ({
        ...member,
        id: mappedId(referenceIdMaps.member, member.id, "member"),
        account_id: mappedId(
          referenceIdMaps.account,
          member.account_id,
          "member account"
        ),
      }))
    );
    for (const profile of await selectByIds(
      referencePool,
      "member",
      PROFILE_OVERLAY_MEMBER_IDS
    )) {
      const updated = await updateRow(transaction, "member", profile.id, profile);
      if (updated !== 1) {
        throw new Error(`Could not apply approved profile overlay for member ${profile.id}.`);
      }
      console.log(`  member ${profile.id}: applied approved Margi-test profile overlay`);
    }

    console.log("\nCopying organizations and products...");
    await insertRows(
      transaction,
      targetPool,
      "organization",
      await rows(sourcePool, "SELECT * FROM [organization]")
    );
    await insertRows(
      transaction,
      targetPool,
      "organization",
      (
        await selectByIds(
          referencePool,
          "organization",
          APPROVED_REFERENCE_ORGANIZATION_IDS
        )
      ).map((organization) => ({
        ...organization,
        id: mappedId(
          referenceIdMaps.organization,
          organization.id,
          "organization"
        ),
      }))
    );
    await insertRows(
      transaction,
      targetPool,
      "product",
      await rows(sourcePool, "SELECT * FROM [product]")
    );
    await insertRows(
      transaction,
      targetPool,
      "product",
      (
        await selectByIds(referencePool, "product", APPROVED_REFERENCE_PRODUCT_IDS)
      ).map((product) => ({
        ...product,
        id: mappedId(referenceIdMaps.product, product.id, "product"),
      }))
    );

    console.log("\nCopying events, grants, and supervisions...");
    await insertRows(
      transaction,
      targetPool,
      "event",
      (await rows(sourcePool, "SELECT * FROM [event]")).map((row) => ({
        ...row,
        instituteId: lriId,
      }))
    );
    await insertRows(
      transaction,
      targetPool,
      "event",
      (
        await selectByIds(referencePool, "event", APPROVED_REFERENCE_EVENT_IDS)
      ).map((event) => ({
        ...event,
        id: mappedId(referenceIdMaps.event, event.id, "event"),
      }))
    );
    await insertRows(
      transaction,
      targetPool,
      "grant",
      (await rows(sourcePool, "SELECT * FROM [grant]")).map((row) => ({
        ...row,
        instituteId: lriId,
      }))
    );
    await insertRows(
      transaction,
      targetPool,
      "grant",
      (
        await selectByIds(referencePool, "grant", APPROVED_REFERENCE_GRANT_IDS)
      ).map((grant) => ({
        ...grant,
        id: mappedId(referenceIdMaps.grant, grant.id, "grant"),
      }))
    );
    await insertRows(
      transaction,
      targetPool,
      "supervision",
      (await rows(sourcePool, "SELECT * FROM [supervision]")).map((row) => ({
        ...row,
        instituteId: lriId,
      }))
    );

    console.log("\nCopying complete production relationship data...");
    for (const table of RELATION_TABLES) {
      await insertRows(
        transaction,
        targetPool,
        table,
        await rows(sourcePool, `SELECT * FROM ${quoteIdentifier(table)}`)
      );
    }

    console.log("\nCopying approved reference-only profile details...");
    await insertRows(
      transaction,
      targetPool,
      "insight",
      (
        await selectByIds(referencePool, "insight", APPROVED_REFERENCE_INSIGHT_IDS)
      ).map((insight) => ({
        ...insight,
        id: mappedId(referenceIdMaps.insight, insight.id, "insight"),
        member_id: mappedId(
          referenceIdMaps.member,
          insight.member_id,
          "insight member"
        ),
      }))
    );

    console.log("\nCopying the previously omitted legacy table...");
    await insertRows(
      transaction,
      targetPool,
      "legacy",
      await rows(sourcePool, "SELECT * FROM [legacy]")
    );

    console.log("\nCreating institute relationships...");
    for (const member of await rows(sourcePool, "SELECT id FROM [member]")) {
      await insertIfMissing(
        transaction,
        targetPool,
        "memberInstitute",
        { memberId: member.id, instituteId: lriId },
        ["memberId", "instituteId"]
      );
    }
    for (const product of await rows(sourcePool, "SELECT id FROM [product]")) {
      await insertIfMissing(
        transaction,
        targetPool,
        "productInstitute",
        { productId: product.id, instituteId: lriId },
        ["productId", "instituteId"]
      );
    }
    for (const organization of await rows(sourcePool, "SELECT id FROM [organization]")) {
      await insertIfMissing(
        transaction,
        targetPool,
        "organizationInstitute",
        { organizationId: organization.id, instituteId: lriId },
        ["organizationId", "instituteId"]
      );
    }

    const approvedMemberships = await rows(
      referencePool,
      `SELECT * FROM [memberInstitute]
        WHERE [memberId] IN (${APPROVED_REFERENCE_MEMBER_IDS.join(",")})
          AND [instituteId] IN (@lriId, @dlriId)`,
      { lriId, dlriId }
    );
    for (const membership of approvedMemberships) {
      await insertIfMissing(
        transaction,
        targetPool,
        "memberInstitute",
        {
          ...membership,
          memberId: mappedId(
            referenceIdMaps.member,
            membership.memberId,
            "membership member"
          ),
        },
        ["memberId", "instituteId"]
      );
    }

    for (const relationship of await rows(
      referencePool,
      `SELECT * FROM [productInstitute] WHERE [productId] IN (${APPROVED_REFERENCE_PRODUCT_IDS.join(
        ","
      )}) AND [instituteId] = @dlriId`,
      { dlriId }
    )) {
      await insertIfMissing(
        transaction,
        targetPool,
        "productInstitute",
        {
          ...relationship,
          productId: mappedId(
            referenceIdMaps.product,
            relationship.productId,
            "product relationship"
          ),
        },
        ["productId", "instituteId"]
      );
    }
    for (const relationship of await rows(
      referencePool,
      `SELECT * FROM [organizationInstitute] WHERE [organizationId] IN (${APPROVED_REFERENCE_ORGANIZATION_IDS.join(
        ","
      )}) AND [instituteId] = @dlriId`,
      { dlriId }
    )) {
      await insertIfMissing(
        transaction,
        targetPool,
        "organizationInstitute",
        {
          ...relationship,
          organizationId: mappedId(
            referenceIdMaps.organization,
            relationship.organizationId,
            "organization relationship"
          ),
        },
        ["organizationId", "instituteId"]
      );
    }

    console.log("\nApplying corrected LRI topics...");
    const approvedTopics = await rows(
      referencePool,
      "SELECT * FROM [topic] WHERE [id] IN (1,2,3) ORDER BY [id]"
    );
    if (approvedTopics.length !== 3) {
      throw new Error("Reference database must contain all three approved LRI topics.");
    }
    for (const topic of approvedTopics) {
      const updated = await updateRow(transaction, "topic", topic.id, topic);
      if (updated !== 1) {
        throw new Error(`Could not apply approved topic ${topic.id}.`);
      }
    }
    const approvedInstituteTopics = await rows(
      referencePool,
      "SELECT * FROM [instituteTopic] WHERE [instituteId] = @lriId",
      { lriId }
    );
    if (approvedInstituteTopics.length !== 3) {
      throw new Error("Reference database must contain three approved LRI topic assignments.");
    }
    for (const instituteTopic of approvedInstituteTopics) {
      await insertIfMissing(
        transaction,
        targetPool,
        "instituteTopic",
        instituteTopic,
        ["instituteId", "topicId"]
      );
    }

    console.log("\nConverting production admins into LRI institute admins...");
    for (const admin of productionAdmins) {
      await insertIfMissing(
        transaction,
        targetPool,
        "instituteAdmin",
        { accountId: admin.id, instituteId: lriId },
        ["accountId", "instituteId"]
      );
    }

    console.log("\nCopying approved DLRI administrators...");
    for (const admin of await rows(
      referencePool,
      "SELECT * FROM [instituteAdmin] WHERE [instituteId] = @dlriId",
      { dlriId }
    )) {
      const adminAssignment = { ...admin };
      delete adminAssignment.memberId;
      await insertIfMissing(
        transaction,
        targetPool,
        "instituteAdmin",
        {
          ...adminAssignment,
          accountId: mappedId(
            referenceIdMaps.account,
            admin.accountId,
            "institute admin account"
          ),
        },
        ["accountId", "instituteId"]
      );
    }

    await applySuperAdmins(transaction);

    const excluded = await rows(
      transaction,
      `SELECT
         (SELECT COUNT(*) FROM [institute] WHERE [urlIdentifier] = N'abc') AS abcInstitutes,
         (SELECT COUNT(*) FROM [organization] WHERE [id] = 11 AND [name_en] = N'Margi') AS margiOrganizations,
         (SELECT COUNT(*) FROM [supervision] WHERE [id] = 17 AND [first_name] = N'Buddy' AND [last_name] = N'Test') AS buddyTests`
    );
    if (
      excluded[0].abcInstitutes ||
      excluded[0].margiOrganizations ||
      excluded[0].buddyTests
    ) {
      throw new Error("An explicitly excluded Margi-test record was copied.");
    }

    await transaction.commit();
    transaction = null;
    console.log("\nMigration complete. Both source databases remained read only.");
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(`Rollback failed: ${rollbackError.message}`);
      }
    }
    throw error;
  } finally {
    if (sourcePool) await sourcePool.close();
    if (referencePool) await referencePool.close();
    if (targetPool) await targetPool.close();
  }
}

if (require.main === module) {
  migrate().catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { migrate, parseSqlServerUrl };
