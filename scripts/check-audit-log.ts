import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import db from "../prisma/prisma-client";

/**
 * Verifies the audit log against a real SQL Server: that the hand-written migration agrees with
 * schema.prisma, that Prisma can write an event, and that the append-only trigger actually holds.
 *
 * The last part cannot be unit-tested. `tests/api/audit.test.ts` covers the helper with a mocked
 * Prisma, which says nothing about whether a database will refuse to let someone edit the record
 * of their own actions -- and that refusal is the entire security claim.
 *
 * Run against the local test container, or in CI:
 *   npm run audit:check
 */

const MIGRATION = resolve(
  __dirname,
  "../prisma/migrations/20260826120000_audit_event/migration.sql"
);

const failures: string[] = [];

function check(label: string, passed: boolean, extra = "") {
  if (passed) console.log(`  ok    ${label}${extra ? " -- " + extra : ""}`);
  else {
    failures.push(label);
    console.log(`  FAIL  ${label}${extra ? " -- " + extra : ""}`);
  }
}

/** Runs a statement that is expected to be refused, and reports why it was. */
async function expectRefused(label: string, sql: string) {
  try {
    await db.$executeRawUnsafe(sql);
    check(label, false, "the statement was allowed");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    check(label, /append-only/.test(message), message.split("\n")[0].slice(0, 80));
  }
}

async function main() {
  if (!existsSync(MIGRATION)) throw new Error(`Migration not found: ${MIGRATION}`);

  // The schema may already have been created by `prisma db push`; the migration is idempotent, so
  // applying it here both installs the trigger and proves the two definitions do not collide.
  await db.$executeRawUnsafe(readFileSync(MIGRATION, "utf8"));
  check("the migration applies on top of a db-push schema", true);

  await db.$executeRawUnsafe(readFileSync(MIGRATION, "utf8"));
  check("the migration is idempotent", true);

  const before = await db.auditEvent.count();

  const event = await db.auditEvent.create({
    data: {
      actor_account_id: 1,
      actor_email: "audit-check@example.invalid",
      action: "update-account/[id]/grant-admin",
      target_id: "7",
      institute_id: null,
      method: "PATCH",
      status: 200,
      detail: JSON.stringify({ note: "written by check-audit-log" }),
    },
  });
  check("Prisma can write an event", (await db.auditEvent.count()) === before + 1);
  check("occurred_at is stamped by the database", event.occurred_at instanceof Date);

  await expectRefused(
    "UPDATE is refused",
    `UPDATE auditEvent SET status = 500 WHERE id = ${event.id}`
  );
  await expectRefused("DELETE is refused", `DELETE FROM auditEvent WHERE id = ${event.id}`);

  const survivor = await db.auditEvent.findUnique({ where: { id: event.id } });
  check("the event survived both attempts unchanged", survivor?.status === 200);

  // The documented purge path, which a retention job would use. Session context is per
  // connection, so the flag and the delete have to travel together.
  await db.$executeRawUnsafe(
    `EXEC sp_set_session_context @key = N'audit_purge', @value = N'1';
     DELETE FROM auditEvent WHERE id = ${event.id};
     EXEC sp_set_session_context @key = N'audit_purge', @value = NULL;`
  );
  check(
    "a deliberate purge is allowed",
    (await db.auditEvent.findUnique({ where: { id: event.id } })) === null
  );

  console.log(failures.length ? `\n${failures.length} FAILED` : "\nAll audit-log checks passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    process.exit(failures.length ? 1 : 0);
  });
