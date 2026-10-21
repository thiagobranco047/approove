#!/usr/bin/env bash
# Prova que: schema de BASE_REF + migrações novas = schema.prisma atual, preservando dados.
# Migrações novas = pastas em prisma/migrations ausentes em BASE_REF (ou as passadas como argumento).
# Opcional por migração: fixture.sql (dados no schema antigo) e expect.tsv (descrição<TAB>sql<TAB>esperado).
#   npm run qa:migration                 # compara com main
#   QA_BASE_REF=origin/main npm run qa:migration
set -euo pipefail

BASE_REF="${QA_BASE_REF:-main}"
WORK="$(mktemp -d)"
DB="$WORK/base.db"
trap 'rm -rf "$WORK"' EXIT

if [[ $# -gt 0 ]]; then
  MIGRATIONS=("$@")
else
  MIGRATIONS=()
  for file in prisma/migrations/*/migration.sql; do
    git cat-file -e "$BASE_REF:$file" 2>/dev/null || MIGRATIONS+=("$file")
  done
fi

if [[ ${#MIGRATIONS[@]} -eq 0 ]]; then
  if git diff --quiet "$BASE_REF" -- prisma/schema.prisma; then
    echo "Sem migrações novas e schema.prisma igual a $BASE_REF. OK."; exit 0
  fi
  echo "FALHOU: schema.prisma mudou desde $BASE_REF sem migração em prisma/migrations/."; exit 1
fi

git show "$BASE_REF:prisma/schema.prisma" > "$WORK/base.prisma"
DATABASE_URL="file:$DB" npx prisma db push --schema "$WORK/base.prisma" --skip-generate >/dev/null

for migration in "${MIGRATIONS[@]}"; do
  fixture="$(dirname "$migration")/fixture.sql"
  [[ -f "$fixture" ]] && sqlite3 "$DB" < "$fixture"
done

for migration in "${MIGRATIONS[@]}"; do
  echo "aplicando $migration"
  TURSO_DATABASE_URL="file:$DB" npx tsx prisma/apply-turso-migration.ts "$migration" >/dev/null
done

DIFF="$(npx prisma migrate diff --from-url "file:$DB" --to-schema-datamodel prisma/schema.prisma --script)"
if ! grep -q "This is an empty migration" <<<"$DIFF"; then
  echo "FALHOU: banco migrado difere do schema.prisma:"; echo "$DIFF"; exit 1
fi
echo "ok  banco migrado idêntico ao schema.prisma"

for migration in "${MIGRATIONS[@]}"; do
  expect="$(dirname "$migration")/expect.tsv"
  [[ -f "$expect" ]] || continue
  while IFS=$'\t' read -r label sql expected; do
    got="$(sqlite3 "$DB" "$sql")"
    if [[ "$got" != "$expected" ]]; then echo "FALHOU: $label (esperado '$expected', veio '$got')"; exit 1; fi
    echo "ok  $label"
  done < "$expect"
done
echo "Migração OK."
