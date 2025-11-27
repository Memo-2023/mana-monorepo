class RPGScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RPGScene' });
    }

    preload() {
        // Wir verwenden die in BootScene erstellten Texturen
    }

    create() {
        console.log('RPGScene create wird aufgerufen');
        
        // Initialisiere NPC-Status
        this.initNPCState();
        
        // Spielwelt erstellen
        this.createWorld();
        
        // Spieler erstellen
        this.createPlayer();
        
        // NPCs erstellen
        this.createNPCs();
        
        // Kamera einrichten
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true);
        
        // Steuerung einrichten
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // UI erstellen
        this.createUI();
        
        console.log('RPGScene create abgeschlossen');
    }
    
    createWorld() {
        // Einfache Welt mit Kacheln erstellen
        this.map = {
            widthInPixels: 440,  // Angepasste Spielfeldgröße
            heightInPixels: 440,
            tileWidth: 40,
            tileHeight: 40
        };
        
        // Hintergrund
        this.add.tileSprite(0, 0, this.map.widthInPixels, this.map.heightInPixels, 'background')
            .setOrigin(0, 0)
            .setScale(1.0); // Doppelte Skalierung für größeres Bild
        
        // Erstelle eine Gruppe für Hindernisse
        this.obstacles = this.physics.add.staticGroup();
        
        // Definiere die Tile-Typen
        const tileTypes = [
            { key: 'tile_grass', isObstacle: false },
            { key: 'tile_grass_flower', isObstacle: false },
            { key: 'tile_dirt', isObstacle: false },
            { key: 'tile_dirt_stone', isObstacle: false },
            { key: 'tile_stone_wall', isObstacle: true },
            { key: 'tile_stone_wall_flower', isObstacle: true }
        ];
        
        // Größe des Spielfelds (angepasst für das 440x440 Spielfeld)
        const gridSize = 11; // 11x11 Raster für 440x440 Pixel (40 Pixel pro Kachel)
        
        // Erstelle das Spielfeld
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                let tileType;
                
                // Erstelle Muster für die Welt
                if (x === 0 || y === 0 || x === gridSize-1 || y === gridSize-1) {
                    // Tür in der oberen Mauer für NPCs
                    if (y === 0 && x === Math.floor(gridSize / 2)) {
                        // Tür (kein Hindernis)
                        tileType = tileTypes[2]; // Erde als Tür
                    } else {
                        // Steinwände am Rand
                        tileType = Math.random() < 0.3 ? tileTypes[5] : tileTypes[4]; // Steinwand oder Steinwand mit Blumen
                    }
                } else {
                    // Innerer Bereich - Mischung aus Gras und Erde
                    const rand = Math.random();
                    if (rand < 0.4) {
                        tileType = tileTypes[0]; // Gras
                    } else if (rand < 0.7) {
                        tileType = tileTypes[1]; // Gras mit Blumen
                    } else if (rand < 0.9) {
                        tileType = tileTypes[2]; // Erde
                    } else {
                        tileType = tileTypes[3]; // Erde mit Steinen
                    }
                }
                
                // Erstelle das Tile mit doppelter Größe
                const tile = this.add.image(
                    x * 40 + 20, 
                    y * 40 + 20, 
                    tileType.key
                );
                tile.setScale(2.0); // Doppelte Skalierung
                
                // Wenn es ein Hindernis ist, füge es zur Hindernisgruppe hinzu
                if (tileType.isObstacle) {
                    // Erstelle ein unsichtbares Rechteck für die Kollision
                    const obstacle = this.add.rectangle(
                        x * 40 + 20, 
                        y * 40 + 20, 
                        40 * 2, 40 * 2 // Doppelte Größe für Kollision
                    );
                    
                    // Füge das Hindernis zur Gruppe hinzu
                    this.obstacles.add(obstacle);
                }
            }
        }
    }
    
    createPlayer() {
        // Spieler in der Mitte der Karte platzieren
        this.player = this.physics.add.sprite(
            this.map.widthInPixels / 2, // Mitte der Karte
            this.map.heightInPixels / 2, 
            'player_down' // Verwende die neue Textur
        );
        
        // Spieler-Größe anpassen - doppelte Skalierung
        this.player.setScale(2.4); // Doppelte Skalierung (1.2 * 2)
        
        // Kollisionen mit Hindernissen
        this.physics.add.collider(this.player, this.obstacles);
        
        // Spieler-Grenzen setzen
        this.player.setCollideWorldBounds(true);
    }
    

    
    createUI() {
        // Zurück-Button
        const backButton = this.add.text(10, 10, 'Zurück zum Menü', { 
            fontSize: '18px', 
            fill: '#fff',
            backgroundColor: '#4a4a4a',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setInteractive();
        
        backButton.on('pointerover', () => {
            backButton.setStyle({ fill: '#ff0' });
        });

        backButton.on('pointerout', () => {
            backButton.setStyle({ fill: '#fff' });
        });

        backButton.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });
        
        // Spielanleitung
        this.add.text(10, 50, 'Pfeiltasten zum Bewegen', { 
            fontSize: '16px', 
            fill: '#fff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 5, y: 2 }
        }).setScrollFactor(0);
    }
    
    createNPCs() {
        console.log('createNPCs wird aufgerufen');
        
        // Importiere die NPC-Charaktere aus der npc_characters.js-Datei
        try {
            // Versuche, die NPC-Charaktere aus der externen Datei zu laden
            this.npcCharacters = window.npcCharacters || [];
            
            if (!this.npcCharacters || this.npcCharacters.length === 0) {
                console.error('Keine NPC-Charaktere gefunden! Stelle sicher, dass npc_characters.js geladen wurde.');
                // Fallback zu einigen Standard-Charakteren
                this.npcCharacters = [
                    {
                        id: 1,
                        name: "Leonardo da Vinci",
                        personality: "Ein vielseitiger Universalgelehrter der Renaissance.",
                        hint: "Meine Skizzenbücher enthalten Flugmaschinen und anatomische Studien."
                    },
                    {
                        id: 2,
                        name: "Nikola Tesla",
                        personality: "Ein exzentrischer Elektroingenieur mit visionären Ideen.",
                        hint: "Meine Arbeiten mit Wechselstrom revolutionierten die Energienutzung."
                    }
                ];
            }
        } catch (error) {
            console.error('Fehler beim Laden der NPC-Charaktere:', error);
            // Fallback zu einigen Standard-Charakteren
            this.npcCharacters = [
                {
                    id: 1,
                    name: "Leonardo da Vinci",
                    personality: "Ein vielseitiger Universalgelehrter der Renaissance.",
                    hint: "Meine Skizzenbücher enthalten Flugmaschinen und anatomische Studien."
                },
                {
                    id: 2,
                    name: "Nikola Tesla",
                    personality: "Ein exzentrischer Elektroingenieur mit visionären Ideen.",
                    hint: "Meine Arbeiten mit Wechselstrom revolutionierten die Energienutzung."
                }
            ];
        }
        
        console.log('NPC-Charaktere geladen:', this.npcCharacters.length);
        
        // Array für alle NPCs im Spiel
        this.npcs = [];
        
        // Aktiver NPC (der, mit dem der Spieler gerade interagiert)
        this.npc = null;
        
        // Speichere den Status der NPCs
        this.npcState = {
            isInConversation: false,
            isWaitingForResponse: false,
            identityRevealed: false,
            discoveredNPCs: [],
            currentNpcIndex: -1
        };
        
        // Dialog-Box für den NPC
        this.npcDialog = this.add.text(0, 0, 'Hallo! Ich bin ein NPC.\nDrücke E zum Sprechen.', {
            fontSize: '12px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 5 },
            wordWrap: { width: 200 }
        });
        this.npcDialog.setVisible(false);
        
        // Interaktions-Prompt
        this.interactionPrompt = this.add.text(0, 0, 'Drücke E zum Sprechen', {
            fontSize: '10px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 3, y: 3 }
        });
        this.interactionPrompt.setVisible(false);
        
        // Erstelle den ersten NPC
        this.createNewNPC();
    }
    
    // Methode zum Erstellen eines neuen NPCs
    createNewNPC() {
        console.log('createNewNPC wird aufgerufen');
        
        // Initialisiere npcState, wenn es noch nicht existiert
        if (!this.npcState) {
            this.initNPCState();
        }
        
        // Debug-Ausgabe der bereits entdeckten NPCs
        console.log('Bereits entdeckte NPCs:', this.npcState.discoveredNPCs);
        
        // Wähle einen zufälligen NPC-Charakter, der noch nicht entdeckt wurde
        // UND der nicht der aktuelle NPC ist (falls vorhanden)
        let availableCharacters = this.npcCharacters.filter(char => 
            !this.npcState.discoveredNPCs.includes(char.id)
        );
        
        // Wenn es einen aktuellen NPC gibt, stelle sicher, dass wir nicht denselben Charakter erneut auswählen
        if (this.npc && this.npc.characterId) {
            availableCharacters = availableCharacters.filter(char => char.id !== this.npc.characterId);
            console.log(`Aktueller NPC ${this.npc.characterName} (ID: ${this.npc.characterId}) wird aus der Auswahl ausgeschlossen.`);
        }
        
        console.log('Verfügbare Charaktere:', availableCharacters.length);
        availableCharacters.forEach(char => {
            console.log(`- ${char.name} (ID: ${char.id})`);
        });
        
        // Wenn keine Charaktere mehr verfügbar sind, verwende alle Charaktere außer dem aktuellen
        if (availableCharacters.length === 0) {
            console.log('Keine neuen Charaktere verfügbar, verwende alle außer dem aktuellen.');
            availableCharacters = this.npcCharacters.filter(char => {
                if (this.npc && this.npc.characterId) {
                    return char.id !== this.npc.characterId;
                }
                return true;
            });
            
            if (availableCharacters.length === 0) {
                console.log('Keine Charaktere verfügbar!');
                return null;
            }
        }
        
        const randomIndex = Math.floor(Math.random() * availableCharacters.length);
        const selectedCharacter = availableCharacters[randomIndex];
        
        console.log('Ausgewählter Charakter:', selectedCharacter.name, '(ID:', selectedCharacter.id, ')');
        console.log('Persönlichkeit:', selectedCharacter.personality);
        
        // Feste Position in der Mitte des Bildschirms
        // Positioniere den NPC an der Tür in der oberen Mauer
        const doorX = Math.floor(this.map.widthInPixels / 2);
        const doorY = 40; // Knapp unterhalb der oberen Mauer (angepasst für 440x440 Spielfeld)
        
        // Verwende die Türposition
        const x = doorX;
        const y = doorY;
        
        console.log(`NPC wird an der Tür (${x}, ${y}) erstellt`);
        
        // Erstelle den NPC
        const newNpc = this.physics.add.sprite(x, y, 'npc_down');
        newNpc.setScale(2.4); // Doppelte Skalierung (1.2 * 2)
        
        // NPC ist im Anonymitätsmodus (komplett schwarz)
        newNpc.setTint(0x000000);
        
        // Speichere die Charakter-ID im NPC-Objekt
        newNpc.characterId = selectedCharacter.id;
        newNpc.characterName = selectedCharacter.name;
        newNpc.characterPersonality = selectedCharacter.personality;
        
        // Animation: NPC läuft durch die Tür herein
        // Starte an der Türposition
        newNpc.y = doorY;
        
        // Animiere den NPC, damit er durch die Tür hereinläuft
        this.tweens.add({
            targets: newNpc,
            y: this.map.heightInPixels / 2, // Zielposition in der Mitte des Spielfelds
            duration: 2000,
            ease: 'Linear', // Gleichmäßige Bewegung für einen Laufeffekt
            onUpdate: () => {
                // Aktualisiere die Position des Debug-Textes während der Animation
                if (newNpc.debugText) {
                    newNpc.debugText.x = newNpc.x;
                    newNpc.debugText.y = newNpc.y + 20;
                }
                
                // Wechsle zwischen verschiedenen Frames, um eine Laufanimation zu simulieren
                if (Math.floor(Date.now() / 150) % 2 === 0) {
                    newNpc.setTexture('npc_down');
                } else {
                    // Wenn es eine alternative Textur gibt, verwende diese
                    // Ansonsten bleibt es bei 'npc_down'
                    if (this.textures.exists('npc_down_walk')) {
                        newNpc.setTexture('npc_down_walk');
                    }
                }
            }
        });
        
        // Füge einen Debug-Text unter dem NPC hinzu
        // Bei anonymen NPCs nur "Anonym" anzeigen
        const debugText = this.add.text(x, y + 20, "Anonym", {
            fontSize: '10px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        debugText.setOrigin(0.5, 0);
        newNpc.debugText = debugText; // Speichere die Referenz im NPC-Objekt
        
        // Kollisionen mit Hindernissen
        if (this.obstacles) {
            this.physics.add.collider(newNpc, this.obstacles);
        }
        
        // Kollision mit dem Spieler
        if (this.player) {
            this.physics.add.collider(newNpc, this.player, this.showInteractionPrompt, null, this);
        }
        
        // Füge den NPC zum Array hinzu
        this.npcs.push(newNpc);
        
        // Setze den aktuellen NPC
        this.npc = newNpc;
        this.npcState.currentNpcIndex = this.npcs.length - 1;
        
        console.log(`Neuer NPC erstellt: ${selectedCharacter.name} (ID: ${selectedCharacter.id})`);
        
        return newNpc;
    }
    
    // Methode zum Erstellen eines Test-NPCs an einer festen Position
    createTestNPC() {
        console.log('createTestNPC wird aufgerufen');
        
        // Feste Position in der Nähe des Spielers
        const x = 400;
        const y = 400;
        
        // Erstelle den NPC
        const testNpc = this.physics.add.sprite(x, y, 'npc_down');
        testNpc.setScale(1.2);
        
        // NPC ist im Anonymitätsmodus (komplett schwarz)
        testNpc.setTint(0x000000);
        
        // Speichere die Charakter-ID im NPC-Objekt
        testNpc.characterId = 1;
        testNpc.characterName = "Test NPC";
        testNpc.characterPersonality = "Ein Test-NPC zum Testen der Anzeige";
        
        // Kollisionen mit Hindernissen
        if (this.obstacles) {
            this.physics.add.collider(testNpc, this.obstacles);
        }
        
        // Kollision mit dem Spieler
        if (this.player) {
            this.physics.add.collider(testNpc, this.player, this.showInteractionPrompt, null, this);
        }
        
        // Füge den NPC zum Array hinzu
        if (!this.npcs) {
            this.npcs = [];
        }
        this.npcs.push(testNpc);
        
        // Setze den aktuellen NPC
        this.npc = testNpc;
        if (this.npcState) {
            this.npcState.currentNpcIndex = this.npcs.length - 1;
        }
        
        console.log(`Test-NPC erstellt an Position ${x}, ${y}`);
        
        return testNpc;
    }
    
    // Methode zum Initialisieren der UI-Elemente
    createUI() {
        // Interaktions-Prompt
        this.interactionPrompt.setVisible(false);
        
        // Chat-Eingabe erstellen
        this.createChatInput();
        
        // Interaktions-Taste (E) für Dialog
        this.interactKey = this.input.keyboard.addKey('E');
        
        // NPC-Bewegung
        this.time.addEvent({
            delay: 3000, // Alle 3 Sekunden
            callback: this.moveNPC,
            callbackScope: this,
            loop: true
        });
    }
    
    // Methode zum Initialisieren des NPC-Status
    initNPCState() {
        console.log('initNPCState wird aufgerufen');
        // NPC-Status initialisieren
        this.npcState = {
            isInConversation: false,
            lastMessage: '',
            isWaitingForResponse: false,
            identityRevealed: false,
            discoveredNPCs: [], // Liste der bereits entdeckten NPCs (IDs)
            currentNpcIndex: -1
        };
        
        // Debug-Ausgabe der NPC-Charaktere
        if (this.npcCharacters) {
            console.log('Verfügbare NPC-Charaktere:');
            this.npcCharacters.forEach(char => {
                console.log(`- ${char.name} (ID: ${char.id})`);
            });
        }
        
        console.log('NPC-Status initialisiert');
    }
    
    moveNPC() {
        // Zufällige Bewegung des NPCs
        if (!this.npc) return;
        
        // Stoppe vorherige Bewegung
        this.npc.setVelocity(0);
        
        // 30% Chance, dass der NPC sich bewegt
        if (Math.random() < 0.3) {
            const speed = 50;
            const direction = Math.floor(Math.random() * 4); // 0: up, 1: right, 2: down, 3: left
            
            switch (direction) {
                case 0: // up
                    this.npc.setVelocityY(-speed);
                    this.npc.setTexture('npc_up');
                    break;
                case 1: // right
                    this.npc.setVelocityX(speed);
                    this.npc.setTexture('npc_down'); // Wir haben nur up/down Texturen
                    break;
                case 2: // down
                    this.npc.setVelocityY(speed);
                    this.npc.setTexture('npc_down');
                    break;
                case 3: // left
                    this.npc.setVelocityX(-speed);
                    this.npc.setTexture('npc_up'); // Wir haben nur up/down Texturen
                    break;
            }
            
            // Stoppe die Bewegung nach 1-2 Sekunden
            this.time.delayedCall(
                1000 + Math.random() * 1000,
                () => {
                    if (this.npc) this.npc.setVelocity(0);
                },
                [],
                this
            );
        }
    }
    
    createChatInput() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const padding = 20;
        const chatWidth = width - (padding * 2);
        const chatHeight = 250; // Erhöhte Höhe für mehr Platz
        
        // Chat-Hintergrund mit abgerundeten Ecken und Schatten
        this.chatBackground = this.add.graphics();
        this.chatBackground.fillStyle(0x1a1a2a, 0.9); // Dunkleres Blau mit höherer Opazität
        this.chatBackground.fillRoundedRect(
            padding, 
            height - chatHeight - padding,
            chatWidth,
            chatHeight,
            10 // Abgerundete Ecken
        );
        
        // Füge einen Rahmen hinzu
        this.chatBackground.lineStyle(2, 0x4a6fa5, 1); // Blauer Rahmen
        this.chatBackground.strokeRoundedRect(
            padding, 
            height - chatHeight - padding,
            chatWidth,
            chatHeight,
            10
        );
        
        this.chatBackground.setScrollFactor(0);
        this.chatBackground.setVisible(false);
        
        // Titel für den Chat
        this.chatTitle = this.add.text(
            width / 2,
            height - chatHeight - padding + 20,
            'Gespräch mit NPC',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                fill: '#ffffff',
                align: 'center'
            }
        );
        this.chatTitle.setOrigin(0.5, 0.5);
        this.chatTitle.setScrollFactor(0);
        this.chatTitle.setVisible(false);
        
        // NPC-Antwortbereich mit besserem Styling
        this.npcResponse = this.add.text(
            padding + 15,
            height - chatHeight - padding + 50,
            '',
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                fill: '#e0e0ff', // Helleres Blau für bessere Lesbarkeit
                padding: { x: 10, y: 10 },
                wordWrap: { width: chatWidth - 50 },
                lineSpacing: 6
            }
        );
        this.npcResponse.setScrollFactor(0);
        this.npcResponse.setVisible(false);
        
        // Trennlinie zwischen Antwort und Eingabe
        this.chatDivider = this.add.graphics();
        this.chatDivider.lineStyle(1, 0x4a6fa5, 0.8); // Blauer Trennstrich
        this.chatDivider.lineBetween(
            padding + 15, 
            height - 90,
            width - padding - 15,
            height - 90
        );
        this.chatDivider.setScrollFactor(0);
        this.chatDivider.setVisible(false);
        
        // Chat-Eingabefeld mit besserem Styling
        const inputBg = this.add.graphics();
        inputBg.fillStyle(0x2a2a3a, 1); // Dunklerer Hintergrund für Eingabefeld
        inputBg.fillRoundedRect(
            padding + 15,
            height - 70,
            chatWidth - 230, // Platz für Buttons lassen
            40,
            5
        );
        inputBg.setScrollFactor(0);
        inputBg.setVisible(false);
        this.inputBackground = inputBg;
        
        this.chatInput = this.add.text(
            padding + 25,
            height - 65,
            'Tippe deine Nachricht hier ein...',
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                fill: '#bbbbbb', // Hellgrau für Platzhaltertext
                padding: { x: 5, y: 5 }
            }
        );
        this.chatInput.setScrollFactor(0);
        this.chatInput.setVisible(false);
        
        // Chat-Senden-Button mit besserem Styling
        const sendBg = this.add.graphics();
        sendBg.fillStyle(0x4a6fa5, 1); // Blauer Button
        sendBg.fillRoundedRect(
            width - padding - 100,
            height - 70,
            85,
            40,
            5
        );
        sendBg.setScrollFactor(0);
        sendBg.setVisible(false);
        this.sendBackground = sendBg;
        
        this.chatSendButton = this.add.text(
            width - padding - 57.5,
            height - 50,
            'Senden',
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                fill: '#ffffff'
            }
        );
        this.chatSendButton.setOrigin(0.5, 0.5);
        this.chatSendButton.setScrollFactor(0);
        this.chatSendButton.setVisible(false);
        this.chatSendButton.setInteractive({ useHandCursor: true });
        this.chatSendButton.on('pointerdown', () => this.sendChatMessage());
        
        // Hover-Effekt für den Senden-Button
        this.chatSendButton.on('pointerover', () => {
            sendBg.clear();
            sendBg.fillStyle(0x5a7fb5, 1); // Hellerer Blau bei Hover
            sendBg.fillRoundedRect(
                width - padding - 100,
                height - 70,
                85,
                40,
                5
            );
        });
        
        this.chatSendButton.on('pointerout', () => {
            sendBg.clear();
            sendBg.fillStyle(0x4a6fa5, 1); // Normales Blau
            sendBg.fillRoundedRect(
                width - padding - 100,
                height - 70,
                85,
                40,
                5
            );
        });
        
        // X-Icon zum Schließen in der oberen rechten Ecke
        const closeIconSize = 24;
        const closeIconPadding = 10;
        
        // Runder Hintergrund für das X-Icon
        const closeIconBg = this.add.graphics();
        closeIconBg.fillStyle(0x8a4a4a, 0.7); // Halbtransparentes Rot
        closeIconBg.fillCircle(
            width - padding - closeIconPadding,
            height - chatHeight - padding + closeIconPadding + closeIconSize/2,
            closeIconSize/2
        );
        closeIconBg.setScrollFactor(0);
        closeIconBg.setVisible(false);
        this.cancelBackground = closeIconBg;
        
        // X-Icon erstellen mit Linien
        const closeIcon = this.add.graphics();
        // Zeichne das X
        closeIcon.lineStyle(3, 0xffffff, 1);
        // Erste Linie des X (von oben links nach unten rechts)
        closeIcon.lineBetween(
            width - padding - closeIconPadding - closeIconSize/3,
            height - chatHeight - padding + closeIconPadding + closeIconSize/3,
            width - padding - closeIconPadding + closeIconSize/3,
            height - chatHeight - padding + closeIconPadding + closeIconSize*2/3
        );
        // Zweite Linie des X (von oben rechts nach unten links)
        closeIcon.lineBetween(
            width - padding - closeIconPadding + closeIconSize/3,
            height - chatHeight - padding + closeIconPadding + closeIconSize/3,
            width - padding - closeIconPadding - closeIconSize/3,
            height - chatHeight - padding + closeIconPadding + closeIconSize*2/3
        );
        closeIcon.setScrollFactor(0);
        closeIcon.setVisible(false);
        this.chatCancelButton = closeIcon;
        
        // Interaktiver Bereich für das X-Icon
        const closeHitArea = this.add.rectangle(
            width - padding - closeIconPadding,
            height - chatHeight - padding + closeIconPadding + closeIconSize/2,
            closeIconSize * 1.5,
            closeIconSize * 1.5
        );
        closeHitArea.setScrollFactor(0);
        closeHitArea.setVisible(false); // Unsichtbarer Klickbereich
        closeHitArea.setInteractive({ useHandCursor: true });
        closeHitArea.on('pointerdown', () => this.closeChatInput());
        this.closeHitArea = closeHitArea;
        
        // Hover-Effekt für das X-Icon
        closeHitArea.on('pointerover', () => {
            closeIconBg.clear();
            closeIconBg.fillStyle(0x9a5a5a, 0.9); // Helleres, weniger transparentes Rot bei Hover
            closeIconBg.fillCircle(
                width - padding - closeIconPadding,
                height - chatHeight - padding + closeIconPadding + closeIconSize/2,
                closeIconSize/2 * 1.1 // Leicht größer bei Hover
            );
        });
        
        closeHitArea.on('pointerout', () => {
            closeIconBg.clear();
            closeIconBg.fillStyle(0x8a4a4a, 0.7); // Normales Rot
            closeIconBg.fillCircle(
                width - padding - closeIconPadding,
                height - chatHeight - padding + closeIconPadding + closeIconSize/2,
                closeIconSize/2
            );
        });
        
        // Aktiviere Tastatureingabe
        this.userInput = '';
        this.input.keyboard.on('keydown', this.handleKeyInput, this);
        
        // Letzte NPC-Antwort
        this.lastNpcResponse = '';
        
        // Konversationsverlauf für das LLM
        this.conversationHistory = [];
    }
    
    showInteractionPrompt() {
        // Wenn der Spieler mit dem NPC kollidiert
        if (!this.npc || !this.player) return;
        
        // Zeige Interaktions-Prompt über dem NPC
        this.interactionPrompt.setPosition(
            this.npc.x - this.interactionPrompt.width / 2,
            this.npc.y - 40
        );
        
        this.interactionPrompt.setVisible(true);
        
        // Verstecke den Prompt nach 2 Sekunden
        this.time.delayedCall(2000, () => {
            this.interactionPrompt.setVisible(false);
        }, [], this);
    }
    
    talkToNPC() {
        // Wenn der Spieler mit dem NPC spricht
        if (!this.npc || !this.player || this.npcState.isInConversation) return;
        
        // Stoppe die Bewegung des Spielers und des NPCs
        this.player.setVelocity(0);
        this.npc.setVelocity(0);
        
        // Drehe den NPC zum Spieler
        if (this.player.x < this.npc.x) {
            this.npc.setTexture('npc_up'); // Links (wir haben nur up/down)
        } else {
            this.npc.setTexture('npc_down'); // Rechts
        }
        
        // Starte die Konversation
        this.npcState.isInConversation = true;
        
        // Starte direkt den Chat ohne Sprechblase über dem NPC
        this.lastNpcResponse = 'Verhüllt von Zeit,\nwer könnt es sein?';
        
        // Zeige Chat-Eingabe direkt
        this.openChatInput();
    }
    

    
    openChatInput() {
        // Aktiviere Chat-Eingabe
        this.chatBackground.setVisible(true);
        this.chatTitle.setVisible(true);
        this.inputBackground.setVisible(true);
        this.chatInput.setVisible(true);
        this.sendBackground.setVisible(true);
        this.chatSendButton.setVisible(true);
        this.cancelBackground.setVisible(true);
        this.chatCancelButton.setVisible(true);
        this.closeHitArea.setVisible(true); // Klickbereich für X-Icon
        this.npcResponse.setVisible(true);
        this.chatDivider.setVisible(true);
        
        // Setze Eingabe zurück
        this.userInput = '';
        this.chatInput.setText('Tippe deine Nachricht hier ein...');
        this.chatInput.setStyle({ fill: '#bbbbbb' }); // Platzhaltertext in Grau
        
        // Zeige letzte NPC-Antwort an
        this.npcResponse.setText(this.lastNpcResponse || 'Sprich mit dem NPC...');
        
        // Aktualisiere den Titel mit dem NPC-Namen
        this.chatTitle.setText('Gespräch mit Unbekanntem');
    }
    
    closeChatInput() {
        // Deaktiviere Chat-Eingabe
        this.chatBackground.setVisible(false);
        this.chatTitle.setVisible(false);
        this.inputBackground.setVisible(false);
        this.chatInput.setVisible(false);
        this.sendBackground.setVisible(false);
        this.chatSendButton.setVisible(false);
        this.cancelBackground.setVisible(false);
        this.chatCancelButton.setVisible(false);
        this.closeHitArea.setVisible(false); // Klickbereich für X-Icon
        this.npcResponse.setVisible(false);
        this.chatDivider.setVisible(false);
        
        // Beende die Konversation
        this.npcState.isInConversation = false;
        this.npcDialog.setVisible(false);
    }
    
    handleKeyInput(event) {
        // Wenn keine Chat-Eingabe aktiv ist, ignoriere Tastatureingabe
        if (!this.chatInput.visible) return;
        
        // Enter-Taste zum Senden
        if (event.keyCode === 13) { // Enter
            this.sendChatMessage();
            return;
        }
        
        // Escape-Taste zum Abbrechen
        if (event.keyCode === 27) { // Escape
            this.closeChatInput();
            return;
        }
        
        // Backspace zum Löschen
        if (event.keyCode === 8 && this.userInput.length > 0) { // Backspace
            this.userInput = this.userInput.slice(0, -1);
        }
        // Normale Tasteneingabe
        else if (event.keyCode >= 32 && event.keyCode <= 126) { // Druckbare Zeichen
            this.userInput += event.key;
        }
        
        // Aktualisiere Anzeige
        if (this.userInput.length === 0) {
            this.chatInput.setText('Tippe deine Nachricht hier ein...');
            this.chatInput.setStyle({ fill: '#bbbbbb' }); // Platzhaltertext in Grau
        } else {
            this.chatInput.setText(this.userInput);
            this.chatInput.setStyle({ fill: '#ffffff' }); // Aktiver Text in Weiß
            
            // Visuelles Feedback beim Tippen
            this.tweens.add({
                targets: this.inputBackground,
                alpha: 0.7,
                duration: 50,
                yoyo: true,
                ease: 'Power1'
            });
        }
    }
    
    updateNpcResponse(response) {
        // Aktualisiere die letzte NPC-Antwort
        this.lastNpcResponse = response;
        
        // Aktualisiere die Anzeige, wenn sichtbar
        if (this.npcResponse.visible) {
            this.npcResponse.setText(response);
        }
    }
    
    // Methode, die aufgerufen wird, wenn der Spieler die Identität des NPCs erraten hat
    revealIdentity() {
        // Markiere, dass die Identität aufgedeckt wurde
        this.npcState.identityRevealed = true;
        
        // Füge den aktuellen NPC zur Liste der entdeckten NPCs hinzu
        if (this.npc && this.npc.characterId) {
            // Prüfe, ob der NPC bereits in der Liste ist, um Duplikate zu vermeiden
            if (!this.npcState.discoveredNPCs.includes(this.npc.characterId)) {
                this.npcState.discoveredNPCs.push(this.npc.characterId);
                console.log(`NPC ${this.npc.characterName} (ID: ${this.npc.characterId}) wurde entdeckt!`);
                console.log('Aktualisierte Liste der entdeckten NPCs:', this.npcState.discoveredNPCs);
            } else {
                console.log(`NPC ${this.npc.characterName} (ID: ${this.npc.characterId}) wurde bereits zuvor entdeckt.`);
            }
        }
        
        // Spiele einen Soundeffekt ab (falls vorhanden)
        // this.sound.play('reveal');
        
        // Entferne die schwarze Einfärbung, um den NPC normal anzuzeigen
        this.npc.clearTint();
        
        // Aktualisiere den Debug-Text mit dem richtigen Namen ohne ID
        if (this.npc.debugText) {
            this.npc.debugText.setText(this.npc.characterName);
            this.npc.debugText.setStyle({
                fontSize: '12px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                fill: '#ffff00', // Gelb für aufgedeckte NPCs
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
        }
        
        // Kurzer gelber Blitz-Effekt
        this.npc.setTint(0xffff00);
        this.time.delayedCall(300, () => {
            if (this.npcState.identityRevealed) {
                this.npc.clearTint(); // Zur normalen Farbe zurückkehren
            }
        });
        
        // Erstelle einen Partikeleffekt um den NPC
        const particles = this.add.particles('particle'); // Du musst ein Partikel-Sprite laden
        
        // Erstelle einen Emitter für den Partikeleffekt
        if (particles.createEmitter) {
            const emitter = particles.createEmitter({
                x: this.npc.x,
                y: this.npc.y,
                speed: { min: 50, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 1000,
                gravityY: 0
            });
            
            // Stoppe den Emitter nach 2 Sekunden
            this.time.delayedCall(2000, () => {
                emitter.stop();
            });
        } else {
            console.warn('Particles not available or not properly loaded');
        }
        
        // Aktualisiere den Chat-Titel, um den NPC-Namen anzuzeigen
        if (this.chatTitle && this.chatTitle.visible) {
            this.chatTitle.setText(`Gespräch mit ${this.npc.characterName}`);
        }
        
        // Zeige eine spezielle Nachricht an
        const revealText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 3,
            `Du hast ${this.npc.characterName} entlarvt!`,
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }
        );
        revealText.setOrigin(0.5);
        revealText.setScrollFactor(0);
        
        // Blende die Nachricht nach einigen Sekunden aus
        this.tweens.add({
            targets: revealText,
            alpha: 0,
            duration: 2000,
            delay: 3000,
            onComplete: () => {
                revealText.destroy();
                
                // Erstelle nach kurzer Verzögerung einen neuen NPC
                this.time.delayedCall(1000, () => {
                    // Erstelle einen neuen NPC nur, wenn noch nicht alle entdeckt wurden
                    const newNpc = this.createNewNPC();
                    if (newNpc) {
                        // Zeige eine Benachrichtigung an
                        const newNpcText = this.add.text(
                            this.cameras.main.width / 2,
                            this.cameras.main.height / 3,
                            'Ein neuer geheimnisvoller NPC ist erschienen!',
                            {
                                fontSize: '20px',
                                fontFamily: 'Arial',
                                fontStyle: 'bold',
                                fill: '#ffffff',
                                stroke: '#000000',
                                strokeThickness: 3,
                                align: 'center'
                            }
                        );
                        newNpcText.setOrigin(0.5);
                        newNpcText.setScrollFactor(0);
                        
                        // Blende die Nachricht nach einigen Sekunden aus
                        this.tweens.add({
                            targets: newNpcText,
                            alpha: 0,
                            duration: 1500,
                            delay: 2500,
                            onComplete: () => newNpcText.destroy()
                        });
                    }
                });
            }
        });
    }
    
    async sendChatMessage() {
        // Wenn keine Nachricht eingegeben wurde
        if (this.userInput.length === 0 || this.npcState.isWaitingForResponse) return;
        
        const message = this.userInput;
        this.userInput = '';
        
        // Füge die Nachricht des Spielers zum Konversationsverlauf hinzu (für das LLM)
        this.conversationHistory.push({
            type: 'user',
            message: message
        });
        
        // Zeige "Nachricht wird gesendet"-Status
        this.chatInput.setText('Nachricht wird gesendet...');
        this.npcState.isWaitingForResponse = true;
        
        try {
            // Sende Anfrage an den Server mit der Konversationshistorie
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message,
                    conversationHistory: this.conversationHistory,
                    characterName: this.npc ? this.npc.characterName : null,
                    characterPersonality: this.npc ? this.npc.characterPersonality : null
                })
            });
            
            const data = await response.json();
            
            // Verarbeite die Antwort
            let npcResponse = 'Entschuldigung, ich habe dich nicht verstanden.';
            
            if (data.response) {
                npcResponse = data.response;
                
                // Füge die NPC-Antwort zum Konversationsverlauf hinzu (für das LLM)
                this.conversationHistory.push({
                    type: 'npc',
                    message: npcResponse
                });
                
                // Prüfe, ob die Identität aufgedeckt wurde
                if (data.identityRevealed) {
                    console.log('Identität aufgedeckt!');
                    
                    // Spiele eine Animation ab oder führe eine spezielle Aktion aus
                    this.revealIdentity();
                }
            }
            
            // Aktualisiere die NPC-Antwort
            this.updateNpcResponse(npcResponse);
            
            // Füge die Antwort des NPCs zum Konversationsverlauf hinzu (für das LLM)
            this.conversationHistory.push({
                type: 'npc',
                message: npcResponse
            });
            
        } catch (error) {
            console.error('Fehler beim Senden der Nachricht:', error);
            
            // Aktualisiere die NPC-Antwort mit Fehlermeldung
            this.updateNpcResponse('Entschuldigung, ich kann gerade nicht antworten.');
            
            // Füge die Fehlermeldung zum Konversationsverlauf hinzu (für das LLM)
            this.conversationHistory.push({
                type: 'npc',
                message: 'Entschuldigung, ich kann gerade nicht antworten.'
            });
            
            // Fehlermeldung wird nur im Chat-Fenster angezeigt
        }
        
        // Setze Status zurück
        this.npcState.isWaitingForResponse = false;
        this.chatInput.setText('Tippe deine Nachricht hier ein...');
    }
    
    update() {
        // Spielerbewegung
        this.handlePlayerMovement();
        
        // Aktualisiere die Position des Dialogs, wenn er sichtbar ist
        if (this.npcDialog && this.npcDialog.visible && this.npc) {
            this.npcDialog.setPosition(this.npc.x - 100, this.npc.y - 50);
        }
        
        // Aktualisiere die Position des Interaktions-Prompts
        if (this.interactionPrompt && this.interactionPrompt.visible && this.npc) {
            this.interactionPrompt.setPosition(this.npc.x - 50, this.npc.y - 30);
        }
        
        // Aktualisiere die Position der Debug-Texte für alle NPCs
        if (this.npcs) {
            this.npcs.forEach(npc => {
                if (npc.debugText) {
                    npc.debugText.setPosition(npc.x, npc.y + 20);
                }
            });
        }
    }
    
    handlePlayerMovement() {
        if (!this.player) return;
        
        const speed = 160;
        
        // Horizontal
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.setTexture('player_left');
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.setTexture('player_right');
        } else {
            this.player.setVelocityX(0);
        }
        
        // Vertikal
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
            if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
                this.player.setTexture('player_up');
            }
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
            if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
                this.player.setTexture('player_down');
            }
        } else {
            this.player.setVelocityY(0);
        }
        
        // Interaktion mit NPCs prüfen, wenn E gedrückt wird
        if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey) && this.npcs && this.npcs.length > 0) {
            // Prüfe die Distanz zu allen NPCs
            let closestNPC = null;
            let closestDistance = 100; // Maximale Interaktionsdistanz
            
            for (let i = 0; i < this.npcs.length; i++) {
                const npc = this.npcs[i];
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    npc.x, npc.y
                );
                
                console.log(`Abstand zu NPC ${i}: ${distance}`);
                
                // Wenn dieser NPC näher ist als der bisher nächste und in Reichweite
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestNPC = npc;
                    this.npcState.currentNpcIndex = i;
                }
            }
            
            // Wenn ein NPC in Reichweite ist
            if (closestNPC) {
                console.log(`Interaktion mit NPC an Position ${closestNPC.x}, ${closestNPC.y}, Abstand: ${closestDistance}`);
                this.npc = closestNPC; // Setze den aktuellen NPC
                this.talkToNPC();
            }
        }
    }
}
