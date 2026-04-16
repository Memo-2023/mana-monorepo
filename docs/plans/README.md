# Plans

Design + rollout plans, grouped by topic. Plans are long-form docs with
baked-in decisions, phasing, open questions, and (when shipped) a
history section with commit refs.

## AI / Workbench roadmap

The Mana AI Workbench has evolved in three successive planned waves —
each one laying foundations the next one relies on:

```
  User hat einen Companion (v0 — shipped before these docs)
        │
        ▼
  AI Missions + Proposals + Policy + Revert
        │
        ▼
  Mission Key-Grants  ←  ai-mission-key-grant.md  ✅
    (encrypted inputs decryptable by the server runner)
        │
        ▼
  Multi-Agent Workbench  ←  multi-agent-workbench.md  ✅
    (named agents, per-agent policy/memory/budget,
     identity-aware Actor, scene→agent lens)
        │
        ▼
  Team Workbench  ←  team-workbench.md  📝 (not started)
    (multi-user + shared AI context,
     admin lens on team members)
```

| Plan | Status | Scope |
|---|---|---|
| [`ai-mission-key-grant.md`](./ai-mission-key-grant.md) | ✅ Shipped | Per-mission RSA-wrapped key grant so `mana-ai` can decrypt allowlisted encrypted records when user opts in. |
| [`multi-agent-workbench.md`](./multi-agent-workbench.md) | ✅ Shipped | Identity-aware Actor + named AI agents owning missions + per-agent policy + scene lens. 28 tools across 11 modules including server-side web-research. |
| [`workbench-templates.md`](./workbench-templates.md) | ✅ T1 Shipped | Generalised templates: 3 agent-templates + 3 non-AI workbench starter-kits. Seed-handler registry for per-module data seeding. |
| [`team-workbench.md`](./team-workbench.md) | 📝 Forward-looking | TeamSpace with membership, team-encrypted records, admin lens on team members. Reuses Actor.principalId + key-wrapping patterns from the two above. |

Cross-references:

- Architecture narrative: [`docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md`](../architecture/COMPANION_BRAIN_ARCHITECTURE.md) §20 (AI Workbench base), §21 (Mission Grants), §22 (Multi-Agent), §23 (Reasoning Loop + Research + Debug)
- Non-plan ideas backlog: [`docs/future/AI_AGENTS_IDEAS.md`](../future/AI_AGENTS_IDEAS.md)
- Service-internal notes: [`services/mana-ai/CLAUDE.md`](../../services/mana-ai/CLAUDE.md)
- Webapp-internal notes: [`apps/mana/CLAUDE.md`](../../apps/mana/CLAUDE.md) → "AI Workbench" section

## Other plans

| Plan | Topic |
|---|---|
| [`mail-module-plan.md`](./mail-module-plan.md) | Mail module — IMAP/SMTP integration |
| [`news-research-module.md`](./news-research-module.md) | News + research pipeline |
