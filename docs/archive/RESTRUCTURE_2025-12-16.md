# Documentation Restructure - December 16, 2025

## Summary

Restructured documentation based on industry best practices from HackerNews discussion and HumanLayer blog post on writing effective CLAUDE.md files.

## Changes Made

### Root CLAUDE.md
- **Before:** 678 lines, 22 KB
- **After:** 176 lines, 5.7 KB
- **Reduction:** 74% smaller

#### What Was Removed
- Detailed project tables (moved conceptually to docs/)
- Extensive authentication code examples (kept brief examples, reference .claude/guidelines/)
- Object storage implementation details
- Landing page deployment procedures
- Detailed environment variable setup
- Archived projects list (13 projects)
- Code quality infrastructure TODO section

#### What Was Added
- **Critical Gotchas** section (5 key issues Claude frequently gets wrong)
- **Verification signature** (🏗️ ManaCore Monorepo) to confirm Claude read the file
- Clearer signposting to detailed documentation
- Focus on universally applicable patterns only

### Documentation Organization

#### New Structure
```
docs/
├── README.md                 # Navigation index (NEW)
├── getting-started/          # (NEW - empty for now)
├── architecture/             # (NEW - empty for now)
├── development/              # (NEW - empty for now)
├── deployment/               # (NEW - empty for now)
├── operations/               # (NEW - empty for now)
├── reference/                # (NEW - empty for now)
└── archive/                  # (NEW)
```

#### Files Deleted
- `ENV_AUDIT_SUMMARY.md` - Outdated audit (Dec 1, 2024)
- `ENV_BACKEND_MATRIX.md` - Outdated audit
- `ENV_CONFIGURATION_AUDIT.md` - Outdated audit
- `README_ENV_AUDIT.md` - Outdated audit
- `DEPENDENCY_ALIGNMENT.md` - Point-in-time snapshot

#### Files Archived
Moved to `docs/archive/`:
- `DOCKER_SETUP_ANALYSIS.md` - Analysis document
- `BACKEND_ARCHITECTURE.md` - Possibly outdated (25 KB)
- `PROJECT_OVERVIEW.md` - Possibly outdated (41 KB)
- `TESTING_SUMMARY.md` - Outdated test count
- `TESTING_IMPLEMENTATION_GUIDE.md` - Superseded
- `CHANGELOG_2025-11-24.md` - Historical
- `HETZNER_DEPLOYMENT_SUMMARY.md` - Redundant with other deployment docs

### Best Practices Applied

1. **Instruction Budget Management**
   - Kept only high-signal, universally applicable information
   - Reduced from 678 lines to 176 lines
   - AI instruction budget is ~150-200 total; we now use ~176

2. **Progressive Disclosure**
   - Main CLAUDE.md is concise entry point
   - Links to detailed .claude/guidelines/ for code patterns
   - Links to docs/ for operational procedures

3. **Critical Gotchas**
   - Turborepo infinite loops
   - Svelte 5 runes only
   - Auth integration requirements
   - Go-style error handling
   - Environment variable prefixes

4. **Verification Mechanism**
   - Added project signature requirement (🏗️ ManaCore Monorepo)
   - Helps detect when Claude stops following instructions

## Backup

Original CLAUDE.md saved as `CLAUDE.md.backup` (22 KB, 678 lines).

## Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| CLAUDE.md lines | 678 | 176 | -74% |
| CLAUDE.md size | 22 KB | 5.7 KB | -74% |
| docs/ files | 50+ | 43 | -7 deleted, -7 archived |
| Documented projects | 18 (active + archived) | 6 (active only) | -67% |

## Next Steps (Phase 2)

Future improvements to consider:

1. **Consolidate Environment Docs**
   - Merge remaining env docs into single `docs/reference/environment-matrix.md`

2. **Split DEPLOYMENT_ARCHITECTURE.md**
   - Currently 2,814 lines (81 KB)
   - Should be 6-8 separate documents

3. **Reorganize docs/**
   - Move files into logical subdirectories
   - Create topic-based navigation

4. **Consolidate Authentication Docs**
   - Keep `.claude/guidelines/authentication.md` (code patterns)
   - Keep separate (already exists in .claude/guidelines/)

## References

- [HN Discussion on CLAUDE.md](https://news.ycombinator.com/item?id=46098838)
- [HumanLayer: Writing a Good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

## Key Insights

1. **Length matters** - Shorter files = better AI performance
2. **Universal over specific** - Only include broadly applicable patterns
3. **Verification is critical** - Add canary instructions to detect compliance
4. **Progressive disclosure** - Link to details rather than inline everything
5. **Information density** - Every line should justify its inclusion
