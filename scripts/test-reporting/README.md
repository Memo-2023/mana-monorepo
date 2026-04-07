# Test Reporting Scripts

Collection of Node.js scripts for aggregating, analyzing, and reporting on test results in the Mana monorepo.

## Scripts Overview

| Script | Purpose | Used By |
|--------|---------|---------|
| `aggregate-coverage.js` | Merge coverage reports from multiple test suites | Daily Tests workflow |
| `generate-summary.js` | Create GitHub Actions summary from test results | Daily Tests workflow |
| `detect-flaky-tests.js` | Identify tests that fail intermittently | Daily Tests workflow |
| `track-metrics.js` | Record and track test performance over time | Daily Tests workflow |
| `format-metrics.js` | Format metrics for GitHub summary display | Daily Tests workflow |

## Usage

### Aggregate Coverage

Merges multiple `coverage-summary.json` files into a single aggregated report.

```bash
node aggregate-coverage.js <input-dir> <output-dir>

# Example
node aggregate-coverage.js ./coverage-reports ./aggregated-coverage
```

**Inputs**:
- `input-dir`: Directory containing coverage artifacts (searches recursively)

**Outputs**:
- `total-coverage.json`: Aggregated coverage data
- `summary.md`: Markdown summary of coverage

**Exit Codes**:
- `0`: Success and coverage meets 80% threshold
- `1`: Coverage below 80% threshold or error

### Generate Summary

Creates a formatted test summary for GitHub Actions.

```bash
node generate-summary.js <test-results-dir>

# Example
node generate-summary.js ./coverage-reports
```

**Inputs**:
- `test-results-dir`: Directory with test coverage reports

**Outputs**:
- Markdown summary to stdout (captured by GitHub Actions)

### Detect Flaky Tests

Analyzes test results over time to identify flaky tests.

```bash
node detect-flaky-tests.js <test-results-dir>

# Example
node detect-flaky-tests.js ./test-results
```

**Inputs**:
- `test-results-dir`: Directory with test result files
- `test-history.json`: Historical test data (auto-created)

**Outputs**:
- `flaky-tests.json`: List of flaky tests (if any found)
- `test-history.json`: Updated historical data

**Configuration**:
- `FLAKY_THRESHOLD`: 0.1 (test fails 10%+ = flaky)
- `MIN_RUNS`: 3 (minimum runs to detect flakiness)

### Track Metrics

Records test execution time and performance metrics.

```bash
node track-metrics.js <test-results-dir>

# Example
node track-metrics.js ./test-results
```

**Inputs**:
- `test-results-dir`: Directory with test result files

**Outputs**:
- `metrics.json`: Current test metrics
- `metrics-report.md`: Formatted metrics report
- `metrics-history.json`: Historical metrics (90 days)

**Exit Codes**:
- `0`: Success, no performance regressions
- `1`: Performance regression detected

### Format Metrics

Formats metrics.json for display in GitHub Actions summary.

```bash
node format-metrics.js <metrics-file>

# Example
node format-metrics.js ./test-results/metrics.json
```

**Inputs**:
- `metrics-file`: Path to metrics.json

**Outputs**:
- Formatted markdown to stdout

## Data Formats

### Coverage Summary Format

```json
{
  "total": {
    "lines": { "total": 1000, "covered": 850, "pct": 85 },
    "statements": { "total": 1200, "covered": 980, "pct": 81.67 },
    "functions": { "total": 150, "covered": 135, "pct": 90 },
    "branches": { "total": 400, "covered": 340, "pct": 85 }
  },
  "suites": {
    "mana-auth": { /* same structure */ },
    "chat-backend": { /* same structure */ }
  }
}
```

### Test History Format

```json
{
  "suite::testName": {
    "name": "should validate JWT tokens",
    "suite": "AuthService",
    "runs": [
      { "timestamp": "2025-12-25T00:00:00Z", "status": "passed", "duration": 150 },
      { "timestamp": "2025-12-24T00:00:00Z", "status": "failed", "duration": 200 }
    ]
  }
}
```

### Metrics Format

```json
{
  "timestamp": "2025-12-25T02:00:00Z",
  "totalTests": 500,
  "totalDuration": 45000,
  "averageDuration": 90,
  "slowestTest": {
    "name": "should complete full auth flow",
    "duration": 2500,
    "suite": "integration/auth-flow.spec.ts"
  },
  "suiteMetrics": {
    "mana-auth": {
      "tests": 120,
      "duration": 15000,
      "slowestTest": { /* ... */ }
    }
  }
}
```

## Development

### Adding New Metrics

To track additional metrics:

1. Modify `track-metrics.js` to collect new data
2. Update `format-metrics.js` to display new metrics
3. Update this README with new data format

### Testing Scripts Locally

```bash
# Create mock test results
mkdir -p test-data/coverage-mana-auth
echo '{"total":{"lines":{"total":100,"covered":85,"pct":85}}}' > test-data/coverage-mana-auth/coverage-summary.json

# Run aggregation
node aggregate-coverage.js test-data aggregated-output

# View output
cat aggregated-output/summary.md
```

## Integration with CI/CD

These scripts are used in `.github/workflows/daily-tests.yml`:

```yaml
- name: Aggregate coverage reports
  run: |
    node scripts/test-reporting/aggregate-coverage.js coverage-reports aggregated-coverage

- name: Generate test summary
  run: |
    node scripts/test-reporting/generate-summary.js coverage-reports > $GITHUB_STEP_SUMMARY

- name: Detect flaky tests
  run: |
    node scripts/test-reporting/detect-flaky-tests.js test-results

- name: Track metrics
  run: |
    node scripts/test-reporting/track-metrics.js test-results
```

## Troubleshooting

### No coverage files found

**Problem**: `Found 0 coverage files`

**Solutions**:
- Ensure tests ran with coverage: `pnpm test:cov`
- Check coverage output directory exists
- Verify `coverage-summary.json` is generated

### Flaky test detection not working

**Problem**: Known flaky tests not detected

**Solutions**:
- Need minimum 3 test runs for detection
- Check `test-history.json` has data
- Verify test names are consistent across runs

### Performance regression false positive

**Problem**: Script reports regression when none exists

**Solutions**:
- Check if test suite changed (more/fewer tests)
- Review `metrics-history.json` for anomalies
- Adjust regression threshold if needed

## Dependencies

All scripts use Node.js built-in modules only:
- `fs`: File system operations
- `path`: Path manipulation
- No external npm packages required

This keeps the scripts lightweight and reduces dependency risks.
