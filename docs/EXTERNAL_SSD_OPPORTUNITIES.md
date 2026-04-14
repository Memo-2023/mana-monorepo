# External 4TB SSD - Opportunities & Usage Guide

This document outlines the opportunities enabled by the 4TB external SSD connected to the Mac Mini production server.

## Current Setup

| Component | Details |
|-----------|---------|
| **Device** | Mac Mini M4 (16GB RAM) |
| **Internal SSD** | 228 GB (30 GB free) |
| **External SSD** | 4 TB (3.6 TB free) |
| **Mount Point** | `/Volumes/TillJakob-S04` |
| **Data Directory** | `/Volumes/TillJakob-S04/ManaData/` |

## Currently Migrated to SSD

| Item | Size | Path |
|------|------|------|
| Ollama Models | ~26 GB | `ManaData/ollama/` (symlink: `~/.ollama`) |
| STT Models | ~19 GB | `ManaData/stt-models/` (symlink: `~/STT-models`) |
| FLUX.2 | ~15 GB | `ManaData/flux2/` (symlink: `~/FLUX.2`) |
| Matrix Media | Variable | `ManaData/matrix-media/` |
| PostgreSQL Backups | Variable | `ManaData/backups/postgres/` |

---

## Opportunities

### 1. Larger LLM Models

With 4TB available, we can host significantly larger and more capable models:

| Model | Size | Use Case |
|-------|------|----------|
| `llama3:70b-q4` | ~40 GB | Highest quality general-purpose |
| `mixtral:8x7b` | ~26 GB | Fast Mixture of Experts |
| `codestral:22b` | ~13 GB | Best code assistant |
| `qwen2.5:32b` | ~20 GB | Excellent multilingual (German) |
| `deepseek-coder-v2:16b` | ~10 GB | Top coding performance |
| `llava:34b` | ~20 GB | Best vision model |

**Potential:** Host 10-20 specialized models for different tasks, switch dynamically based on use case.

### 2. RAG / Knowledge Databases

Enable semantic search and retrieval-augmented generation:

- **Vector Database** (Qdrant, ChromaDB, Milvus)
- Index documents, PDFs, codebases
- Build knowledge bases for Chat app
- Make company documentation searchable
- Estimated storage: 50-200 GB depending on corpus size

### 3. Local AI Services Expansion

| Service | Storage | Benefit |
|---------|---------|---------|
| **Whisper Large-v3** | ~3 GB | Best-in-class speech recognition |
| **ComfyUI + Models** | 50-100 GB | Local image generation (SDXL, Flux) |
| **MusicGen** | ~10 GB | AI music generation |
| **Video Models** | 20-50 GB | Local video AI |
| **TTS Models** | ~5 GB | High-quality text-to-speech |

### 4. Extended Backups & Disaster Recovery

Comprehensive backup strategy enabled by large storage:

#### Database Backups
- **Daily snapshots** with 90+ day retention
- **Point-in-time recovery** capability
- **Cross-database consistency** backups
- Estimated: 50-100 GB for full history

#### Docker Infrastructure
- **Local image registry** for faster deployments
- **Build cache** persistence across restarts
- **Container snapshots** before major updates
- Estimated: 100-200 GB

#### Code & Configuration
- **Git repository mirrors** (full clone backups)
- **Configuration backups** (Docker, Nginx, etc.)
- **Secrets backup** (encrypted)
- Estimated: 10-50 GB

#### System Recovery
- **Full system snapshots** via Time Machine or rsync
- **Bootable recovery** partition
- **Quick restore** capability
- Estimated: 250-500 GB

### 5. Media & Content Storage

Centralized media handling for all applications:

#### MinIO Expansion
| Bucket | Purpose | Est. Size |
|--------|---------|-----------|
| `picture-storage` | AI-generated images | 100+ GB |
| `storage-storage` | User cloud storage | 500+ GB |
| `food-storage` | Meal photos | 50+ GB |
| `chat-attachments` | Chat file uploads | 100+ GB |
| `presi-assets` | Presentation media | 50+ GB |

#### Media Processing
- **Video transcoding** pipeline with temp storage
- **Image optimization** cache
- **Thumbnail generation** storage
- **Audio processing** workspace

#### Content Delivery
- **Static asset hosting** for all apps
- **Game assets** for games/ projects
- **Landing page media** (images, videos)
- **Documentation assets**

### 6. New Application Possibilities

The storage enables entirely new application categories:

#### Media Applications
| App Idea | Storage Need | Description |
|----------|--------------|-------------|
| **Video Library** | 500+ GB | Local video storage with transcripts, searchable via AI |
| **Music Streaming** | 200+ GB | Personal music collection, Spotify-like interface |
| **Photo Library** | 500+ GB | iCloud/Google Photos alternative with AI tagging |
| **Podcast Archive** | 100+ GB | Download, transcribe, search podcasts |

#### Document & Knowledge
| App Idea | Storage Need | Description |
|----------|--------------|-------------|
| **Document Vault** | 100+ GB | Encrypted document storage with OCR |
| **Research Archive** | 200+ GB | Papers, articles, bookmarks with AI summaries |
| **Code Archive** | 50+ GB | Searchable repository of code snippets |
| **Learning Library** | 100+ GB | Courses, tutorials, educational content |

#### AI-Powered Services
| App Idea | Storage Need | Description |
|----------|--------------|-------------|
| **Local AI Studio** | 200+ GB | ComfyUI, training data, generated outputs |
| **Voice Clone Lab** | 20+ GB | Custom TTS voices |
| **Dataset Hub** | 100+ GB | ML training datasets |

### 7. Development & Testing

Enhanced development workflow:

- **Large test datasets** for ML experiments
- **Build cache** for faster CI/CD
- **Staging databases** with production-like data
- **Log aggregation** (Loki/ELK) with extended retention
- **Performance profiling** data storage

---

## Implementation Priority

### Phase 1 (Immediate)
- [x] Migrate Ollama models
- [x] Migrate STT/FLUX models
- [x] Setup PostgreSQL backups
- [ ] Download additional LLM models

### Phase 2 (Short-term)
- [ ] Setup local Docker registry
- [ ] Expand MinIO to SSD
- [ ] Implement extended backup retention
- [ ] Add vector database for RAG

### Phase 3 (Medium-term)
- [ ] Setup ComfyUI for local image generation
- [ ] Implement media processing pipeline
- [ ] Add video/audio transcription service

### Phase 4 (Long-term)
- [ ] Build new media-focused applications
- [ ] Implement full disaster recovery
- [ ] Create AI training infrastructure

---

## Technical Notes

### Adding Docker File Sharing for SSD

To enable Docker containers to use SSD storage directly:

1. Open Docker Desktop → Settings → Resources → File Sharing
2. Add `/Volumes/TillJakob-S04/ManaData/`
3. Restart Docker Desktop

### Symlink Pattern

For applications that don't support custom paths:
```bash
# Move data to SSD
mv ~/original-path /Volumes/TillJakob-S04/ManaData/new-location

# Create symlink
ln -s /Volumes/TillJakob-S04/ManaData/new-location ~/original-path
```

### Monitoring SSD Usage

```bash
# Check SSD usage
df -h /Volumes/TillJakob-S04

# Check ManaData breakdown
du -sh /Volumes/TillJakob-S04/ManaData/*
```

---

*Last updated: 2026-02-01*
