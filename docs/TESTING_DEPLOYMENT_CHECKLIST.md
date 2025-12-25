# Testing System Deployment Checklist

Pre-deployment checklist to ensure the automated testing system is ready for production use.

## Pre-Deployment Verification

### 1. GitHub Actions Workflow

- [ ] Workflow file exists: `.github/workflows/daily-tests.yml`
- [ ] Workflow syntax is valid (check in GitHub Actions UI)
- [ ] Cron schedule is correct: `0 2 * * *` (2 AM UTC daily)
- [ ] Manual trigger (workflow_dispatch) is configured
- [ ] Environment variables are set correctly
- [ ] Secrets are configured (if using Slack notifications)

### 2. Test Execution Scripts

- [ ] All scripts are executable:
  ```bash
  chmod +x scripts/run-tests-with-coverage.sh
  chmod +x scripts/test-data/seed-test-data.sh
  chmod +x scripts/test-data/cleanup-test-data.sh
  ```
- [ ] Scripts work locally:
  ```bash
  ./scripts/run-tests-with-coverage.sh mana-core-auth
  ./scripts/test-data/seed-test-data.sh auth
  ./scripts/test-data/cleanup-test-data.sh auth
  ```

### 3. Test Reporting Scripts

- [ ] All Node.js scripts are present in `scripts/test-reporting/`:
  - [ ] `aggregate-coverage.js`
  - [ ] `generate-summary.js`
  - [ ] `detect-flaky-tests.js`
  - [ ] `track-metrics.js`
  - [ ] `format-metrics.js`
- [ ] Scripts run without errors:
  ```bash
  node scripts/test-reporting/aggregate-coverage.js --help
  ```

### 4. Package.json Updates

- [ ] Test commands added to root package.json:
  - [ ] `test:cov`
  - [ ] `test:seed`
  - [ ] `test:cleanup`
- [ ] Commands work from root:
  ```bash
  pnpm test:cov
  pnpm test:seed
  pnpm test:cleanup
  ```

### 5. Documentation

- [ ] Main testing guide exists: `docs/TESTING_GUIDE.md`
- [ ] Quick reference exists: `docs/TESTING_QUICK_REFERENCE.md`
- [ ] Script documentation exists: `scripts/test-reporting/README.md`
- [ ] Implementation summary exists: `docs/AUTOMATED_TESTING_SYSTEM.md`
- [ ] Documentation index updated: `docs/README.md`

### 6. Coverage Configuration

- [ ] Backend packages have `jest.config.js` with coverage thresholds
- [ ] Web packages have `vitest.config.ts` with coverage settings
- [ ] Coverage threshold is 80% globally
- [ ] Critical paths have 100% coverage requirement

### 7. Test Infrastructure

- [ ] Docker Compose configured for test databases
- [ ] PostgreSQL service runs successfully:
  ```bash
  pnpm docker:up
  docker ps | grep postgres
  ```
- [ ] Redis service runs successfully:
  ```bash
  docker ps | grep redis
  ```
- [ ] Test databases can be created and accessed

### 8. Existing Tests

- [ ] All existing tests pass locally:
  ```bash
  pnpm test
  ```
- [ ] Coverage meets threshold:
  ```bash
  pnpm test:cov
  ```
- [ ] No flaky tests detected in local runs

## First Run Checklist

### Manual Trigger Test

- [ ] Trigger workflow manually from GitHub Actions
- [ ] Workflow starts successfully
- [ ] Setup job completes
- [ ] Test matrices are generated correctly
- [ ] Backend tests run and pass
- [ ] Mobile tests run and pass (if tests exist)
- [ ] Web tests run and pass (if tests exist)
- [ ] Integration tests run and pass
- [ ] Coverage artifacts are uploaded
- [ ] Report job completes successfully
- [ ] Flaky test detection runs
- [ ] Metrics tracking completes
- [ ] Overall workflow succeeds

### Artifact Verification

- [ ] Coverage reports are available in artifacts
- [ ] Aggregated coverage report exists
- [ ] Test metrics JSON file exists
- [ ] Flaky test report exists (if flaky tests found)
- [ ] All artifacts are downloadable

### Notification Testing

- [ ] GitHub issue created on test failure (test manually)
- [ ] Slack notification sent on failure (if configured)
- [ ] Notifications include correct information
- [ ] Notifications include workflow run link

## Post-Deployment Monitoring

### First Week

- [ ] Monitor daily workflow runs
- [ ] Check for any failures
- [ ] Review flaky test reports
- [ ] Verify coverage trends
- [ ] Check performance metrics
- [ ] Address any issues quickly

### First Month

- [ ] Review overall success rate (target: 95%+)
- [ ] Analyze flaky test patterns
- [ ] Check performance regression trends
- [ ] Review coverage across all packages
- [ ] Update thresholds if needed
- [ ] Document any issues and resolutions

## Configuration Checklist

### GitHub Repository Settings

- [ ] GitHub Actions enabled
- [ ] Workflow permissions configured
- [ ] Secrets configured (if using external services):
  - [ ] `SLACK_WEBHOOK_URL` (optional)
- [ ] Branch protection rules allow automated commits (if needed)

### Environment Variables

- [ ] `NODE_VERSION`: Set to 20
- [ ] `PNPM_VERSION`: Set to 9.15.0
- [ ] `COVERAGE_THRESHOLD`: Set to 80
- [ ] Database URLs use correct test credentials

### Docker Configuration

- [ ] `docker-compose.dev.yml` includes test services
- [ ] PostgreSQL configured with test user/password
- [ ] Redis configured for testing
- [ ] Health checks configured for all services

## Rollback Plan

If the workflow fails or causes issues:

### Immediate Actions

1. Disable the workflow:
   - Go to `.github/workflows/daily-tests.yml`
   - Add `if: false` to the workflow trigger
   - Commit and push

2. Investigate the issue:
   - Review workflow logs
   - Check test output
   - Identify root cause

3. Fix the issue:
   - Update scripts or workflow
   - Test locally first
   - Push fix and re-enable workflow

### Disable Schedule

If you want to keep manual trigger but disable daily schedule:

```yaml
on:
  # schedule:
  #   - cron: '0 2 * * *'
  workflow_dispatch:
```

## Success Criteria

### Deployment Successful If

✅ Workflow runs successfully on first manual trigger
✅ All test suites execute and pass
✅ Coverage reports generated correctly
✅ Artifacts uploaded and accessible
✅ No errors in logs
✅ Documentation complete and accurate

### Ready for Production If

✅ First week of daily runs successful
✅ No critical issues identified
✅ Flaky tests identified and addressed
✅ Performance metrics baseline established
✅ Team trained on using the system
✅ Monitoring and alerts working

## Common Issues and Solutions

### Issue: Workflow fails on first run

**Solutions**:
- Check workflow syntax in GitHub Actions UI
- Verify all scripts are executable
- Test scripts locally first
- Review environment variables

### Issue: Tests fail in CI but pass locally

**Solutions**:
- Check Docker service health
- Verify database connection strings
- Ensure migrations run before tests
- Check for timing issues in tests

### Issue: Coverage reports missing

**Solutions**:
- Verify test commands include coverage flags
- Check coverage output paths
- Ensure coverage artifacts uploaded
- Review coverage configuration

### Issue: Flaky test detection not working

**Solutions**:
- Ensure multiple test runs complete
- Check test-history.json is persisted
- Verify artifact download/upload
- Review flaky detection thresholds

## Final Verification

Before enabling daily schedule:

- [ ] All checklist items completed
- [ ] Manual workflow run successful
- [ ] All artifacts available
- [ ] Documentation reviewed
- [ ] Team notified of new system
- [ ] Monitoring plan in place

## Sign-off

**Deployed By**: _________________

**Date**: _________________

**Reviewed By**: _________________

**Approval**: _________________

---

## Post-Deployment

Once deployed and verified:

- [ ] Update this checklist based on experience
- [ ] Document any issues encountered
- [ ] Share lessons learned with team
- [ ] Schedule regular reviews (monthly)
- [ ] Plan for future enhancements

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

For support, see:
- [Testing Guide](TESTING_GUIDE.md)
- [Automated Testing System](AUTOMATED_TESTING_SYSTEM.md)
- [Quick Reference](TESTING_QUICK_REFERENCE.md)
