#!/bin/bash
# Generate HTML Dashboard from test results
#
# Usage: ./generate-dashboard.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
DASHBOARD_DIR="${SCRIPT_DIR}/dashboard"
DASHBOARD_FILE="${DASHBOARD_DIR}/index.html"

mkdir -p "$DASHBOARD_DIR"

# Read latest results
STAGING_RESULTS="${RESULTS_DIR}/results-staging.json"
PROD_RESULTS="${RESULTS_DIR}/results-production.json"

# Helper function to get status color
get_status_class() {
    case "$1" in
        "healthy"|"pass") echo "status-healthy" ;;
        "degraded"|"warn") echo "status-degraded" ;;
        "fail"|"down") echo "status-down" ;;
        *) echo "status-unknown" ;;
    esac
}

# Helper function to get status icon
get_status_icon() {
    case "$1" in
        "healthy"|"pass") echo "✅" ;;
        "degraded"|"warn") echo "⚠️" ;;
        "fail"|"down") echo "❌" ;;
        *) echo "❓" ;;
    esac
}

# Read results or use defaults
if [ -f "$STAGING_RESULTS" ]; then
    STAGING_STATUS=$(jq -r '.status // "unknown"' "$STAGING_RESULTS")
    STAGING_TIME=$(jq -r '.timestamp // "N/A"' "$STAGING_RESULTS")
    STAGING_HEALTH=$(jq -r '.tests.health.status // "unknown"' "$STAGING_RESULTS")
    STAGING_JWKS=$(jq -r '.tests.jwks.status // "unknown"' "$STAGING_RESULTS")
    STAGING_HEADERS=$(jq -r '.tests.security_headers.status // "unknown"' "$STAGING_RESULTS")
    STAGING_RESPONSE=$(jq -r '.tests.response_time.time_ms // "N/A"' "$STAGING_RESULTS")
else
    STAGING_STATUS="unknown"
    STAGING_TIME="Never tested"
    STAGING_HEALTH="unknown"
    STAGING_JWKS="unknown"
    STAGING_HEADERS="unknown"
    STAGING_RESPONSE="N/A"
fi

if [ -f "$PROD_RESULTS" ]; then
    PROD_STATUS=$(jq -r '.status // "unknown"' "$PROD_RESULTS")
    PROD_TIME=$(jq -r '.timestamp // "N/A"' "$PROD_RESULTS")
    PROD_HEALTH=$(jq -r '.tests.health.status // "unknown"' "$PROD_RESULTS")
    PROD_JWKS=$(jq -r '.tests.jwks.status // "unknown"' "$PROD_RESULTS")
    PROD_HEADERS=$(jq -r '.tests.security_headers.status // "unknown"' "$PROD_RESULTS")
    PROD_RESPONSE=$(jq -r '.tests.response_time.time_ms // "N/A"' "$PROD_RESULTS")
else
    PROD_STATUS="unknown"
    PROD_TIME="Never tested"
    PROD_HEALTH="unknown"
    PROD_JWKS="unknown"
    PROD_HEADERS="unknown"
    PROD_RESPONSE="N/A"
fi

GENERATED_AT=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

cat > "$DASHBOARD_FILE" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="300">
    <title>ManaCore Auth Status</title>
    <style>
        :root {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --bg-card: #334155;
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --green: #22c55e;
            --yellow: #eab308;
            --red: #ef4444;
            --blue: #3b82f6;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            padding: 2rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 3rem;
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            color: var(--text-secondary);
            font-size: 1rem;
        }

        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .environment-card {
            background: var(--bg-secondary);
            border-radius: 1rem;
            padding: 1.5rem;
            border: 1px solid var(--bg-card);
        }

        .env-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--bg-card);
        }

        .env-name {
            font-size: 1.5rem;
            font-weight: 600;
        }

        .overall-status {
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
        }

        .status-healthy { background: var(--green); color: #000; }
        .status-degraded { background: var(--yellow); color: #000; }
        .status-down { background: var(--red); color: #fff; }
        .status-unknown { background: var(--bg-card); color: var(--text-secondary); }

        .tests-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .test-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            background: var(--bg-card);
            border-radius: 0.5rem;
        }

        .test-name {
            font-weight: 500;
        }

        .test-status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .test-value {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .last-check {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--bg-card);
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        footer {
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
            padding-top: 2rem;
            border-top: 1px solid var(--bg-card);
        }

        .refresh-note {
            margin-top: 0.5rem;
            font-size: 0.75rem;
        }

        @media (max-width: 768px) {
            body { padding: 1rem; }
            h1 { font-size: 1.75rem; }
            .status-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔐 ManaCore Auth Status</h1>
            <p class="subtitle">Service Health Dashboard</p>
        </header>

        <div class="status-grid">
            <!-- Staging Environment -->
            <div class="environment-card">
                <div class="env-header">
                    <span class="env-name">🧪 Staging</span>
                    <span class="overall-status STAGING_STATUS_CLASS">STAGING_STATUS_TEXT</span>
                </div>
                <div class="tests-list">
                    <div class="test-item">
                        <span class="test-name">Health Endpoint</span>
                        <span class="test-status">STAGING_HEALTH_ICON</span>
                    </div>
                    <div class="test-item">
                        <span class="test-name">JWKS (EdDSA Keys)</span>
                        <span class="test-status">STAGING_JWKS_ICON</span>
                    </div>
                    <div class="test-item">
                        <span class="test-name">Security Headers</span>
                        <span class="test-status">STAGING_HEADERS_ICON</span>
                    </div>
                    <div class="test-item">
                        <span class="test-name">Response Time</span>
                        <span class="test-status">
                            <span class="test-value">STAGING_RESPONSE_TIMEms</span>
                        </span>
                    </div>
                </div>
                <div class="last-check">
                    Last checked: STAGING_LAST_CHECK
                </div>
            </div>

            <!-- Production Environment -->
            <div class="environment-card">
                <div class="env-header">
                    <span class="env-name">🚀 Production</span>
                    <span class="overall-status PROD_STATUS_CLASS">PROD_STATUS_TEXT</span>
                </div>
                <div class="tests-list">
                    <div class="test-item">
                        <span class="test-name">Health Endpoint</span>
                        <span class="test-status">PROD_HEALTH_ICON</span>
                    </div>
                    <div class="test-item">
                        <span class="test-name">JWKS (EdDSA Keys)</span>
                        <span class="test-status">PROD_JWKS_ICON</span>
                    </div>
                    <div class="test-item">
                        <span class="test-name">Security Headers</span>
                        <span class="test-status">PROD_HEADERS_ICON</span>
                    </div>
                    <div class="test-item">
                        <span class="test-name">Response Time</span>
                        <span class="test-status">
                            <span class="test-value">PROD_RESPONSE_TIMEms</span>
                        </span>
                    </div>
                </div>
                <div class="last-check">
                    Last checked: PROD_LAST_CHECK
                </div>
            </div>
        </div>

        <footer>
            <p>Dashboard generated: GENERATED_AT</p>
            <p class="refresh-note">Auto-refreshes every 5 minutes</p>
        </footer>
    </div>
</body>
</html>
HTMLEOF

# Replace placeholders with actual values
sed -i.bak "s/STAGING_STATUS_CLASS/$(get_status_class "$STAGING_STATUS")/g" "$DASHBOARD_FILE"
sed -i.bak "s/STAGING_STATUS_TEXT/${STAGING_STATUS^^}/g" "$DASHBOARD_FILE"
sed -i.bak "s/STAGING_HEALTH_ICON/$(get_status_icon "$STAGING_HEALTH")/g" "$DASHBOARD_FILE"
sed -i.bak "s/STAGING_JWKS_ICON/$(get_status_icon "$STAGING_JWKS")/g" "$DASHBOARD_FILE"
sed -i.bak "s/STAGING_HEADERS_ICON/$(get_status_icon "$STAGING_HEADERS")/g" "$DASHBOARD_FILE"
sed -i.bak "s/STAGING_RESPONSE_TIME/${STAGING_RESPONSE}/g" "$DASHBOARD_FILE"
sed -i.bak "s/STAGING_LAST_CHECK/${STAGING_TIME}/g" "$DASHBOARD_FILE"

sed -i.bak "s/PROD_STATUS_CLASS/$(get_status_class "$PROD_STATUS")/g" "$DASHBOARD_FILE"
sed -i.bak "s/PROD_STATUS_TEXT/${PROD_STATUS^^}/g" "$DASHBOARD_FILE"
sed -i.bak "s/PROD_HEALTH_ICON/$(get_status_icon "$PROD_HEALTH")/g" "$DASHBOARD_FILE"
sed -i.bak "s/PROD_JWKS_ICON/$(get_status_icon "$PROD_JWKS")/g" "$DASHBOARD_FILE"
sed -i.bak "s/PROD_HEADERS_ICON/$(get_status_icon "$PROD_HEADERS")/g" "$DASHBOARD_FILE"
sed -i.bak "s/PROD_RESPONSE_TIME/${PROD_RESPONSE}/g" "$DASHBOARD_FILE"
sed -i.bak "s/PROD_LAST_CHECK/${PROD_TIME}/g" "$DASHBOARD_FILE"

sed -i.bak "s/GENERATED_AT/${GENERATED_AT}/g" "$DASHBOARD_FILE"

# Clean up backup files
rm -f "${DASHBOARD_FILE}.bak"

echo "Dashboard generated: $DASHBOARD_FILE"
