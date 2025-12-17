# WhoPixels Game Team

## Module: whopixels
**Path:** `games/whopixels`
**Description:** Web-based guessing game where players chat with AI-powered NPCs disguised as famous inventors throughout history. Players must deduce the true identity of each NPC through conversation. Built with Phaser.js for game rendering and Azure OpenAI for NPC conversations.
**Tech Stack:** Phaser.js 3, Node.js server, Azure OpenAI API, vanilla JavaScript
**Platforms:** Web (browser-based game)

## Team Overview

This team manages the WhoPixels game, an educational trivia/mystery game that combines RPG exploration with AI-driven conversational puzzles. Players navigate a pixel-art world, interact with NPCs (famous inventors in disguise), and try to guess their identities through strategic questioning.

### Team Members

| Role | File | Focus Area |
|------|------|------------|
| Product Owner | `product-owner.md` | Game design, player engagement, educational value |
| Architect | `architect.md` | Game engine architecture, AI integration, conversation system |
| Senior Developer | `senior-dev.md` | Phaser scenes, AI prompt engineering, game mechanics |
| Developer | `developer.md` | Feature implementation, bug fixes, UI/UX improvements |
| Security Engineer | `security.md` | API key security, prompt injection prevention, rate limiting |
| QA Lead | `qa-lead.md` | Testing strategy, conversation quality, edge cases |

## Key Features
- **Pixel-art RPG World**: Top-down 2D world with player movement and NPC interaction
- **AI-Powered NPCs**: 10 famous inventors (Leonardo da Vinci, Tesla, Marie Curie, etc.) with unique personalities
- **Conversation System**: Full chat history tracking with Azure OpenAI for intelligent responses
- **Identity Detection**: AI detects when player correctly guesses NPC identity via special marker `[IDENTITY_REVEALED]`
- **Character Hints**: Each NPC provides cryptic clues about their historical achievements
- **Educational Content**: Learn about inventors through interactive dialogue

## Architecture
```
games/whopixels/
├── index.html           # Main HTML entry point
├── server.js            # Node.js HTTP server + OpenAI API proxy
├── js/
│   ├── main.js         # Phaser config
│   └── scenes/
│       ├── BootScene.js       # Asset loading and texture generation
│       ├── MainMenuScene.js   # Main menu
│       ├── GameScene.js       # Pixel art editor (legacy)
│       └── RPGScene.js        # Main RPG game scene
├── data/
│   └── npc_characters.js      # NPC character data (names, personalities, hints)
├── css/
│   └── style.css              # Game styling
├── assets/                    # Game assets (sprites, images)
├── generate_assets.js         # Asset generation script
└── package.json
```

## Game Flow
1. **Boot**: Load game assets and generate pixel art textures
2. **Main Menu**: Start new game
3. **RPG Scene**:
   - Player spawns in 11x11 tile world
   - NPCs spawn at random positions
   - Player navigates using arrow keys
   - Click NPC to start conversation
4. **Conversation**:
   - Chat interface appears with conversation history
   - Player types messages
   - Azure OpenAI generates responses based on NPC personality
   - AI detects identity reveal and marks NPC as "solved"
5. **Win Condition**: Identify all 10 inventors

## NPC Character Data
Each NPC has:
- `id`: Unique identifier (1-10)
- `name`: Historical figure name (e.g., "Leonardo da Vinci")
- `personality`: Detailed personality description for AI prompt
- `hint`: Cryptic clue about their identity

**NPCs Include:**
1. Leonardo da Vinci - Renaissance polymath
2. Nikola Tesla - Electrical engineer
3. Marie Curie - Radioactivity researcher
4. Thomas Edison - Inventor with 1000+ patents
5. Ada Lovelace - First programmer
6. Archimedes - Ancient mathematician
7. Johannes Gutenberg - Printing press inventor
8. Grace Hopper - Computer pioneer
9. Alexander Graham Bell - Telephone inventor
10. Hedy Lamarr - Actress and frequency hopping inventor

## API Structure
- `POST /api/chat` - Send message to NPC, receive AI response
  - Request body: `{ message, conversationHistory, characterName, characterPersonality }`
  - Response: `{ response, identityRevealed }`
- Static file serving for all game assets

## Azure OpenAI Integration
- **Endpoint**: Configured via `AZURE_OPENAI_ENDPOINT` env var
- **API Key**: Stored in `AZURE_OPENAI_API_KEY` env var
- **Deployment**: Uses specific deployment name from `AZURE_OPENAI_DEPLOYMENT`
- **API Version**: Specified in `AZURE_OPENAI_API_VERSION`
- **Max Tokens**: Limited to 150 tokens per response
- **System Prompt**: Dynamically constructed with NPC name and personality
- **Identity Detection**: AI appends `[IDENTITY_REVEALED]` when player guesses correctly

## How to Use
```
"As the [Role] for whopixels, help me with..."
"Read games/whopixels/.agent/team/ and help me understand..."
```
