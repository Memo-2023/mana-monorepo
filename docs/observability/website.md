# Website Builder — Observability

_Shipped 2026-04-23 (M7)._

Every metric below lives on mana-api's `/metrics` scrape endpoint (port 3060, unauthenticated — relies on reverse-proxy to keep it off the public internet).

## Metrics

### Write path

| Metric | Type | Labels | What it tells you |
|---|---|---|---|
| `mana_api_website_publish_total` | Counter | `result` = success \| slug_taken \| invalid \| error | Publish-attempt outcome mix. |
| `mana_api_website_publish_duration_seconds` | Histogram | — | End-to-end publish latency (validation + transaction). |
| `mana_api_website_domain_verify_total` | Counter | `result` = verified \| failed | Custom-domain DNS check outcomes. |

### Public surface

| Metric | Type | Labels | What it tells you |
|---|---|---|---|
| `mana_api_website_public_reads_total` | Counter | `result` = hit \| not_found | Anonymous reads of `/public/sites/:slug`. |
| `mana_api_website_public_read_age_seconds` | Histogram | — | Age of the served snapshot at read time. A bimodal distribution (many <10s AND many >1h) tells you the edge cache is working. |
| `mana_api_website_host_resolve_total` | Counter | `result` = hit \| miss \| error | Custom-host → slug resolutions from the SvelteKit hook. |
| `mana_api_website_submissions_total` | Counter | `result` = received \| spam \| rate_limit \| not_found \| invalid | Form submissions received. |

## Quick PromQL queries

**Publish success rate (30 min rolling):**
```promql
sum(rate(mana_api_website_publish_total{result="success"}[30m]))
/
sum(rate(mana_api_website_publish_total[30m]))
```

**p95 publish latency:**
```promql
histogram_quantile(0.95, sum by (le) (rate(mana_api_website_publish_duration_seconds_bucket[10m])))
```

**Custom-host resolve hit rate (production target: >98% once bindings stabilise):**
```promql
sum(rate(mana_api_website_host_resolve_total{result="hit"}[5m]))
/
sum(rate(mana_api_website_host_resolve_total[5m]))
```

**Spam-to-received ratio (form submissions):**
```promql
sum(rate(mana_api_website_submissions_total{result="spam"}[1h]))
/
sum(rate(mana_api_website_submissions_total{result=~"received|spam"}[1h]))
```

## Alerts (recommended)

- **`website-publish-failure-spike`** — fires when `rate(mana_api_website_publish_total{result="error"}[10m]) > 0.1/s`. Indicates DB trouble or an unhandled exception path.
- **`website-public-cold`** — fires when `rate(mana_api_website_public_reads_total[1h]) > 10/s AND rate(mana_api_website_public_read_age_seconds_count{le="10"}[1h]) / rate(mana_api_website_public_read_age_seconds_count[1h]) > 0.5`. Half the traffic is hitting fresh snapshots = the edge cache isn't doing its job, usually a CF config drift.
- **`website-domain-verify-failed-burst`** — fires when `increase(mana_api_website_domain_verify_total{result="failed"}[1h]) > 20`. Either ops broke the DNS target (CNAME not pointing anywhere) or one angry user is thrashing.
- **`website-form-spam-storm`** — fires when `rate(mana_api_website_submissions_total{result="spam"}[5m]) > 1/s`. Honeypot is holding, but a motivated attacker might move on to CAPTCHA-busting next.

## Dashboard

Grafana dashboard lives at `grafana.internal/d/website-builder` (add it to the existing "Mana Services" folder). Panels: publish volume + outcome mix, publish latency heatmap, submissions/spam split, host-resolve hit ratio, domain-verify trend.

## Orphan-asset GC

Read-only scan script at `apps/api/scripts/gc-website-assets.ts`. Run manually for now:

```bash
MANA_SERVICE_KEY=… DATABASE_URL=… bun apps/api/scripts/gc-website-assets.ts
```

The script:
1. Walks every `published_snapshots.blob` and `submissions.payload` to collect referenced `mediaId`s.
2. Asks mana-media for everything scoped to `app=website`.
3. Reports items older than 30 days that aren't referenced anywhere.

**Current status: report-only.** No deletion. After 2–3 weeks of production reports showing the candidate list is stable and doesn't include false positives, we flip a `--delete` flag in a follow-up commit.

## Future (M7.x)

- Per-site view counts. Would require a cheap counter table (`website.site_views { site_id, day, count }`) incremented from the public-read handler. Skipped in M7 first-pass because the analytics block already covers the per-visit needs; add when someone asks for a dashboard inside the editor.
- Cloudflare hostname status reconciliation. Once the CF SaaS API is wired, a periodic poller should compare our `custom_domains.status` against CF's `hostname.ssl.status` and flag drift.
- Submission-payload retention job. Fields are kept indefinitely today; when target-delivery lands (M4.x) the job runs after delivery and nulls the payload, keeping only IDs + status.
