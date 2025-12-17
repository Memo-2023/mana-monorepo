# Mana Games - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Backend runs on port 3011
- Web: Astro 5 PWA (port 4321 in dev)
- 22 curated HTML5 games in /public/games/
- AI generation via 3 providers: Google Gemini, Anthropic Claude, Azure OpenAI
- Default model: gemini-2.0-flash (fast and cost-effective)
- Games communicate via postMessage protocol (GAME_LOADED, GAME_EVENT)
- Community submissions create GitHub PRs automatically
- PWA supports full offline gameplay

## AI Models Available
1. **Gemini 2.0 Flash** - Fast, cheap, good quality (default)
2. **Gemini 2.5 Flash** - Faster, better quality
3. **Gemini 2.5 Pro** - Highest quality
4. **Claude 3.5 Haiku** - Fast, precise
5. **Claude 3.5 Sonnet** - Best code quality
6. **GPT-4o Mini** - Balanced
7. **GPT-4o** - Very good quality

## Game Genres in Catalog
- Arcade (Snake, Space Defender, Asteroid Dash)
- Puzzle (Gravity Painter, Neon Maze Runner, Word Scramble)
- Rhythm (Rhythm Defender)
- Minimal (Click Race, Color Memory, Reaction Test)
- Action (Mana Runner, Flappy Mana)
- Tower Defense (Mana Defense)
- Idle/Incremental (Mana Factory)
- Family (Fish Catcher, Balloon Pop, Memory Card Match)
