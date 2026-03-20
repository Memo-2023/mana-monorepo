# WhoPixels

Ein webbasiertes Pixel-Spiel, entwickelt mit Phaser.js.

Projekt Starten:
node server.js

## Über das Projekt

WhoPixels ist ein einfaches Pixel-Art-Editor-Spiel, in dem du deine eigenen Pixel-Kunstwerke erstellen kannst. Das Projekt verwendet Phaser.js, eine leistungsstarke HTML5-Spieleentwicklungsbibliothek.

## Funktionen

- Interaktives Pixel-Art-Editor-Interface
- Farbpalette mit 8 Grundfarben
- Einfache und intuitive Benutzeroberfläche
- Responsive Design

## Erste Schritte

Um das Spiel lokal zu starten, benötigst du einen lokalen Webserver. Du kannst einen einfachen Server mit Python oder Node.js starten.

### Mit Python:

```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

### Mit Node.js:

Installiere zuerst das `http-server`-Paket:

```bash
npm install -g http-server
```

Dann starte den Server:

```bash
http-server
```

## Projektstruktur

```
whopixels/
├── assets/            # Spielressourcen (Bilder, Sounds, etc.)
├── css/               # CSS-Stylesheets
├── js/                # JavaScript-Dateien
│   ├── scenes/        # Phaser-Szenen
│   │   ├── BootScene.js
│   │   ├── MainMenuScene.js
│   │   └── GameScene.js
│   └── main.js        # Hauptspieldatei
└── index.html         # Haupt-HTML-Datei
```

## Weiterentwicklung

Hier sind einige Ideen für zukünftige Erweiterungen:

- Speichern und Laden von Pixel-Art
- Mehr Werkzeuge (Pinsel, Radierer, Füllen, etc.)
- Animation-Editor
- Teilen von Kunstwerken
- Mehrere Ebenen für komplexere Designs

## Lizenz

Dieses Projekt ist Open Source und steht unter der MIT-Lizenz.
