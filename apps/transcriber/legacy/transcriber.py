#!/usr/bin/env python3
"""
YouTube Auto-Transcriber MVP
Phase 1: Core Functionality - Download und Transkription
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime
import yt_dlp
import whisper
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)


class YouTubeTranscriber:
    def __init__(self, model_size="base", output_dir="transcripts"):
        """
        Initialisiert den Transcriber
        
        Args:
            model_size: Whisper Model Größe (tiny, base, small, medium, large)
            output_dir: Ausgabe-Verzeichnis für Transkriptionen
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.temp_dir = Path("temp_audio")
        self.temp_dir.mkdir(exist_ok=True)
        
        print(f"Lade Whisper Model '{model_size}'...")
        self.model = whisper.load_model(model_size)
        print(f"Model geladen: {model_size}")
        
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': str(self.temp_dir / '%(title)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
        }
    
    def download_audio(self, url):
        """
        Lädt Audio von YouTube herunter
        
        Args:
            url: YouTube URL
            
        Returns:
            Tuple (audio_path, video_info)
        """
        print(f"\nLade Video von: {url}")
        
        with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=True)
                title = info.get('title', 'unknown')
                channel = info.get('uploader', 'unknown')
                duration = info.get('duration', 0)
                
                # Finde die heruntergeladene Audio-Datei
                audio_file = None
                for file in self.temp_dir.glob("*.mp3"):
                    if file.stat().st_mtime > (datetime.now().timestamp() - 60):
                        audio_file = file
                        break
                
                if not audio_file:
                    raise Exception("Audio-Datei nicht gefunden")
                
                print(f"✓ Download abgeschlossen: {title}")
                print(f"  Kanal: {channel}")
                print(f"  Dauer: {duration//60}:{duration%60:02d} Minuten")
                
                return audio_file, {
                    'title': title,
                    'channel': channel,
                    'duration': duration,
                    'url': url
                }
                
            except Exception as e:
                print(f"✗ Fehler beim Download: {e}")
                return None, None
    
    def transcribe_audio(self, audio_path, language="de"):
        """
        Transkribiert Audio-Datei mit Whisper
        
        Args:
            audio_path: Pfad zur Audio-Datei
            language: Sprache für Transkription
            
        Returns:
            Transkriptionstext
        """
        print(f"\nStarte Transkription...")
        print(f"  Sprache: {language}")
        
        try:
            result = self.model.transcribe(
                str(audio_path),
                language=language,
                verbose=False
            )
            
            print(f"✓ Transkription abgeschlossen")
            print(f"  Erkannte Sprache: {result.get('language', 'unbekannt')}")
            
            return result['text']
            
        except Exception as e:
            print(f"✗ Fehler bei Transkription: {e}")
            return None
    
    def save_transcript(self, text, video_info):
        """
        Speichert Transkript als Textdatei
        
        Args:
            text: Transkriptionstext
            video_info: Video-Metadaten
            
        Returns:
            Pfad zur gespeicherten Datei
        """
        # Erstelle sicheren Dateinamen
        safe_title = "".join(c for c in video_info['title'] if c.isalnum() or c in (' ', '-', '_'))[:100]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{safe_title}_{timestamp}.txt"
        
        # Erstelle Kanal-Ordner
        channel_dir = self.output_dir / video_info['channel'].replace('/', '_')
        channel_dir.mkdir(exist_ok=True)
        
        filepath = channel_dir / filename
        
        # Schreibe Transkript mit Metadaten
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"YouTube Transkription\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Titel: {video_info['title']}\n")
            f.write(f"Kanal: {video_info['channel']}\n")
            f.write(f"URL: {video_info['url']}\n")
            f.write(f"Dauer: {video_info['duration']//60}:{video_info['duration']%60:02d} Minuten\n")
            f.write(f"Transkribiert am: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}\n")
            f.write("\n" + "=" * 50 + "\n\n")
            f.write("TRANSKRIPTION:\n\n")
            f.write(text)
        
        print(f"\n✓ Transkript gespeichert: {filepath}")
        return filepath
    
    def cleanup_temp_files(self):
        """Löscht temporäre Audio-Dateien"""
        for file in self.temp_dir.glob("*.mp3"):
            try:
                file.unlink()
            except:
                pass
        print("✓ Temporäre Dateien aufgeräumt")
    
    def process_video(self, url, language="de"):
        """
        Kompletter Workflow: Download → Transkription → Speichern
        
        Args:
            url: YouTube URL
            language: Sprache für Transkription
            
        Returns:
            Pfad zur Transkriptionsdatei oder None
        """
        print("\n" + "=" * 60)
        print(f"VERARBEITE VIDEO")
        print("=" * 60)
        
        # 1. Download Audio
        audio_path, video_info = self.download_audio(url)
        if not audio_path:
            return None
        
        # 2. Transkribiere
        transcript = self.transcribe_audio(audio_path, language)
        if not transcript:
            return None
        
        # 3. Speichern
        output_path = self.save_transcript(transcript, video_info)
        
        # 4. Aufräumen
        self.cleanup_temp_files()
        
        print("\n✓ Video erfolgreich verarbeitet!")
        return output_path


def main():
    parser = argparse.ArgumentParser(
        description='YouTube Video Transcriber - Transkribiert YouTube Videos mit Whisper'
    )
    parser.add_argument(
        'url',
        nargs='?',
        help='YouTube Video URL'
    )
    parser.add_argument(
        '--model',
        default='base',
        choices=['tiny', 'base', 'small', 'medium', 'large'],
        help='Whisper Model Größe (default: base)'
    )
    parser.add_argument(
        '--language',
        default='de',
        help='Sprache für Transkription (default: de)'
    )
    parser.add_argument(
        '--output',
        default='transcripts',
        help='Ausgabe-Verzeichnis (default: transcripts)'
    )
    parser.add_argument(
        '--batch',
        action='store_true',
        help='Batch-Modus: URLs aus stdin lesen'
    )
    
    args = parser.parse_args()
    
    # Initialisiere Transcriber
    transcriber = YouTubeTranscriber(
        model_size=args.model,
        output_dir=args.output
    )
    
    if args.batch:
        # Batch-Modus: Lese URLs von stdin
        print("Batch-Modus: Gebe URLs ein (eine pro Zeile, beende mit Ctrl+D):")
        urls = []
        try:
            for line in sys.stdin:
                url = line.strip()
                if url and url.startswith('http'):
                    urls.append(url)
        except KeyboardInterrupt:
            pass
        
        print(f"\n{len(urls)} Videos zu verarbeiten")
        
        for i, url in enumerate(urls, 1):
            print(f"\n[{i}/{len(urls)}] Verarbeite Video...")
            transcriber.process_video(url, args.language)
    
    elif args.url:
        # Single Video
        transcriber.process_video(args.url, args.language)
    
    else:
        # Interaktiver Modus
        print("\nYouTube Transcriber - Interaktiver Modus")
        print("=" * 50)
        print(f"Model: {args.model}")
        print(f"Sprache: {args.language}")
        print(f"Ausgabe: {args.output}/")
        print("=" * 50)
        print("\nGebe YouTube URL ein (oder 'q' zum Beenden):")
        
        while True:
            try:
                url = input("\nURL: ").strip()
                if url.lower() in ['q', 'quit', 'exit']:
                    break
                if url.startswith('http'):
                    transcriber.process_video(url, args.language)
                else:
                    print("Ungültige URL. Bitte YouTube URL eingeben.")
            except KeyboardInterrupt:
                break
        
        print("\nAuf Wiedersehen!")


if __name__ == "__main__":
    main()