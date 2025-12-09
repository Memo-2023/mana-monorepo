# Documentation Audit Summary
**Date:** 2025-12-07
**Full Report:** [documentation-audit-2025-12-07.md](./documentation-audit-2025-12-07.md)

## Quick Stats

- **Active Projects:** 17 (apps/) + 5 (games/) + 1 (service)
- **Documentation Coverage:** 11/17 active projects have CLAUDE.md
- **Critical Issues:** 3
- **Overall Score:** 7/10

## Top 3 Critical Issues

### 1. 🚨 Active vs Archived Confusion
**5 projects exist in BOTH `apps/` and `apps-archived/`:**
- maerchenzauber
- memoro
- wisekeep
- reader
- nutriphi

Root CLAUDE.md lists them as archived, but they're in the active workspace.

### 2. ❌ Missing Major Project Documentation
**No CLAUDE.md files for:**
- **manadeck** (major project with full stack)
- **picture** (AI image generation)
- **quote** (backend + web + mobile)
- Several other active projects

### 3. 📝 Incomplete Root Documentation
**Root CLAUDE.md only documents 6/17 active projects:**
- Missing: calendar, clock, context, todo, quote, and 6+ others
- Outdated commands (presi:dev, mail:dev for archived projects)

## Immediate Action Items

1. ✅ **Resolve duplicates** - Decide on maerchenzauber, memoro, wisekeep, reader, nutriphi status
2. ✅ **Create CLAUDE.md** for manadeck and picture (high priority)
3. ✅ **Update root CLAUDE.md** with complete project list (17 projects)
4. ✅ **Fix commands** - Remove presi:dev, mail:dev; add calendar:dev, clock:dev, todo:dev
5. ✅ **Backend ports table** - Document all 12 backends with port numbers

## Documentation Quality by Project

### Excellent (10/10)
- ✅ calendar (German, comprehensive)
- ✅ clock (German, comprehensive)
- ✅ todo (German, comprehensive)

### Good (8-9/10)
- ✅ chat
- ✅ contacts
- ✅ context
- ✅ zitare

### Missing
- ❌ manadeck
- ❌ picture
- ❌ quote
- ❌ 8+ other projects

## Key Findings

### Projects Not in Root Docs
Missing from root CLAUDE.md but active:
- calendar (port 3014)
- clock (port 3017)
- context (mobile only)
- todo (port 3018)
- quote (full stack)
- maerchenzauber* (duplicate)
- memoro* (duplicate)
- nutriphi* (duplicate)
- reader* (duplicate)
- wisekeep* (duplicate)

### Landing Pages Mismatch
- **Actual:** 7 landing pages (chat, picture, manacore, manadeck, zitare, calendar, clock)
- **Documented:** 5 (missing calendar, clock)
- **Deploy scripts:** 10 (includes non-existent: presi, mail, moodlit)

### Shared Packages Gap
- **Actual:** 34 packages
- **Documented:** 10 packages
- **Missing:** 24 packages undocumented

## Priority Matrix

| Issue | Priority | Impact | Effort |
|-------|----------|--------|--------|
| Resolve active/archived confusion | 🔴 HIGH | Critical | Medium |
| Create manadeck CLAUDE.md | 🔴 HIGH | High | Low |
| Create picture CLAUDE.md | 🔴 HIGH | High | Low |
| Update root projects table | 🔴 HIGH | High | Low |
| Backend ports reference | 🟡 MEDIUM | Medium | Low |
| Landing pages docs fix | 🟡 MEDIUM | Medium | Low |
| Shared packages docs | 🟡 MEDIUM | Medium | High |
| Games section | 🟢 LOW | Low | Low |

## Recommendations

### Week 1
- Resolve duplicate projects (remove from apps/ OR apps-archived/)
- Create CLAUDE.md for manadeck, picture
- Update root CLAUDE.md with all 17 active projects

### Week 2-4
- Document all backend ports
- Fix landing pages section
- Update environment variables docs
- Add games overview

### Ongoing
- Create CLAUDE.md for all remaining projects
- Automated documentation validation
- Version compatibility matrix

## Files to Review/Update

1. `/CLAUDE.md` - Add missing projects, fix commands
2. `/apps/manadeck/CLAUDE.md` - CREATE
3. `/apps/picture/CLAUDE.md` - CREATE
4. `/docs/ENVIRONMENT_VARIABLES.md` - Add missing projects
5. `/package.json` - Clean up commands for archived projects

## Success Metrics

**Target Documentation Coverage:**
- ✅ 100% of active projects in root CLAUDE.md
- ✅ 100% of active projects have project CLAUDE.md
- ✅ All backend ports documented
- ✅ Landing pages list is accurate
- ✅ No duplicate projects between apps/ and apps-archived/

**Current Status:**
- ⚠️ 35% of active projects in root docs (6/17)
- ⚠️ 65% have project CLAUDE.md (11/17)
- ⚠️ 42% of backends documented (5/12)
- ⚠️ Landing pages 71% accurate (5/7)
- ❌ 5 duplicate projects

---

**Next Steps:** Review full audit report and prioritize fixes based on your team's needs.
