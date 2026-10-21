import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const url =
  process.env.TURSO_DATABASE_URL ??
  (process.env.DATABASE_URL?.startsWith("libsql://")
    ? process.env.DATABASE_URL
    : undefined);
const authToken = process.env.TURSO_AUTH_TOKEN;
const isRemote = url?.startsWith("libsql://") ?? false;

if (!url) {
  console.error("Defina TURSO_DATABASE_URL no .env");
  process.exit(1);
}

if (isRemote && !authToken) {
  console.error(
    "Defina TURSO_AUTH_TOKEN no .env (gere em: turso db tokens create approove-trademarkslab)"
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const confirmed = args.includes("--yes");
const migrationFile =
  args.find((arg) => !arg.startsWith("--")) ??
  resolve("prisma/migrations/init/migration.sql");

function parseStatements(raw: string): string[] {
  const withoutBom = raw.replace(/^﻿/, "");
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
  const target = new URL(url!.replace(/^libsql:/, "https:")).host || url;

  console.log(`Migração: ${migrationFile}`);
  console.log(`Destino:  ${target}`);
  console.log(`${statements.length} statements`);

  if (statements.some((statement) => /DROP\s+TABLE/i.test(statement))) {
    // Recriar tabelas no Turso pode disparar ON DELETE CASCADE: PRAGMA foreign_keys
    // não vale entre requisições HTTP. Escreva migrações só com ADD/RENAME COLUMN.
    console.error("Migração contém DROP TABLE. Recusado.");
    process.exit(1);
  }

  if (isRemote && !confirmed) {
    console.error("Banco remoto. Revise o destino acima e rode de novo com --yes.");
    process.exit(1);
  }

  // batch "write" roda tudo numa transação: ou aplica tudo, ou nada.
  await client.batch(statements, "write");
  console.log("Migração aplicada com sucesso.");
}

main().catch((error) => {
  console.error("Erro ao aplicar migração (nada foi aplicado):", error);
  process.exit(1);
});
