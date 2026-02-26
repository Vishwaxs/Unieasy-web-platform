#!/usr/bin/env node
// scripts/verify-env.js
// Verifies that .env.template files exist and contain required keys.
// Run:  node scripts/verify-env.js
// Exit code 0 = OK, 1 = missing template or key.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const checks = [
  {
    file: "server/.env.template",
    keys: [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_ANON_KEY",
      "DB_URL",
      "CLERK_SECRET_KEY",
      "PORT",
      "CLIENT_ORIGIN",
    ],
  },
  {
    file: ".env.template",
    keys: [
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_ANON_KEY",
      "VITE_CLERK_PUBLISHABLE_KEY",
      "VITE_API_BASE_URL",
    ],
  },
];

const migrations = [
  "supabase/migrations/001_create_app_users.sql",
  "supabase/migrations/002_create_listings_tables.sql",
  "supabase/migrations/003_seed_data.sql",
  "supabase/migrations/004_admin_audit_and_ads.sql",
  "supabase/migrations/005_rls_tighten_ads.sql",
];

let ok = true;

// ── Check env templates ─────────────────────────────────────────────────────
console.log("── Checking env templates ──");
for (const c of checks) {
  const fullPath = path.join(root, c.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ✗ MISSING file: ${c.file}`);
    ok = false;
    continue;
  }
  console.log(`  ✓ ${c.file} exists`);

  const content = fs.readFileSync(fullPath, "utf8");
  for (const key of c.keys) {
    if (!new RegExp(`^${key}=`, "m").test(content)) {
      console.error(`  ✗ MISSING KEY "${key}" in ${c.file}`);
      ok = false;
    }
  }
}

// ── Check migration files ───────────────────────────────────────────────────
console.log("\n── Checking migration files ──");
for (const mig of migrations) {
  const fullPath = path.join(root, mig);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ✗ MISSING: ${mig}`);
    ok = false;
  } else {
    console.log(`  ✓ ${mig}`);
  }
}

// ── Result ───────────────────────────────────────────────────────────────────
console.log("");
if (!ok) {
  console.error("verify-env: FAILED — see errors above.");
  process.exit(1);
} else {
  console.log("verify-env: OK ✓");
  process.exit(0);
}
