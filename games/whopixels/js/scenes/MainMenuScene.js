class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        // Add background
        this.add.image(400, 300, 'background');

        // Add title
        this.add.text(400, 120, 'WhoPixels', { 
            fontSize: '64px', 
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add subtitle
        this.add.text(400, 180, 'Ein Pixel-Abenteuer', { 
            fontSize: '32px', 
            fill: '#fff' 
        }).setOrigin(0.5);

        // Create buttons
        const startButton = this.add.text(400, 280, 'RPG Spiel starten', { 
            fontSize: '32px', 
            fill: '#fff',
            backgroundColor: '#4a4a4a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        const editorButton = this.add.text(400, 350, 'Pixel Editor', { 
            fontSize: '32px', 
            fill: '#fff',
            backgroundColor: '#4a4a4a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        const optionsButton = this.add.text(400, 420, 'Optionen', { 
            fontSize: '32px', 
            fill: '#fff',
            backgroundColor: '#4a4a4a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        // Button interactions - RPG Game
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#ff0' });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#fff' });
        });

        startButton.on('pointerdown', () => {
            this.scene.start('RPGScene');
        });

        // Button interactions - Pixel Editor
        editorButton.on('pointerover', () => {
            editorButton.setStyle({ fill: '#ff0' });
        });

        editorButton.on('pointerout', () => {
            editorButton.setStyle({ fill: '#fff' });
        });

        editorButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Button interactions - Options
        optionsButton.on('pointerover', () => {
            optionsButton.setStyle({ fill: '#ff0' });
        });

        optionsButton.on('pointerout', () => {
            optionsButton.setStyle({ fill: '#fff' });
        });

        optionsButton.on('pointerdown', () => {
            // Options functionality would go here
            console.log('Options button clicked');
        });
    }
}
