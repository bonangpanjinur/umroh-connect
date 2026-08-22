#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/docs/supabase-migration-inventory.csv"
mkdir -p "$ROOT/docs"
printf 'file,domains_detected,class,target_action\n' > "$OUT"
while IFS= read -r file; do
  rel="${file#$ROOT/}"
  domains=""
  for d in bookings payments departures packages manifest memberships subscriptions travels agents users whatsapp shop pages quran prayer forum reviews documents analytics settings; do
    if grep -qi "$d" "$file"; then domains="${domains}${domains:+|}$d"; fi
  done
  class="non-core"
  action="Retain Supabase only if explicitly approved as Muslim-app/non-Core domain; otherwise migrate"
  if printf '%s' "$domains" | grep -Eq 'bookings|payments|departures|packages|manifest|memberships|subscriptions|travels|agents'; then
    class="core-candidate"
    action="Migrate reads/commands to Core API; remove direct table mutation"
  fi
  case "$rel" in
    *useBookings*|*usePackages*|*useDepartures*|*useManifest*|*useJamaahManifest*|*useAgentData*|*useAgentMembership*|*useAdminData*|*useAdminAnalytics*) action="Migrate to Core management/marketplace/booking/manifest/analytics endpoints";;
    *usePrayer*|*useQuran*|*useDzikir*|*useIbadah*|*useRamadhan*) class="non-core"; action="Retain Supabase Muslim-app domain; document ownership";;
    *Shop*|*shop*|*Seller*|*seller*) class="non-core"; action="Retain or move to separate commerce service; not Core travel source of truth";;
  esac
  safe_file="${rel//\"/\"\"}"
  safe_domains="${domains//\"/\"\"}"
  safe_class="${class//\"/\"\"}"
  safe_action="${action//\"/\"\"}"
  printf '"%s","%s","%s","%s"\n' "$safe_file" "$safe_domains" "$safe_class" "$safe_action" >> "$OUT"
done < <(grep -RIlE 'from.*supabase|supabase\\.from|createClient' "$ROOT/src" --include='*.ts' --include='*.tsx' | sort)
echo "wrote $OUT"
wc -l "$OUT"
