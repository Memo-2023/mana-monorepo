# Memoro Admin API

Backend API service for Memoro Admin with AI image generation via Replicate.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Replicate API Token (get it from https://replicate.com/account/api-tokens)

### Installation

1. **Install dependencies:**

```bash
cd services/admin-api
npm install
```

2. **Configure environment:**

```bash
cp .env.example .env
# Edit .env and add your REPLICATE_API_TOKEN
```

3. **Run in development:**

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 📝 API Endpoints

### Health Check

```bash
GET /health
# No auth required
```

### Test Replicate Configuration

```bash
GET /api/personas/test?apiKey=your-api-key
```

### Generate Persona Images

```bash
POST /api/personas/generate-images
Headers:
  X-API-Key: your-api-key
Body:
{
  "personaData": {
    "name": "Thomas Bauer",
    "appearance": {
      "prompt": "45 year old German craftsman...",
      "description": "..."
    }
  },
  "style": "portrait", // portrait | professional | casual | lifestyle
  "count": 4 // 1-4 images
}
```

### Get Available Styles

```bash
GET /api/personas/styles?apiKey=your-api-key
```

## 🐳 Docker Deployment

### Using Docker Compose:

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f admin-api
```

### Using Docker directly:

```bash
# Build image
docker build -t memoro-admin-api .

# Run container
docker run -d \
  -p 3001:3001 \
  -e REPLICATE_API_TOKEN=your_token \
  -e API_KEY=your_api_key \
  -v $(pwd)/storage:/app/storage \
  memoro-admin-api
```

## 🔧 Configuration

### Environment Variables

| Variable              | Description              | Default                     |
| --------------------- | ------------------------ | --------------------------- |
| `PORT`                | API server port          | `3001`                      |
| `REPLICATE_API_TOKEN` | Your Replicate API token | Required                    |
| `API_KEY`             | API authentication key   | `memoro-admin-api-key-2025` |
| `CORS_ORIGIN`         | Allowed CORS origin      | `http://localhost:4321`     |
| `STORAGE_PATH`        | Local image storage path | `./storage/images`          |
| `LOG_LEVEL`           | Logging level            | `debug`                     |

## 💰 Cost Estimation

- **SDXL Model:** ~$0.0023 per image
- **4 images per persona:** ~$0.01
- **100 personas:** ~$1.00

## 📁 Project Structure

```
admin-api/
├── src/
│   ├── index.ts              # Main server file
│   ├── routes/
│   │   └── personas.route.ts  # Personas endpoints
│   ├── services/
│   │   └── replicate.service.ts # Replicate integration
│   └── types/
│       └── persona.types.ts   # TypeScript types
├── storage/                   # Generated images storage
├── docker-compose.yml         # Docker orchestration
├── Dockerfile                 # Container definition
└── package.json              # Dependencies
```

## 🧪 Testing

### Test API locally:

```bash
# 1. Check health
curl http://localhost:3001/health

# 2. Test Replicate configuration
curl "http://localhost:3001/api/personas/test?apiKey=memoro-admin-api-key-2025"

# 3. Generate test image
curl -X POST http://localhost:3001/api/personas/generate-images \
  -H "X-API-Key: memoro-admin-api-key-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional portrait of a 45 year old German craftsman",
    "style": "portrait",
    "count": 1
  }'
```

## 🚢 Production Deployment (Hetzner + Coolify)

1. Push to GitHub
2. Connect repository in Coolify
3. Set environment variables
4. Deploy as Docker Compose stack
5. Configure custom domain & SSL

## 📄 License

Private - Memoro Internal Use Only
