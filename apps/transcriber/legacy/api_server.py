#!/usr/bin/env python3
"""
FastAPI Server für YouTube Transcriber Web Interface
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
import asyncio
import json
import os
from pathlib import Path
from datetime import datetime
import uuid
from enum import Enum

# Import existing transcriber modules
from transcriber_v4_parallel import ParallelTranscriber
import whisper

app = FastAPI(title="YouTube Transcriber API", version="1.0.0")

# CORS middleware for Astro frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4321", "http://localhost:3000"],  # Astro dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
class JobStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    TRANSCRIBING = "transcribing"
    COMPLETED = "completed"
    FAILED = "failed"

class TranscriptionJob:
    def __init__(self, job_id: str, url: str, model: str = "base", language: str = "de"):
        self.id = job_id
        self.url = url
        self.model = model
        self.language = language
        self.status = JobStatus.PENDING
        self.progress = 0
        self.created_at = datetime.now()
        self.completed_at = None
        self.transcript_path = None
        self.error = None
        self.video_info = {}

# Store active jobs
active_jobs: Dict[str, TranscriptionJob] = {}
websocket_connections: List[WebSocket] = []

# Request/Response models
class TranscribeRequest(BaseModel):
    url: HttpUrl
    model: str = "base"
    language: str = "de"

class PlaylistRequest(BaseModel):
    name: str
    description: Optional[str] = None
    urls: List[HttpUrl]

class JobResponse(BaseModel):
    id: str
    url: str
    status: str
    progress: int
    created_at: datetime
    completed_at: Optional[datetime]
    transcript_path: Optional[str]
    error: Optional[str]
    video_info: Dict[str, Any]

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# API Endpoints
@app.get("/")
async def root():
    return {"message": "YouTube Transcriber API", "version": "1.0.0"}

@app.post("/api/transcribe", response_model=JobResponse)
async def start_transcription(request: TranscribeRequest, background_tasks: BackgroundTasks):
    """Start a new transcription job"""
    job_id = str(uuid.uuid4())
    job = TranscriptionJob(job_id, str(request.url), request.model, request.language)
    active_jobs[job_id] = job
    
    # Start transcription in background
    background_tasks.add_task(process_transcription, job)
    
    return JobResponse(
        id=job.id,
        url=job.url,
        status=job.status,
        progress=job.progress,
        created_at=job.created_at,
        completed_at=job.completed_at,
        transcript_path=job.transcript_path,
        error=job.error,
        video_info=job.video_info
    )

@app.get("/api/status/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: str):
    """Get status of a transcription job"""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = active_jobs[job_id]
    return JobResponse(
        id=job.id,
        url=job.url,
        status=job.status,
        progress=job.progress,
        created_at=job.created_at,
        completed_at=job.completed_at,
        transcript_path=job.transcript_path,
        error=job.error,
        video_info=job.video_info
    )

@app.get("/api/jobs")
async def list_jobs():
    """List all transcription jobs"""
    return [
        JobResponse(
            id=job.id,
            url=job.url,
            status=job.status,
            progress=job.progress,
            created_at=job.created_at,
            completed_at=job.completed_at,
            transcript_path=job.transcript_path,
            error=job.error,
            video_info=job.video_info
        )
        for job in active_jobs.values()
    ]

@app.get("/api/transcripts")
async def list_transcripts():
    """List all available transcripts"""
    transcript_dir = Path("transcripts")
    transcripts = []
    
    if transcript_dir.exists():
        for playlist_dir in transcript_dir.iterdir():
            if playlist_dir.is_dir():
                for channel_dir in playlist_dir.iterdir():
                    if channel_dir.is_dir():
                        for transcript_file in channel_dir.glob("*.txt"):
                            transcripts.append({
                                "playlist": playlist_dir.name,
                                "channel": channel_dir.name,
                                "filename": transcript_file.name,
                                "path": str(transcript_file),
                                "size": transcript_file.stat().st_size,
                                "modified": datetime.fromtimestamp(transcript_file.stat().st_mtime)
                            })
    
    return transcripts

@app.get("/api/transcript/{transcript_path:path}")
async def get_transcript(transcript_path: str):
    """Get transcript content"""
    file_path = Path(transcript_path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    return FileResponse(file_path)

@app.get("/api/playlists")
async def list_playlists():
    """List all playlists"""
    playlist_dir = Path("playlists")
    playlists = []
    
    if playlist_dir.exists():
        for category_dir in playlist_dir.iterdir():
            if category_dir.is_dir():
                for playlist_file in category_dir.glob("*.txt"):
                    urls = []
                    with open(playlist_file, 'r') as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith('#'):
                                urls.append(line)
                    
                    playlists.append({
                        "category": category_dir.name,
                        "name": playlist_file.stem,
                        "path": str(playlist_file),
                        "url_count": len(urls),
                        "urls": urls
                    })
    
    return playlists

@app.post("/api/playlists")
async def create_playlist(request: PlaylistRequest):
    """Create a new playlist"""
    # Extract category and name from the playlist name (e.g., "tech/python_tutorials")
    parts = request.name.split('/')
    if len(parts) == 2:
        category, name = parts
    else:
        category = "general"
        name = request.name
    
    playlist_dir = Path("playlists") / category
    playlist_dir.mkdir(parents=True, exist_ok=True)
    
    playlist_file = playlist_dir / f"{name}.txt"
    
    with open(playlist_file, 'w') as f:
        if request.description:
            f.write(f"# {request.description}\n")
        f.write("# Eine URL pro Zeile\n\n")
        for url in request.urls:
            f.write(f"{url}\n")
    
    return {"message": "Playlist created", "path": str(playlist_file)}

@app.delete("/api/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a transcription job"""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = active_jobs[job_id]
    job.status = JobStatus.FAILED
    job.error = "Cancelled by user"
    
    await manager.broadcast({
        "type": "job_cancelled",
        "job_id": job_id
    })
    
    return {"message": "Job cancelled"}

@app.websocket("/ws/progress")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time progress updates"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(1)
            
            # Send heartbeat
            await websocket.send_json({"type": "heartbeat"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Background task for processing
async def process_transcription(job: TranscriptionJob):
    """Process a transcription job"""
    try:
        # Update status
        job.status = JobStatus.DOWNLOADING
        await manager.broadcast({
            "type": "job_update",
            "job_id": job.id,
            "status": job.status,
            "progress": 10
        })
        
        # Initialize transcriber
        transcriber = ParallelTranscriber(
            model_size=job.model,
            language=job.language,
            max_downloads=1,  # Single job
            max_transcriptions=1
        )
        
        # Simulate processing (replace with actual transcriber call)
        job.status = JobStatus.TRANSCRIBING
        job.progress = 50
        await manager.broadcast({
            "type": "job_update",
            "job_id": job.id,
            "status": job.status,
            "progress": job.progress
        })
        
        # TODO: Integrate actual transcription
        # result = await transcriber.process_single(job.url)
        
        # Mark as completed
        job.status = JobStatus.COMPLETED
        job.progress = 100
        job.completed_at = datetime.now()
        
        await manager.broadcast({
            "type": "job_complete",
            "job_id": job.id,
            "status": job.status,
            "progress": job.progress
        })
        
    except Exception as e:
        job.status = JobStatus.FAILED
        job.error = str(e)
        await manager.broadcast({
            "type": "job_error",
            "job_id": job.id,
            "error": job.error
        })

@app.get("/api/models")
async def get_available_models():
    """Get available Whisper models"""
    return {
        "models": [
            {"name": "tiny", "size": "39 MB", "speed": "~10x", "accuracy": "75%"},
            {"name": "base", "size": "74 MB", "speed": "~7x", "accuracy": "85%"},
            {"name": "small", "size": "244 MB", "speed": "~4x", "accuracy": "91%"},
            {"name": "medium", "size": "769 MB", "speed": "~2x", "accuracy": "94%"},
            {"name": "large", "size": "1.5 GB", "speed": "~1x", "accuracy": "96-98%"}
        ]
    }

@app.get("/api/stats")
async def get_statistics():
    """Get system statistics"""
    transcript_dir = Path("transcripts")
    total_transcripts = 0
    total_size = 0
    
    if transcript_dir.exists():
        for file in transcript_dir.rglob("*.txt"):
            total_transcripts += 1
            total_size += file.stat().st_size
    
    return {
        "total_transcripts": total_transcripts,
        "total_size_mb": round(total_size / 1024 / 1024, 2),
        "active_jobs": len([j for j in active_jobs.values() if j.status in [JobStatus.PENDING, JobStatus.DOWNLOADING, JobStatus.TRANSCRIBING]]),
        "completed_jobs": len([j for j in active_jobs.values() if j.status == JobStatus.COMPLETED]),
        "failed_jobs": len([j for j in active_jobs.values() if j.status == JobStatus.FAILED])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)