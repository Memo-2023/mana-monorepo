#!/usr/bin/env sh
# generate-status-page.sh
# Fragt VictoriaMetrics ab und erzeugt eine statische HTML-Statusseite.
# Läuft in einem Alpine-Container im Docker-Netz (http://victoriametrics:9090)
# oder auf dem Host (http://localhost:9090).
#
# Ausgabe: /output/index.html (gemountet als /Volumes/ManaData/landings/status/)

set -eu

VM_URL="${VICTORIAMETRICS_URL:-http://victoriametrics:9090}"
OUTPUT="${OUTPUT_FILE:-/output/index.html}"
TMPDIR_LOCAL="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_LOCAL"' EXIT

# ── Daten aus VictoriaMetrics holen ────────────────────────────────────────

fetch_metric() {
  curl -sf --max-time 10 \
    "${VM_URL}/api/v1/query?query=$(printf '%s' "$1" | sed 's/ /%20/g;s/{/%7B/g;s/}/%7D/g;s/=~/%3D~/g;s/|/%7C/g;s/"/%22/g')" \
    2>/dev/null || echo '{"status":"error","data":{"result":[]}}'
}

SUCCESS_JSON="$(fetch_metric 'probe_success{job=~"blackbox-web|blackbox-api|blackbox-infra|blackbox-gpu"}')"
DURATION_JSON="$(fetch_metric 'probe_duration_seconds{job=~"blackbox-web|blackbox-api|blackbox-infra|blackbox-gpu"}')"

# ── Hilfsfunktionen ─────────────────────────────────────────────────────────

# Gibt den probe_success-Wert für eine Instanz zurück (0 oder 1)
get_success() {
  instance="$1"
  echo "$SUCCESS_JSON" | jq -r --arg inst "$instance" \
    '.data.result[] | select(.metric.instance == $inst) | .value[1]' 2>/dev/null || echo "0"
}

# Gibt die Antwortzeit in ms zurück
get_duration_ms() {
  instance="$1"
  val=$(echo "$DURATION_JSON" | jq -r --arg inst "$instance" \
    '.data.result[] | select(.metric.instance == $inst) | .value[1]' 2>/dev/null || echo "")
  if [ -n "$val" ] && [ "$val" != "null" ]; then
    printf "%.0f" "$(echo "$val * 1000" | awk '{printf "%.1f", $1}')"
  else
    echo ""
  fi
}

# Alle Instanzen einer Job-Gruppe, sortiert
get_instances() {
  job="$1"
  echo "$SUCCESS_JSON" | jq -r --arg job "$job" \
    '.data.result[] | select(.metric.job == $job) | .metric.instance' 2>/dev/null | sort
}

# Freundlicher Name aus URL
friendly_name() {
  url="$1"
  # Entferne https:// und .mana.how
  name="${url#https://}"
  name="${name%.mana.how}"
  # Entferne /health suffix
  name="${name%/health}"
  # Erster Buchstabe groß (POSIX-kompatibel)
  printf '%s' "$name" | awk '{print toupper(substr($0,1,1)) substr($0,2)}'
}

# Zählt UP-Dienste einer Job-Gruppe
count_up() {
  job="$1"
  echo "$SUCCESS_JSON" | jq -r --arg job "$job" \
    '[.data.result[] | select(.metric.job == $job) | .value[1]] | map(tonumber) | add // 0' \
    2>/dev/null || echo "0"
}

count_total() {
  job="$1"
  echo "$SUCCESS_JSON" | jq -r --arg job "$job" \
    '[.data.result[] | select(.metric.job == $job)] | length' \
    2>/dev/null || echo "0"
}

# ── Service-Rows HTML ────────────────────────────────────────────────────────

render_rows() {
  job="$1"
  instances="$(get_instances "$job")"
  if [ -z "$instances" ]; then
    printf '<tr><td colspan="3" class="no-data">Noch keine Daten — Blackbox Exporter lädt…</td></tr>\n'
    return
  fi
  echo "$instances" | while IFS= read -r inst; do
    [ -z "$inst" ] && continue
    success="$(get_success "$inst")"
    ms="$(get_duration_ms "$inst")"
    name="$(friendly_name "$inst")"
    if [ "$success" = "1" ]; then
      status_class="up"
      status_text="UP"
      ms_html="${ms:+<span class=\"ms\">${ms}ms</span>}"
    else
      status_class="down"
      status_text="DOWN"
      ms_html=""
    fi
    printf '<tr class="%s"><td class="dot-cell"><span class="dot %s"></span></td><td class="name">%s<span class="url">%s</span></td><td class="status-cell">%s %s</td></tr>\n' \
      "$status_class" "$status_class" "$name" "$inst" \
      "<span class=\"badge $status_class\">$status_text</span>" \
      "${ms_html:-}"
  done
}

# ── Gesamtstatus ─────────────────────────────────────────────────────────────

web_up="$(count_up blackbox-web)";   web_total="$(count_total blackbox-web)"
api_up="$(count_up blackbox-api)";   api_total="$(count_total blackbox-api)"
infra_up="$(count_up blackbox-infra)"; infra_total="$(count_total blackbox-infra)"
gpu_up="$(count_up blackbox-gpu)";   gpu_total="$(count_total blackbox-gpu)"

total_up=$(( web_up + api_up + infra_up + gpu_up ))
total_all=$(( web_total + api_total + infra_total + gpu_total ))
total_down=$(( total_all - total_up ))

if [ "$total_down" -eq 0 ] && [ "$total_all" -gt 0 ]; then
  overall_class="all-good"
  overall_icon="✓"
  overall_text="Alle Systeme operational"
elif [ "$total_up" -gt $(( total_all / 2 )) ]; then
  overall_class="partial"
  overall_icon="⚠"
  overall_text="Teilweise Beeinträchtigungen (${total_down} Dienste down)"
else
  overall_class="outage"
  overall_icon="✕"
  overall_text="Größerer Ausfall (${total_down} von ${total_all} Diensten down)"
fi

TIMESTAMP="$(date -u '+%d. %B %Y, %H:%M Uhr UTC')"

# ── HTML generieren ──────────────────────────────────────────────────────────

cat > "${OUTPUT}.tmp" << HTMLEOF
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="60">
  <title>ManaCore Status</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0a0a0a;
      --surface: #141414;
      --border: #222;
      --text: #e8e8e8;
      --muted: #666;
      --green: #22c55e;
      --red: #ef4444;
      --yellow: #f59e0b;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      font-size: 15px;
      line-height: 1.5;
      min-height: 100vh;
    }

    /* ── Banner ── */
    .banner {
      padding: 32px 24px;
      text-align: center;
      border-bottom: 1px solid var(--border);
    }
    .banner.all-good  { background: rgba(34,197,94,.08); }
    .banner.partial   { background: rgba(245,158,11,.08); }
    .banner.outage    { background: rgba(239,68,68,.08); }

    .banner-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .all-good .banner-icon { background: rgba(34,197,94,.15); color: var(--green); }
    .partial  .banner-icon { background: rgba(245,158,11,.15); color: var(--yellow); }
    .outage   .banner-icon { background: rgba(239,68,68,.15); color: var(--red); }

    .banner h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
    .banner .updated { font-size: 13px; color: var(--muted); margin-top: 8px; }

    /* ── Layout ── */
    .container { max-width: 860px; margin: 0 auto; padding: 32px 16px; }

    /* ── Summary Row ── */
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 32px;
    }
    @media (max-width: 600px) { .summary { grid-template-columns: repeat(2, 1fr); } }

    .summary-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    .summary-card .count {
      font-size: 26px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }
    .summary-card .label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
    .count.green { color: var(--green); }
    .count.yellow { color: var(--yellow); }
    .count.red { color: var(--red); }

    /* ── Section ── */
    .section { margin-bottom: 24px; }
    .section-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 8px;
    }
    .section-header h2 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
    .section-header .fraction { font-size: 13px; color: var(--muted); }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    tr { border-bottom: 1px solid var(--border); }
    tr:last-child { border-bottom: none; }
    tr.up:hover, tr.down:hover { background: rgba(255,255,255,.025); }
    td { padding: 11px 14px; vertical-align: middle; }

    .dot-cell { width: 32px; padding-right: 0; }
    .dot {
      display: inline-block;
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot.up   { background: var(--green); box-shadow: 0 0 6px rgba(34,197,94,.5); }
    .dot.down { background: var(--red);   box-shadow: 0 0 6px rgba(239,68,68,.4); }

    .name { font-weight: 500; }
    .url  { display: block; font-size: 12px; color: var(--muted); font-weight: 400; margin-top: 1px; }

    .status-cell { text-align: right; white-space: nowrap; }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .05em;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .badge.up   { background: rgba(34,197,94,.12); color: var(--green); }
    .badge.down { background: rgba(239,68,68,.12); color: var(--red); }

    .ms { font-size: 12px; color: var(--muted); margin-left: 8px; }

    .no-data { color: var(--muted); font-size: 13px; text-align: center; padding: 20px; }

    /* ── Footer ── */
    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 12px;
      color: var(--muted);
    }
    footer a { color: var(--muted); text-decoration: none; }
    footer a:hover { color: var(--text); }
  </style>
</head>
<body>

<div class="banner ${overall_class}">
  <div class="banner-icon">${overall_icon}</div>
  <h1>${overall_text}</h1>
  <p class="updated">Zuletzt aktualisiert: ${TIMESTAMP} · Auto-Refresh alle 60 s</p>
</div>

<div class="container">

  <div class="summary">
    <div class="summary-card">
      <div class="count $([ "$web_up" -eq "$web_total" ] && echo green || echo yellow)">${web_up}/${web_total}</div>
      <div class="label">Web Apps</div>
    </div>
    <div class="summary-card">
      <div class="count $([ "$api_up" -eq "$api_total" ] && echo green || echo yellow)">${api_up}/${api_total}</div>
      <div class="label">API Backends</div>
    </div>
    <div class="summary-card">
      <div class="count $([ "$infra_up" -eq "$infra_total" ] && echo green || echo yellow)">${infra_up}/${infra_total}</div>
      <div class="label">Infrastruktur</div>
    </div>
    <div class="summary-card">
      <div class="count $([ "$gpu_up" -eq "$gpu_total" ] && echo green || ( [ "$gpu_up" -eq 0 ] && echo red || echo yellow))">${gpu_up}/${gpu_total}</div>
      <div class="label">GPU Dienste</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <h2>Web Apps</h2>
      <span class="fraction">${web_up} von ${web_total} online</span>
    </div>
    <table>
$(render_rows blackbox-web)
    </table>
  </div>

  <div class="section">
    <div class="section-header">
      <h2>API Backends</h2>
      <span class="fraction">${api_up} von ${api_total} online</span>
    </div>
    <table>
$(render_rows blackbox-api)
    </table>
  </div>

  <div class="section">
    <div class="section-header">
      <h2>Infrastruktur</h2>
      <span class="fraction">${infra_up} von ${infra_total} online</span>
    </div>
    <table>
$(render_rows blackbox-infra)
    </table>
  </div>

  <div class="section">
    <div class="section-header">
      <h2>GPU Dienste</h2>
      <span class="fraction">${gpu_up} von ${gpu_total} online</span>
    </div>
    <table>
$(render_rows blackbox-gpu)
    </table>
  </div>

  <footer>
    <p>Powered by <a href="https://mana.how">ManaCore</a> · Metriken via Prometheus Blackbox Exporter</p>
  </footer>

</div>
</body>
</html>
HTMLEOF

mv "${OUTPUT}.tmp" "$OUTPUT"
echo "$(date '+%H:%M:%S') Status-Seite generiert → $OUTPUT (${total_up}/${total_all} online)"

# ── status.json für ManaScore Live-Badge ─────────────────────────────────────

JSON_OUTPUT="$(dirname "$OUTPUT")/status.json"
TIMESTAMP_ISO="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

echo "$SUCCESS_JSON" | jq \
  --arg ts "$TIMESTAMP_ISO" \
  --argjson total_up "$total_up" \
  --argjson total_all "$total_all" \
  '{
    updated: $ts,
    summary: { up: $total_up, total: $total_all },
    services: (
      .data.result | map({
        key: (
          .metric.instance
          | ltrimstr("https://")
          | if . == "mana.how" then "manacore"
            else (. | rtrimstr(".mana.how") | rtrimstr("/health"))
            end
        ),
        value: (.value[1] == "1")
      }) | from_entries
    )
  }' > "${JSON_OUTPUT}.tmp" && mv "${JSON_OUTPUT}.tmp" "$JSON_OUTPUT"

echo "$(date '+%H:%M:%S') status.json generiert → $JSON_OUTPUT"
