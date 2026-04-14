# Module Coupling Report

_Generated 2026-04-14_

- **fan-in** = how many other modules import from this module (high = shared / core)
- **fan-out** = how many other modules this module imports from (high = tightly coupled / leaky)

Ideal: most modules have fan-in ≤ 2 and fan-out ≤ 2. Outliers are refactor candidates.

## Ranked by fan-in (shared modules)

| Module | fan-in | fan-out | Imported by |
|---|---:|---:|---|
| `calendar` | 1 | 1 | `todo` |
| `period` | 1 | 0 | `core` |
| `food` | 1 | 0 | `body` |
| `todo` | 1 | 1 | `calendar` |
| `admin` | 0 | 0 | — |
| `api-keys` | 0 | 0 | — |
| `automations` | 0 | 0 | — |
| `body` | 0 | 1 | — |
| `calc` | 0 | 0 | — |
| `cards` | 0 | 0 | — |
| `chat` | 0 | 0 | — |
| `citycorners` | 0 | 0 | — |
| `companion` | 0 | 0 | — |
| `contacts` | 0 | 0 | — |
| `context` | 0 | 0 | — |
| `core` | 0 | 1 | — |
| `dreams` | 0 | 0 | — |
| `drink` | 0 | 0 | — |
| `events` | 0 | 0 | — |
| `activity` | 0 | 0 | — |
| `feedback` | 0 | 0 | — |
| `finance` | 0 | 0 | — |
| `firsts` | 0 | 0 | — |
| `goals` | 0 | 0 | — |
| `guides` | 0 | 0 | — |
| `habits` | 0 | 0 | — |
| `help` | 0 | 0 | — |
| `inventory` | 0 | 0 | — |
| `journal` | 0 | 0 | — |
| `mail` | 0 | 0 | — |
| `meditate` | 0 | 0 | — |
| `memoro` | 0 | 0 | — |
| `mood` | 0 | 0 | — |
| `moodlit` | 0 | 0 | — |
| `music` | 0 | 0 | — |
| `myday` | 0 | 0 | — |
| `news` | 0 | 0 | — |
| `notes` | 0 | 0 | — |
| `photos` | 0 | 0 | — |
| `picture` | 0 | 0 | — |
| `places` | 0 | 0 | — |
| `plants` | 0 | 0 | — |
| `playground` | 0 | 0 | — |
| `presi` | 0 | 0 | — |
| `profile` | 0 | 0 | — |
| `questions` | 0 | 0 | — |
| `recipes` | 0 | 0 | — |
| `settings` | 0 | 0 | — |
| `skilltree` | 0 | 0 | — |
| `sleep` | 0 | 0 | — |
| `spiral` | 0 | 0 | — |
| `storage` | 0 | 0 | — |
| `stretch` | 0 | 0 | — |
| `subscription` | 0 | 0 | — |
| `themes` | 0 | 0 | — |
| `times` | 0 | 0 | — |
| `uload` | 0 | 0 | — |
| `who` | 0 | 0 | — |
| `zitare` | 0 | 0 | — |

## Ranked by fan-out (leaky modules)

| Module | fan-out | fan-in | Imports from |
|---|---:|---:|---|
| `body` | 1 | 0 | `food` |
| `calendar` | 1 | 1 | `todo` |
| `core` | 1 | 0 | `period` |
| `todo` | 1 | 1 | `calendar` |
| `admin` | 0 | 0 | — |
| `api-keys` | 0 | 0 | — |
| `automations` | 0 | 0 | — |
| `calc` | 0 | 0 | — |
| `cards` | 0 | 0 | — |
| `chat` | 0 | 0 | — |
| `citycorners` | 0 | 0 | — |
| `companion` | 0 | 0 | — |
| `contacts` | 0 | 0 | — |
| `context` | 0 | 0 | — |
| `period` | 0 | 1 | — |
| `dreams` | 0 | 0 | — |
| `drink` | 0 | 0 | — |
| `events` | 0 | 0 | — |
| `activity` | 0 | 0 | — |
| `feedback` | 0 | 0 | — |
| `finance` | 0 | 0 | — |
| `firsts` | 0 | 0 | — |
| `food` | 0 | 1 | — |
| `goals` | 0 | 0 | — |
| `guides` | 0 | 0 | — |
| `habits` | 0 | 0 | — |
| `help` | 0 | 0 | — |
| `inventory` | 0 | 0 | — |
| `journal` | 0 | 0 | — |
| `mail` | 0 | 0 | — |
| `meditate` | 0 | 0 | — |
| `memoro` | 0 | 0 | — |
| `mood` | 0 | 0 | — |
| `moodlit` | 0 | 0 | — |
| `music` | 0 | 0 | — |
| `myday` | 0 | 0 | — |
| `news` | 0 | 0 | — |
| `notes` | 0 | 0 | — |
| `photos` | 0 | 0 | — |
| `picture` | 0 | 0 | — |
| `places` | 0 | 0 | — |
| `plants` | 0 | 0 | — |
| `playground` | 0 | 0 | — |
| `presi` | 0 | 0 | — |
| `profile` | 0 | 0 | — |
| `questions` | 0 | 0 | — |
| `recipes` | 0 | 0 | — |
| `settings` | 0 | 0 | — |
| `skilltree` | 0 | 0 | — |
| `sleep` | 0 | 0 | — |
| `spiral` | 0 | 0 | — |
| `storage` | 0 | 0 | — |
| `stretch` | 0 | 0 | — |
| `subscription` | 0 | 0 | — |
| `themes` | 0 | 0 | — |
| `times` | 0 | 0 | — |
| `uload` | 0 | 0 | — |
| `who` | 0 | 0 | — |
| `zitare` | 0 | 0 | — |
