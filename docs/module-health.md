# Module Health Report

_Generated 2026-04-14 — git window: 6.months_

**Score** = `LOC × log₂(changes + 2)`. High score = big *and* churny = refactor candidate.

**Totals:** web `103,053` · api `4,400` · services `35,660` LOC

## Frontend modules (`apps/mana/apps/web/src/lib/modules`)

| Module | LOC | Files | Largest file (LOC) | Changes (6mo) | Last changed | Score |
|---|---:|---:|---|---:|---|---:|
| `calendar` | 8,379 | 38 | `calendar/components/EventDetailModal.svelte` (657) | 26 | 19 hours ago | 40,281 |
| `todo` | 6,817 | 56 | `todo/stores/tasks.svelte.ts` (472) | 27 | 3 hours ago | 33,117 |
| `times` | 5,334 | 32 | `times/types.ts` (454) | 10 | 17 hours ago | 19,122 |
| `body` | 4,337 | 22 | `body/stores/body.svelte.ts` (467) | 11 | 46 minutes ago | 16,049 |
| `period` | 3,182 | 19 | `period/ListView.svelte` (780) | 17 | 17 hours ago | 13,517 |
| `dreams` | 2,835 | 10 | `dreams/ListView.svelte` (998) | 19 | 17 hours ago | 12,452 |
| `skilltree` | 3,178 | 20 | `skilltree/types.ts` (589) | 12 | 17 hours ago | 12,100 |
| `contacts` | 2,590 | 17 | `contacts/components/pages/ContactPage.svelte` (564) | 19 | 46 minutes ago | 11,376 |
| `habits` | 2,792 | 14 | `habits/ListView.svelte` (593) | 12 | 17 hours ago | 10,630 |
| `events` | 2,899 | 19 | `events/views/DetailView.svelte` (555) | 10 | 17 hours ago | 10,393 |
| `places` | 2,386 | 10 | `places/ListView.svelte` (1017) | 17 | 19 hours ago | 10,136 |
| `moodlit` | 2,143 | 13 | `moodlit/components/mood/MoodFullscreen.svelte` (613) | 10 | 2 days ago | 7,683 |
| `photos` | 2,147 | 17 | `photos/ListView.svelte` (430) | 9 | 46 minutes ago | 7,427 |
| `stretch` | 4,685 | 13 | `stretch/ListView.svelte` (710) | 1 | 2 hours ago | 7,426 |
| `memoro` | 1,352 | 12 | `memoro/views/DetailView.svelte` (320) | 23 | 70 minutes ago | 6,278 |
| `zitare` | 1,667 | 16 | `zitare/views/DetailView.svelte` (249) | 11 | 2 days ago | 6,169 |
| `guides` | 1,765 | 10 | `guides/views/DetailView.svelte` (583) | 9 | 46 minutes ago | 6,106 |
| `music` | 1,600 | 13 | `music/ListView.svelte` (402) | 11 | 17 hours ago | 5,921 |
| `news` | 1,909 | 16 | `news/ListView.svelte` (364) | 6 | 17 hours ago | 5,727 |
| `plants` | 2,421 | 16 | `plants/views/DetailView.svelte` (744) | 3 | 46 minutes ago | 5,621 |
| `chat` | 1,440 | 14 | `chat/views/DetailView.svelte` (273) | 12 | 17 hours ago | 5,483 |
| `calc` | 1,872 | 16 | `calc/components/CasioSkin.svelte` (285) | 5 | 2 days ago | 5,255 |
| `companion` | 1,460 | 9 | `companion/components/CompanionChat.svelte` (538) | 10 | 2 hours ago | 5,234 |
| `core` | 1,414 | 13 | `core/widgets/NutritionProgressWidget.svelte` (177) | 9 | 46 minutes ago | 4,892 |
| `inventory` | 2,076 | 20 | `inventory/queries.ts` (327) | 3 | 17 hours ago | 4,820 |
| `sleep` | 2,303 | 11 | `sleep/ListView.svelte` (559) | 2 | 2 hours ago | 4,606 |
| `questions` | 1,227 | 12 | `questions/stores/answers.svelte.ts` (271) | 10 | 17 hours ago | 4,399 |
| `firsts` | 1,835 | 8 | `firsts/ListView.svelte` (1266) | 3 | 17 hours ago | 4,261 |
| `picture` | 1,096 | 9 | `picture/ListView.svelte` (379) | 9 | 4 days ago | 3,792 |
| `who` | 1,035 | 8 | `who/views/PlayView.svelte` (306) | 8 | 2 days ago | 3,438 |
| `cards` | 993 | 13 | `cards/components/CreateDeckModal.svelte` (156) | 9 | 17 hours ago | 3,435 |
| `notes` | 981 | 9 | `notes/ListView.svelte` (405) | 9 | 17 hours ago | 3,394 |
| `journal` | 1,418 | 8 | `journal/ListView.svelte` (854) | 3 | 17 hours ago | 3,292 |
| `mood` | 1,534 | 9 | `mood/ListView.svelte` (548) | 2 | 2 hours ago | 3,068 |
| `drink` | 1,461 | 8 | `drink/ListView.svelte` (820) | 2 | 19 hours ago | 2,922 |
| `presi` | 767 | 9 | `presi/stores/decks.svelte.ts` (233) | 10 | 4 days ago | 2,750 |
| `storage` | 825 | 10 | `storage/stores/files.svelte.ts` (269) | 8 | 17 hours ago | 2,741 |
| `uload` | 885 | 7 | `uload/queries.ts` (270) | 5 | 4 days ago | 2,485 |
| `finance` | 905 | 8 | `finance/ListView.svelte` (417) | 4 | 17 hours ago | 2,339 |
| `citycorners` | 787 | 10 | `citycorners/queries.ts` (175) | 5 | 4 days ago | 2,209 |
| `recipes` | 1,352 | 8 | `recipes/ListView.svelte` (884) | 1 | 17 hours ago | 2,143 |
| `meditate` | 2,068 | 15 | `meditate/components/SessionPlayer.svelte` (551) | 0 | 17 hours ago | 2,068 |
| `automations` | 998 | 6 | `automations/ListView.svelte` (723) | 2 | 2 days ago | 1,996 |
| `food` | 1,742 | 15 | `food/mutations.test.ts` (294) | 0 | 46 minutes ago | 1,742 |
| `playground` | 715 | 9 | `playground/ListView.svelte` (155) | 2 | 4 days ago | 1,430 |
| `context` | 447 | 7 | `context/queries.ts` (155) | 5 | 4 days ago | 1,255 |
| `goals` | 556 | 2 | `goals/GoalEditor.svelte` (303) | 2 | 46 minutes ago | 1,112 |
| `mail` | 1,038 | 9 | `mail/ListView.svelte` (575) | 0 | 20 hours ago | 1,038 |
| `subscription` | 793 | 1 | `subscription/ListView.svelte` (793) | 0 | 2 hours ago | 793 |
| `api-keys` | 686 | 1 | `api-keys/ListView.svelte` (686) | 0 | 2 hours ago | 686 |
| `spiral` | 624 | 4 | `spiral/stores/mana-spiral.svelte.ts` (232) | 0 | 9 days ago | 624 |
| `themes` | 280 | 1 | `themes/ListView.svelte` (280) | 1 | 78 minutes ago | 444 |
| `activity` | 183 | 1 | `activity/ListView.svelte` (183) | 2 | 46 minutes ago | 366 |
| `admin` | 265 | 1 | `admin/ListView.svelte` (265) | 0 | 2 hours ago | 265 |
| `myday` | 231 | 1 | `myday/ListView.svelte` (231) | 0 | 18 hours ago | 231 |
| `profile` | 181 | 1 | `profile/ListView.svelte` (181) | 0 | 2 hours ago | 181 |
| `settings` | 101 | 1 | `settings/ListView.svelte` (101) | 0 | 2 hours ago | 101 |
| `help` | 40 | 1 | `help/ListView.svelte` (40) | 0 | 2 hours ago | 40 |
| `feedback` | 21 | 1 | `feedback/ListView.svelte` (21) | 0 | 2 hours ago | 21 |

## API modules (`apps/api/src/modules`)

| Module | LOC | Files | Largest file (LOC) | Changes (6mo) | Last changed | Score |
|---|---:|---:|---|---:|---|---:|
| `who` | 1,065 | 4 | `who/data/characters.ts` (490) | 3 | 4 days ago | 2,473 |
| `research` | 827 | 4 | `research/orchestrator.ts` (389) | 2 | 2 days ago | 1,654 |
| `traces` | 307 | 1 | `traces/routes.ts` (307) | 3 | 2 days ago | 713 |
| `todo` | 301 | 1 | `todo/routes.ts` (301) | 3 | 2 days ago | 699 |
| `presi` | 265 | 2 | `presi/routes.ts` (188) | 4 | 2 days ago | 685 |
| `news` | 190 | 1 | `news/routes.ts` (190) | 3 | 2 days ago | 441 |
| `picture` | 158 | 1 | `picture/routes.ts` (158) | 3 | 6 days ago | 367 |
| `guides` | 219 | 1 | `guides/routes.ts` (219) | 1 | 6 days ago | 347 |
| `storage` | 134 | 1 | `storage/routes.ts` (134) | 3 | 6 days ago | 311 |
| `music` | 122 | 1 | `music/routes.ts` (122) | 3 | 6 days ago | 283 |
| `chat` | 130 | 1 | `chat/routes.ts` (130) | 2 | 6 days ago | 260 |
| `contacts` | 102 | 1 | `contacts/routes.ts` (102) | 3 | 6 days ago | 237 |
| `food` | 222 | 1 | `food/routes.ts` (222) | 0 | 47 minutes ago | 222 |
| `plants` | 118 | 1 | `plants/routes.ts` (118) | 1 | 47 minutes ago | 187 |
| `context` | 87 | 1 | `context/routes.ts` (87) | 2 | 6 days ago | 174 |
| `calendar` | 111 | 1 | `calendar/routes.ts` (111) | 0 | 12 days ago | 111 |
| `moodlit` | 42 | 1 | `moodlit/routes.ts` (42) | 0 | 12 days ago | 42 |

## Services (`services/`)

| Module | LOC | Files | Largest file (LOC) | Changes (6mo) | Last changed | Score |
|---|---:|---:|---|---:|---|---:|
| `mana-auth` | 5,206 | 32 | `encryption-vault/index.ts` (607) | 45 | 47 minutes ago | 28,917 |
| `mana-notify` | 3,139 | 22 | `services/mana-notify/internal/handler/notifications.go` (493) | 20 | 6 days ago | 13,998 |
| `mana-sync` | 2,484 | 13 | `services/mana-sync/internal/sync/handler.go` (436) | 22 | 47 minutes ago | 11,389 |
| `mana-tts` | 2,444 | 10 | `services/mana-tts/app/main.py` (678) | 12 | 6 days ago | 9,305 |
| `mana-credits` | 2,140 | 23 | `sync-billing.ts` (357) | 15 | 2 hours ago | 8,747 |
| `mana-stt` | 1,948 | 9 | `services/mana-stt/app/main.py` (393) | 20 | 6 days ago | 8,687 |
| `mana-search` | 2,029 | 14 | `services/mana-search/internal/search/searxng.go` (305) | 16 | 4 days ago | 8,461 |
| `mana-llm` | 2,314 | 22 | `services/mana-llm/src/providers/ollama.py` (349) | 9 | 5 days ago | 8,005 |
| `mana-media` | 1,571 | 15 | `upload.ts` (393) | 24 | 47 minutes ago | 7,384 |
| `mana-events` | 2,063 | 20 | `services/mana-events/src/__tests__/items.test.ts` (344) | 5 | 6 days ago | 5,792 |
| `mana-api-gateway` | 1,381 | 12 | `services/mana-api-gateway/internal/service/apikeys.go` (257) | 11 | 7 days ago | 5,110 |
| `mana-crawler` | 1,411 | 8 | `services/mana-crawler/internal/crawler/crawler.go` (365) | 8 | 7 days ago | 4,687 |
| `mana-geocoding` | 900 | 10 | `services/mana-geocoding/src/routes/geocode.ts` (219) | 11 | 3 days ago | 3,330 |
| `mana-subscriptions` | 830 | 15 | `subscriptions.ts` (223) | 5 | 2 days ago | 2,330 |
| `mana-user` | 792 | 20 | `tags.ts` (211) | 4 | 6 days ago | 2,047 |
| `news-ingester` | 876 | 10 | `services/news-ingester/src/sources.ts` (261) | 3 | 5 days ago | 2,034 |
| `mana-image-gen` | 851 | 5 | `services/mana-image-gen/app/main.py` (365) | 3 | 6 days ago | 1,976 |
| `mana-video-gen` | 685 | 3 | `services/mana-video-gen/app/main.py` (405) | 3 | 6 days ago | 1,591 |
| `mana-analytics` | 470 | 12 | `feedback.ts` (127) | 5 | 6 days ago | 1,319 |
| `mana-mail` | 1,267 | 20 | `jmap-client.ts` (323) | 0 | 20 hours ago | 1,267 |
| `mana-voice-bot` | 507 | 2 | `services/mana-voice-bot/app/main.py` (505) | 2 | 6 days ago | 1,014 |
| `mana-landing-builder` | 352 | 8 | `services/mana-landing-builder/src/builder/builder.service.ts` (225) | 5 | 7 days ago | 988 |
