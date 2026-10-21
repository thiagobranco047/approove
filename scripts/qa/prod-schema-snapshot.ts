// Somente leitura: copia só o DDL (sem nenhum dado) do Turso para um SQLite local,
// para ensaiar migrações sobre o schema real da produção (npm run qa:migration:prod).
import { createClient } from "@libsql/client";

async function main() {
  const target = process.argv[2];
  if (!target || !process.env.TURSO_DATABASE_URL) {
    throw new Error("Uso: tsx --env-file=.env scripts/qa/prod-schema-snapshot.ts <arquivo.db>");
  }

  const prod = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  const local = createClient({ url: `file:${target}` });

  const rows = (
    await prod.execute(
      `SELECT sql FROM sqlite_master
       WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND name NOT LIKE 'libsql_%'
       ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END`
    )
  ).rows;

  for (const row of rows) await local.execute(String(row.sql));
  console.log(`schema da produção copiado (${rows.length} DDL, sem dados)`);
  prod.close();
  local.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
