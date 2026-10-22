#!/usr/bin/env node
/**
 * Applies supabase/migrations/*.sql to the project database using psql.
 *
 *   node scripts/apply-schema.mjs           # create / update schema
 *   node scripts/apply-schema.mjs --reset   # drop the LMS tables first
 *
 * Uses SUPABASE_DB_URL from .env.local (session pooler connection string).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// minimal .env.local reader (keeps this script dependency free)
const envPath = join(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("SUPABASE_DB_URL is missing from .env.local");
  process.exit(1);
}

const reset = process.argv.includes("--reset");
const migrationsDir = join(root, "supabase", "migrations");

function psql(args, input) {
  const res = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", ...args], {
    input,
    encoding: "utf8",
    env: { ...process.env, PGCONNECT_TIMEOUT: "30" },
  });
  if (res.status !== 0) {
    console.error(res.stdout || "");
    console.error(res.stderr || "");
    process.exit(res.status ?? 1);
  }
  return res.stdout;
}

if (reset) {
  console.log("→ dropping LMS tables");
  psql(
    ["-q"],
    `
    drop schema if exists public cascade;
    create schema public;
    grant usage on schema public to anon, authenticated, service_role;
    grant all on schema public to postgres;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    `
  );
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  console.log(`→ applying ${file}`);
  const out = psql(["-q", "-f", join(migrationsDir, file)]);
  if (out.trim()) console.log(out.trim());
}

const check = psql([
  "-tA",
  "-c",
  "select count(*) from information_schema.tables where table_schema = 'public';",
]);
console.log(`✔ schema ready — ${check.trim()} public tables`);
