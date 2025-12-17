# WhoPixels Game - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Game runs on Node.js HTTP server (port 3000)
- Uses Azure OpenAI API for all NPC conversations
- Database: None (stateless, client-side state only)
- Auth: None (open-access game)
- NPCs: 10 famous inventors with unique personalities
- AI Model: Configured via Azure OpenAI deployment
- Token Limit: 150 tokens per response
- Identity Detection: Server-side parsing of `[IDENTITY_REVEALED]` marker
- Game Engine: Phaser.js 3.55.2 (loaded via CDN)
- Asset Generation: Programmatic pixel art created in BootScene

## Environment Variables Required
```env
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_VERSION=2023-05-15
```

## Game Architecture
- **BootScene**: Asset loading and texture generation
- **MainMenuScene**: Start screen
- **GameScene**: Legacy pixel art editor (not actively used)
- **RPGScene**: Main game with player movement and NPC interaction

## NPC Character List
1. Leonardo da Vinci - Renaissance polymath
2. Nikola Tesla - Electrical engineer
3. Marie Curie - Radioactivity researcher
4. Thomas Edison - Prolific inventor
5. Ada Lovelace - First programmer
6. Archimedes - Ancient mathematician
7. Johannes Gutenberg - Printing press inventor
8. Grace Hopper - Computer pioneer
9. Alexander Graham Bell - Telephone inventor
10. Hedy Lamarr - Actress and inventor

## Key Files
- `server.js` - Node.js HTTP server with OpenAI proxy
- `js/scenes/RPGScene.js` - Main game scene (35KB, core gameplay)
- `js/scenes/BootScene.js` - Asset generation (15KB)
- `data/npc_characters.js` - NPC data with personalities
- `index.html` - Game entry point

## Future Enhancements
- User authentication for save/load functionality
- Persistent game state across sessions
- Leaderboard/scoring system
- More NPC characters
- Multiplayer mode
- Mobile-responsive controls
