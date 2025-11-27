#!/bin/bash
# YouTube Transcriber - Schnellauswahl

source venv/bin/activate

echo "🎥 YouTube Transcriber - Modell-Auswahl"
echo "========================================"
echo ""
echo "1) 🚀 TINY   - Schneller Test (39MB, ~10x Speed)"
echo "2) 🎯 LARGE  - Beste Qualität (1.5GB, ~1x Speed)"
echo "3) 📋 SCAN   - Alle Playlists scannen"
echo "4) ⚡ PARALLEL - Mehrere Videos parallel (3x Speed)"
echo ""
read -p "Wähle Modell (1-4): " choice

case $choice in
    1)
        echo "→ Nutze TINY Modell für schnellen Test"
        read -p "YouTube URL: " url
        python3 transcriber_v3.py process "$url" --model tiny
        ;;
    2)
        echo "→ Nutze LARGE Modell für beste Qualität"
        read -p "YouTube URL: " url
        python3 transcriber_v3.py process "$url" --model large
        ;;
    3)
        echo "→ Scanne alle Playlists mit LARGE Modell"
        python3 transcriber_v3.py scan --model large
        ;;
    4)
        echo "→ Parallel-Verarbeitung (3x schneller!)"
        echo "Gib URLs ein (mit Leerzeichen getrennt, oder Enter für Playlist):"
        read -p "URLs: " urls
        if [ -z "$urls" ]; then
            python3 transcriber_v4_parallel.py process --playlist people/rory-sutherland --model large
        else
            python3 transcriber_v4_parallel.py process --urls $urls --model large
        fi
        ;;
    *)
        echo "Ungültige Auswahl"
        ;;
esac