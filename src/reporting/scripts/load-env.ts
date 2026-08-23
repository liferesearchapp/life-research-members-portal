import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/**
 * Loads portal/.env into process.env for standalone scripts.
 *
 * Next.js and the Prisma CLI read .env themselves, but Prisma Client at runtime does not -- so a
 * plain `ts-node some-script.ts` would otherwise die with "Environment variable not found:
 * DATABASE_URL" even though the file is sitting right there.
 *
 * Import this FIRST, before anything that touches the database. Real environment variables win,
 * so `DATABASE_URL=... ts-node ...` still overrides the file.
 *
 * Deliberately not a dotenv dependency: this is only needed by scripts, and the format in use
 * here is a handful of KEY="value" lines.
 */
const envPath = resolve(__dirname, "../../../.env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1);

    if (process.env[key] === undefined) process.env[key] = value;
  }
}
