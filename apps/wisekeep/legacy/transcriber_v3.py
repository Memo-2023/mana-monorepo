#!/usr/bin/env python3
"""
YouTube Auto-Transcriber v3.0
Mit Playlist-Management und Themen-Ordnern
"""

import os
import sys
import json
import argparse
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
import time
from typing import List, Dict, Tuple
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
    MofNCompleteColumn
)
from rich.table import Table
from rich.panel import Panel
from rich.tree import Tree
from rich import print as rprint

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

console = Console()

# ASCII Art Logo
LOGO = """
[bold cyan]╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  [bold white]🎥 YouTube Auto-Transcriber v3.0[/bold white]                    ║
║  [dim]Playlist Management & Batch Processing[/dim]              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝[/bold cyan]
"""

class PlaylistManager:
    """
    Verwaltet Playlists und URL-Listen
    """
    def __init__(self, playlists_dir="playlists"):
        self.playlists_dir = Path(playlists_dir)
        self.playlists_dir.mkdir(exist_ok=True)
        
        # Erstelle Beispiel-Struktur wenn leer
        self._create_example_structure()
    
    def _create_example_structure(self):
        """Erstellt Beispiel-Ordnerstruktur"""
        example_file = self.playlists_dir / "example_tech.txt"
        if not example_file.exists() and not any(self.playlists_dir.glob("*.txt")):
            with open(example_file, 'w') as f:
                f.write("# Tech Videos - Beispiel Playlist\n")
                f.write("# Zeilen mit # werden ignoriert\n")
                f.write("# Eine URL pro Zeile:\n")
                f.write("#\n")
                f.write("# https://www.youtube.com/watch?v=VIDEO_ID\n")
    
    def get_all_playlists(self) -> Dict[str, Path]:
        """Findet alle Playlist-Dateien"""
        playlists = {}
        
        # Suche .txt Dateien im Hauptordner
        for file in self.playlists_dir.glob("*.txt"):
            name = file.stem
            playlists[name] = file
        
        # Suche auch in Unterordnern
        for folder in self.playlists_dir.iterdir():
            if folder.is_dir():
                for file in folder.glob("*.txt"):
                    name = f"{folder.name}/{file.stem}"
                    playlists[name] = file
        
        return playlists
    
    def read_playlist(self, playlist_path: Path) -> List[str]:
        """Liest URLs aus einer Playlist-Datei"""
        urls = []
        if not playlist_path.exists():
            return urls
        
        with open(playlist_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Ignoriere leere Zeilen und Kommentare
                if line and not line.startswith('#'):
                    if 'youtube.com' in line or 'youtu.be' in line:
                        urls.append(line)
        
        return urls
    
    def display_playlists_tree(self):
        """Zeigt alle Playlists als Baum-Struktur"""
        tree = Tree("[bold cyan]📁 Playlists[/bold cyan]")
        
        # Hauptordner-Dateien
        for file in sorted(self.playlists_dir.glob("*.txt")):
            urls = self.read_playlist(file)
            tree.add(f"📄 {file.stem} ({len(urls)} URLs)")
        
        # Unterordner
        for folder in sorted(self.playlists_dir.iterdir()):
            if folder.is_dir():
                branch = tree.add(f"📂 {folder.name}/")
                for file in sorted(folder.glob("*.txt")):
                    urls = self.read_playlist(file)
                    branch.add(f"📄 {file.stem} ({len(urls)} URLs)")
        
        console.print(tree)
        return tree


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
        
        # Model-Geschwindigkeiten
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
    
    def get_video_info(self, url):
        """Holt Video-Informationen VOR dem Download"""
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
                    'url': url
                }
            except Exception as e:
                console.print(f"[red]❌ Fehler beim Abrufen der Video-Info: {e}[/red]")
                return None
    
    def download_audio(self, url, progress=None):
        """Lädt Audio mit Progress Bar herunter"""
        self.current_progress = progress
        if progress:
            self.download_task = progress.add_task(
                "[cyan]📥 Download...", 
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
                
                if progress and self.download_task:
                    progress.update(self.download_task, completed=100, total=100)
                
                return audio_file, {
                    'title': title,
                    'channel': channel,
                    'duration': duration,
                    'url': url
                }
                
            except Exception as e:
                console.print(f"[red]❌ Download-Fehler: {e}[/red]")
                return None, None
    
    def transcribe_audio(self, audio_path, language="de", progress=None):
        """Transkribiert Audio-Datei"""
        if progress:
            task = progress.add_task(
                f"[green]🎙️  Transkribiere...", 
                total=100
            )
        
        try:
            result = self.model.transcribe(
                str(audio_path),
                language=language,
                verbose=False,
                fp16=False
            )
            
            if progress:
                progress.update(task, completed=100)
            
            return result['text'], result.get('language', 'unbekannt')
            
        except Exception as e:
            console.print(f"[red]❌ Transkriptions-Fehler: {e}[/red]")
            return None, None
    
    def save_transcript(self, text, video_info, playlist_name=None):
        """Speichert Transkript mit optionalem Playlist-Ordner"""
        # Basis-Ordner
        base_dir = self.output_dir
        
        # Wenn Playlist, erstelle Unterordner
        if playlist_name:
            base_dir = base_dir / playlist_name.replace('/', '_')
            base_dir.mkdir(parents=True, exist_ok=True)
        
        # Kanal-Ordner
        channel_dir = base_dir / video_info['channel'].replace('/', '_')
        channel_dir.mkdir(exist_ok=True)
        
        # Dateiname
        safe_title = "".join(c for c in video_info['title'] if c.isalnum() or c in (' ', '-', '_'))[:100]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{safe_title}_{timestamp}.txt"
        
        filepath = channel_dir / filename
        
        # Schreibe Transkript
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"YouTube Transkription\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Titel: {video_info['title']}\n")
            f.write(f"Kanal: {video_info['channel']}\n")
            f.write(f"URL: {video_info['url']}\n")
            if playlist_name:
                f.write(f"Playlist: {playlist_name}\n")
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
    
    def process_video(self, url, language="de", playlist_name=None, progress=None):
        """Verarbeitet ein einzelnes Video"""
        # Prüfe Cache
        cached = self.is_cached(url)
        if cached:
            return cached['output_file'], True  # True = war gecached
        
        # Hole Video-Info
        video_info = self.get_video_info(url)
        if not video_info:
            return None, False
        
        # Download Audio
        audio_path, download_info = self.download_audio(url, progress)
        if not audio_path:
            return None, False
        
        # Transkribiere
        transcript, detected_lang = self.transcribe_audio(audio_path, language, progress)
        if not transcript:
            return None, False
        
        # Speichern
        output_path = self.save_transcript(transcript, download_info, playlist_name)
        
        # Cache aktualisieren
        video_hash = self.get_video_hash(url)
        self.cache[video_hash] = {
            'url': url,
            'title': download_info['title'],
            'output_file': str(output_path),
            'transcribed_at': datetime.now().isoformat(),
            'model': self.model_size,
            'playlist': playlist_name
        }
        self.save_cache()
        
        # Aufräumen
        self.cleanup_temp_files()
        
        return output_path, False  # False = neu transkribiert
    
    def process_playlist(self, playlist_name: str, urls: List[str], language="de"):
        """
        Verarbeitet eine komplette Playlist
        """
        console.rule(f"[bold cyan]📋 Playlist: {playlist_name}[/bold cyan]")
        
        # Filtere bereits transkribierte Videos
        new_urls = []
        cached_count = 0
        
        for url in urls:
            if self.is_cached(url):
                cached_count += 1
            else:
                new_urls.append(url)
        
        # Status-Übersicht
        table = Table(show_header=False, box=None)
        table.add_column("Info", style="cyan")
        table.add_column("Wert", style="white")
        
        table.add_row("📊 Gesamt Videos:", str(len(urls)))
        table.add_row("✅ Bereits transkribiert:", str(cached_count))
        table.add_row("🆕 Neu zu transkribieren:", str(len(new_urls)))
        
        console.print(Panel(table, title="Playlist Status", border_style="cyan"))
        
        if not new_urls:
            console.print("[green]✅ Alle Videos bereits transkribiert![/green]")
            return
        
        # Verarbeite neue Videos
        success_count = 0
        error_count = 0
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            MofNCompleteColumn(),
            TimeElapsedColumn(),
            console=console
        ) as progress:
            
            playlist_task = progress.add_task(
                f"[cyan]Verarbeite {playlist_name}...", 
                total=len(new_urls)
            )
            
            for i, url in enumerate(new_urls, 1):
                progress.update(
                    playlist_task, 
                    description=f"[cyan]Video {i}/{len(new_urls)}..."
                )
                
                # Verarbeite Video
                output_path, was_cached = self.process_video(
                    url, 
                    language, 
                    playlist_name,
                    progress
                )
                
                if output_path:
                    success_count += 1
                    console.print(f"  ✅ {Path(output_path).name}")
                else:
                    error_count += 1
                    console.print(f"  ❌ Fehler bei: {url}")
                
                progress.update(playlist_task, advance=1)
        
        # Zusammenfassung
        console.print("\n" + "=" * 50)
        console.print(f"[bold green]✅ Erfolgreich: {success_count}[/bold green]")
        if error_count > 0:
            console.print(f"[bold red]❌ Fehler: {error_count}[/bold red]")
        console.print(f"[bold cyan]📁 Gespeichert in: {self.output_dir}/{playlist_name}/[/bold cyan]")


def process_all_playlists(transcriber, playlist_manager, language="de"):
    """Verarbeitet alle Playlists"""
    playlists = playlist_manager.get_all_playlists()
    
    if not playlists:
        console.print("[yellow]⚠️  Keine Playlists gefunden![/yellow]")
        console.print(f"Erstelle .txt Dateien in: {playlist_manager.playlists_dir}/")
        return
    
    console.print(f"\n[bold cyan]🔍 Gefundene Playlists:[/bold cyan]")
    playlist_manager.display_playlists_tree()
    
    # Statistiken sammeln
    total_urls = 0
    total_new = 0
    
    for name, path in playlists.items():
        urls = playlist_manager.read_playlist(path)
        new_count = sum(1 for url in urls if not transcriber.is_cached(url))
        total_urls += len(urls)
        total_new += new_count
    
    console.print(f"\n[bold]📊 Gesamt: {total_urls} Videos, {total_new} neu zu transkribieren[/bold]")
    
    # Verarbeite jede Playlist
    for name, path in playlists.items():
        urls = playlist_manager.read_playlist(path)
        if urls:
            console.print(f"\n" + "=" * 60)
            transcriber.process_playlist(name, urls, language)
    
    console.print("\n[bold green]🎉 Alle Playlists verarbeitet![/bold green]")


def main():
    parser = argparse.ArgumentParser(
        description='YouTube Transcriber v3.0 - Playlist Management'
    )
    parser.add_argument(
        'command',
        nargs='?',
        choices=['scan', 'list', 'process'],
        default='scan',
        help='Befehl: scan (alle Playlists), list (zeige Playlists), process (einzelne URL)'
    )
    parser.add_argument(
        'url',
        nargs='?',
        help='YouTube URL (nur für process)'
    )
    parser.add_argument(
        '--playlist',
        help='Spezifische Playlist verarbeiten'
    )
    parser.add_argument(
        '--model',
        default='base',
        choices=['tiny', 'base', 'small', 'medium', 'large'],
        help='Whisper Model (default: base)'
    )
    parser.add_argument(
        '--language',
        default='de',
        help='Sprache (default: de)'
    )
    parser.add_argument(
        '--playlists-dir',
        default='playlists',
        help='Ordner mit Playlist-Dateien (default: playlists)'
    )
    parser.add_argument(
        '--output',
        default='transcripts',
        help='Ausgabe-Ordner (default: transcripts)'
    )
    
    args = parser.parse_args()
    
    # Zeige Logo
    console.print(LOGO)
    
    # Initialisiere Manager
    playlist_manager = PlaylistManager(args.playlists_dir)
    transcriber = YouTubeTranscriber(
        model_size=args.model,
        output_dir=args.output
    )
    
    if args.command == 'list':
        # Zeige nur Playlists
        playlists = playlist_manager.get_all_playlists()
        if playlists:
            console.print("[bold cyan]📁 Verfügbare Playlists:[/bold cyan]\n")
            playlist_manager.display_playlists_tree()
            
            # Zeige Details
            console.print("\n[bold]Details:[/bold]")
            for name, path in playlists.items():
                urls = playlist_manager.read_playlist(path)
                new_count = sum(1 for url in urls if not transcriber.is_cached(url))
                console.print(f"  • {name}: {len(urls)} URLs ({new_count} neu)")
        else:
            console.print("[yellow]Keine Playlists gefunden![/yellow]")
            console.print(f"Erstelle .txt Dateien in: {args.playlists_dir}/")
    
    elif args.command == 'process':
        # Verarbeite einzelne URL
        if args.url:
            output, _ = transcriber.process_video(args.url, args.language)
            if output:
                console.print(f"[green]✅ Gespeichert: {output}[/green]")
        else:
            console.print("[red]❌ Bitte URL angeben für 'process' Befehl[/red]")
    
    elif args.command == 'scan':
        # Verarbeite Playlists
        if args.playlist:
            # Spezifische Playlist
            playlists = playlist_manager.get_all_playlists()
            if args.playlist in playlists:
                path = playlists[args.playlist]
                urls = playlist_manager.read_playlist(path)
                transcriber.process_playlist(args.playlist, urls, args.language)
            else:
                console.print(f"[red]❌ Playlist '{args.playlist}' nicht gefunden![/red]")
                console.print("Verfügbare Playlists:")
                for name in playlists.keys():
                    console.print(f"  • {name}")
        else:
            # Alle Playlists
            process_all_playlists(transcriber, playlist_manager, args.language)
    
    console.print("\n[bold green]✨ Fertig![/bold green]")


if __name__ == "__main__":
    main()