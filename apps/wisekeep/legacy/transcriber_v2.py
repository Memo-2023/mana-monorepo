#!/usr/bin/env python3
"""
YouTube Auto-Transcriber v2.0
Mit verbesserter Download-Experience und Rich UI
"""

import os
import sys
import json
import argparse
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
import time
import yt_dlp
import whisper
import warnings

from rich.console import Console
from rich.progress import (
    Progress, 
    SpinnerColumn, 
    TextColumn, 
    BarColumn, 
    TaskProgressColumn,
    TimeRemainingColumn,
    TimeElapsedColumn,
    DownloadColumn,
    TransferSpeedColumn
)
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich.layout import Layout
from rich import print as rprint

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

console = Console()

# ASCII Art Logo
LOGO = """
[bold cyan]╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  [bold white]🎥 YouTube Auto-Transcriber v2.0[/bold white]                    ║
║  [dim]Powered by OpenAI Whisper & yt-dlp[/dim]                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝[/bold cyan]
"""

class YouTubeTranscriber:
    def __init__(self, model_size="base", output_dir="transcripts", cache_dir=".cache"):
        """
        Initialisiert den Transcriber mit Rich UI
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.cache_file = self.cache_dir / "transcribed_videos.json"
        
        self.temp_dir = Path("temp_audio")
        self.temp_dir.mkdir(exist_ok=True)
        
        # Lade Cache
        self.cache = self.load_cache()
        
        # Lade Whisper Model mit Progress
        with console.status(f"[bold green]⏳ Lade Whisper Model '{model_size}'...", spinner="dots"):
            self.model = whisper.load_model(model_size)
        
        console.print(f"[bold green]✅ Model geladen: {model_size}[/bold green]")
        
        # Model-Geschwindigkeiten (ungefähre Werte)
        self.model_speeds = {
            'tiny': 10,
            'base': 7,
            'small': 4,
            'medium': 2,
            'large': 1
        }
        self.model_size = model_size
        self.speed_factor = self.model_speeds.get(model_size, 3)
        
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
            'progress_hooks': [self._download_progress_hook],
        }
        
        self.current_progress = None
        self.download_task = None
    
    def load_cache(self):
        """Lädt den Cache bereits transkribierter Videos"""
        if self.cache_file.exists():
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        return {}
    
    def save_cache(self):
        """Speichert den Cache"""
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)
    
    def get_video_hash(self, url):
        """Erstellt einen Hash für die Video-URL"""
        return hashlib.md5(url.encode()).hexdigest()
    
    def is_cached(self, url):
        """Prüft ob Video bereits transkribiert wurde"""
        video_hash = self.get_video_hash(url)
        if video_hash in self.cache:
            cached_info = self.cache[video_hash]
            output_file = Path(cached_info['output_file'])
            if output_file.exists():
                return cached_info
        return None
    
    def _download_progress_hook(self, d):
        """Progress Hook für yt-dlp"""
        if d['status'] == 'downloading' and self.download_task:
            if d.get('total_bytes'):
                downloaded = d.get('downloaded_bytes', 0)
                total = d['total_bytes']
                self.current_progress.update(self.download_task, completed=downloaded, total=total)
            elif d.get('total_bytes_estimate'):
                downloaded = d.get('downloaded_bytes', 0)
                total = d['total_bytes_estimate']
                self.current_progress.update(self.download_task, completed=downloaded, total=total)
    
    def get_video_info(self, url):
        """
        Holt Video-Informationen VOR dem Download
        """
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
                return {
                    'title': info.get('title', 'Unbekannt'),
                    'channel': info.get('uploader', 'Unbekannt'),
                    'duration': info.get('duration', 0),
                    'view_count': info.get('view_count', 0),
                    'upload_date': info.get('upload_date', ''),
                    'description': info.get('description', '')[:200],
                    'filesize': info.get('filesize', 0) or info.get('filesize_approx', 0)
                }
            except Exception as e:
                console.print(f"[red]❌ Fehler beim Abrufen der Video-Info: {e}[/red]")
                return None
    
    def display_video_info(self, info):
        """Zeigt Video-Informationen in einer schönen Tabelle"""
        if not info:
            return
        
        # Erstelle Info-Tabelle
        table = Table(title="📹 Video Information", show_header=False, box=None)
        table.add_column("Property", style="cyan", width=20)
        table.add_column("Value", style="white")
        
        table.add_row("Titel", info['title'][:60] + "..." if len(info['title']) > 60 else info['title'])
        table.add_row("Kanal", info['channel'])
        
        duration = info['duration']
        duration_str = f"{duration//60}:{duration%60:02d} Minuten"
        table.add_row("Dauer", duration_str)
        
        # Zeitschätzung für Transkription
        estimated_time = duration / self.speed_factor
        eta_str = f"~{estimated_time//60:.0f}:{estimated_time%60:02.0f} Minuten"
        table.add_row("Geschätzte Zeit", f"{eta_str} (mit {self.model_size} model)")
        
        if info.get('view_count'):
            views = f"{info['view_count']:,}".replace(',', '.')
            table.add_row("Aufrufe", views)
        
        console.print(Panel(table, border_style="cyan"))
        
        # Warnung bei langen Videos
        if duration > 1800:  # 30 Minuten
            console.print(f"[yellow]⚠️  Hinweis: Dieses Video ist über 30 Minuten lang. Die Transkription kann einige Zeit dauern.[/yellow]")
        
        return estimated_time
    
    def download_audio(self, url, progress):
        """
        Lädt Audio mit Progress Bar herunter
        """
        self.current_progress = progress
        self.download_task = progress.add_task(
            "[cyan]📥 Download Audio...", 
            total=None
        )
        
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
                
                progress.update(self.download_task, completed=100, total=100)
                
                return audio_file, {
                    'title': title,
                    'channel': channel,
                    'duration': duration,
                    'url': url
                }
                
            except Exception as e:
                console.print(f"[red]❌ Fehler beim Download: {e}[/red]")
                return None, None
    
    def transcribe_audio(self, audio_path, language="de", progress=None):
        """
        Transkribiert Audio-Datei mit Progress Bar
        """
        if progress:
            task = progress.add_task(
                f"[green]🎙️  Transkribiere mit {self.model_size} model...", 
                total=100
            )
        
        try:
            # Simuliere Progress (Whisper hat keine direkte Progress-API)
            def progress_callback(current, total):
                if progress:
                    progress.update(task, completed=min(current, 100))
            
            result = self.model.transcribe(
                str(audio_path),
                language=language,
                verbose=False,
                fp16=False  # Für M1 Mac
            )
            
            if progress:
                progress.update(task, completed=100)
            
            return result['text'], result.get('language', 'unbekannt')
            
        except Exception as e:
            console.print(f"[red]❌ Fehler bei Transkription: {e}[/red]")
            return None, None
    
    def save_transcript(self, text, video_info, detected_language=None):
        """
        Speichert Transkript als Textdatei
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
            if detected_language:
                f.write(f"Erkannte Sprache: {detected_language}\n")
            f.write(f"Transkribiert am: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}\n")
            f.write(f"Whisper Model: {self.model_size}\n")
            f.write("\n" + "=" * 50 + "\n\n")
            f.write("TRANSKRIPTION:\n\n")
            f.write(text)
        
        return filepath
    
    def cleanup_temp_files(self):
        """Löscht temporäre Audio-Dateien"""
        for file in self.temp_dir.glob("*.mp3"):
            try:
                file.unlink()
            except:
                pass
    
    def process_video(self, url, language="de", force_reprocess=False):
        """
        Kompletter Workflow mit Rich UI
        """
        console.rule(f"[bold blue]Verarbeite Video[/bold blue]")
        
        # Prüfe Cache
        if not force_reprocess:
            cached = self.is_cached(url)
            if cached:
                console.print(f"[yellow]⚠️  Video bereits transkribiert:[/yellow]")
                console.print(f"    📁 {cached['output_file']}")
                console.print(f"    📅 {cached['transcribed_at']}")
                console.print(f"[dim]    (Nutze --force um neu zu transkribieren)[/dim]")
                return cached['output_file']
        
        # Hole Video-Info vorab
        console.print("\n[cyan]📊 Lade Video-Informationen...[/cyan]")
        video_info = self.get_video_info(url)
        if not video_info:
            return None
        
        estimated_time = self.display_video_info(video_info)
        
        # Multi-Progress für Download und Transkription
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
            console=console
        ) as progress:
            
            # 1. Download Audio
            audio_path, download_info = self.download_audio(url, progress)
            if not audio_path:
                return None
            
            # 2. Transkribiere
            transcript, detected_lang = self.transcribe_audio(audio_path, language, progress)
            if not transcript:
                return None
        
        # 3. Speichern
        output_path = self.save_transcript(transcript, download_info, detected_lang)
        
        # 4. Cache aktualisieren
        video_hash = self.get_video_hash(url)
        self.cache[video_hash] = {
            'url': url,
            'title': download_info['title'],
            'output_file': str(output_path),
            'transcribed_at': datetime.now().isoformat(),
            'model': self.model_size,
            'language': detected_lang
        }
        self.save_cache()
        
        # 5. Aufräumen
        self.cleanup_temp_files()
        
        # Erfolgs-Meldung
        console.print("\n[bold green]✅ Video erfolgreich verarbeitet![/bold green]")
        console.print(f"📁 Gespeichert: [cyan]{output_path}[/cyan]")
        
        return output_path


def main():
    parser = argparse.ArgumentParser(
        description='YouTube Video Transcriber v2.0 - Mit verbesserter UI'
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
    parser.add_argument(
        '--force',
        action='store_true',
        help='Ignoriere Cache und transkribiere neu'
    )
    
    args = parser.parse_args()
    
    # Zeige Logo
    console.print(LOGO)
    
    # Initialisiere Transcriber
    transcriber = YouTubeTranscriber(
        model_size=args.model,
        output_dir=args.output
    )
    
    if args.batch:
        # Batch-Modus
        console.print("[cyan]📋 Batch-Modus: Gebe URLs ein (eine pro Zeile, beende mit Ctrl+D):[/cyan]")
        urls = []
        try:
            for line in sys.stdin:
                url = line.strip()
                if url and url.startswith('http'):
                    urls.append(url)
        except KeyboardInterrupt:
            pass
        
        console.print(f"\n[bold]{len(urls)} Videos zu verarbeiten[/bold]")
        
        for i, url in enumerate(urls, 1):
            console.print(f"\n[bold cyan]━━━ Video {i}/{len(urls)} ━━━[/bold cyan]")
            transcriber.process_video(url, args.language, args.force)
    
    elif args.url:
        # Single Video
        transcriber.process_video(args.url, args.language, args.force)
    
    else:
        # Interaktiver Modus
        console.print("[bold cyan]🎬 Interaktiver Modus[/bold cyan]")
        console.print(f"Model: [green]{args.model}[/green]")
        console.print(f"Sprache: [green]{args.language}[/green]")
        console.print(f"Ausgabe: [green]{args.output}/[/green]")
        console.print("\nGebe YouTube URL ein (oder 'q' zum Beenden):\n")
        
        while True:
            try:
                url = console.input("[bold cyan]URL ▶ [/bold cyan]").strip()
                if url.lower() in ['q', 'quit', 'exit']:
                    break
                if url.startswith('http'):
                    transcriber.process_video(url, args.language, args.force)
                else:
                    console.print("[red]❌ Ungültige URL. Bitte YouTube URL eingeben.[/red]")
            except KeyboardInterrupt:
                break
        
        console.print("\n[bold green]👋 Auf Wiedersehen![/bold green]")


if __name__ == "__main__":
    main()