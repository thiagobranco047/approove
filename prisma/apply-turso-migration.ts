import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const url =
  process.env.TURSO_DATABASE_URL ??
  (process.env.DATABASE_URL?.startsWith("libsql://")
    ? process.env.DATABASE_URL
    : undefined);
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("Defina TURSO_DATABASE_URL no .env");
  process.exit(1);
}

if (!authToken) {
  console.error(
    "Defina TURSO_AUTH_TOKEN no .env (gere em: turso db tokens create approove-trademarkslab)"
  );
  process.exit(1);
}

const migrationFile =
  process.argv[2] ?? resolve("prisma/migrations/init/migration.sql");

function parseStatements(raw: string): string[] {
  const withoutBom = raw.replace(/^\uFEFF/, "");
  const withoutComments = withoutBom.replace(/--[^\n]*/g, "");
  return withoutComments
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

const client = createClient({ url, authToken });

async function main() {
  const sql = readFileSync(migrationFile, "utf-8");
  const statements = parseStatements(sql);

  console.log(`Aplicando migração: ${migrationFile}`);
  console.log(`${statements.length} statements`);

  await client.execute("PRAGMA foreign_keys = OFF");

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.replace(/\s+/g, " ").slice(0, 80);
    try {
      await client.execute(statement);
      console.log(`[${i + 1}/${statements.length}] OK: ${preview}...`);
    } catch (error) {
      console.error(`[${i + 1}/${statements.length}] FALHOU: ${preview}...`);
      throw error;
    }
  }

  await client.execute("PRAGMA foreign_keys = ON");
  console.log("Migração aplicada com sucesso no Turso.");
}

main().catch((error) => {
  console.error("Erro ao aplicar migração:", error);
  process.exit(1);
});
