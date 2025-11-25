# uLoad - URL Shortener & Link Management

A modern URL shortener and link management platform built with SvelteKit and PocketBase.

## 🚀 Production

**Live:** https://ulo.ad  
**Admin:** https://ulo.ad/_/

## 🛠 Tech Stack

- **Frontend:** SvelteKit 2.0 + Svelte 5
- **Backend:** PocketBase (embedded)
- **Styling:** Tailwind CSS 4.0
- **Deployment:** Docker + Coolify on Hetzner VPS
- **Database:** SQLite (via PocketBase)

## 📦 Features

- URL shortening with custom codes
- QR code generation
- Click analytics
- User profiles (e.g., ulo.ad/p/username)
- Link management dashboard
- Real-time statistics

## 🏃 Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Start with PocketBase backend
npm run dev:all

# Run tests
npm run test

# Type checking
npm run check
```

## 🐳 Docker Deployment

```bash
# Build and run locally
docker-compose up --build

# Access at:
# Frontend: http://localhost:3000
# PocketBase: http://localhost:8090
```

## 📝 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete Coolify deployment instructions
- [Lessons Learned](./DEPLOYMENT_LESSONS_LEARNED.md) - Troubleshooting and insights
- [Domain Setup](./DOMAIN_SETUP_ULO_AD.md) - ulo.ad configuration
- [Coolify Setup](./COOLIFY_SETUP.md) - Detailed Coolify configuration

## 🔧 Environment Variables

```bash
NODE_ENV=production
PORT=3000
ORIGIN=https://ulo.ad
PUBLIC_POCKETBASE_URL=https://ulo.ad/api
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=secure_password
```

See `.env.example` for all configuration options.

## 📂 Project Structure

```
uload/
├── src/               # SvelteKit application
│   ├── routes/       # Pages and API routes
│   ├── lib/          # Components and utilities
│   └── app.html      # HTML template
├── backend/           # PocketBase configuration
│   ├── pb_schema.json # Database schema
│   └── init-pocketbase.sh # Setup script
├── build/            # Production build output
├── static/           # Static assets
├── Dockerfile        # Multi-stage Docker build
├── docker-compose.yml # Local development
├── supervisord.conf  # Process management
└── CLAUDE.md         # AI assistant context
```

## 🚢 Deployment

The application is deployed on Hetzner VPS using Coolify with automatic deployments on push to main branch.

```bash
# Commit and push to deploy
git add .
git commit -m "Update"
git push origin main
# Coolify automatically deploys
```

### Manual Deployment Steps:

1. Set DNS A record to `91.99.221.179`
2. Add domain in Coolify
3. Update environment variables
4. Enable SSL certificate
5. Deploy application

## 📊 Monitoring

- **Health Check:** https://ulo.ad/health
- **Admin Panel:** https://ulo.ad/_/
- **Server:** Hetzner CX21 (2 vCPU, 4GB RAM)
- **Uptime:** 99.9% SLA

## 🔐 Security

- HTTPS enforced
- Environment-based configuration
- Secure admin authentication
- Rate limiting on API endpoints
- Regular security updates

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

Common issues and solutions are documented in [DEPLOYMENT_LESSONS_LEARNED.md](./DEPLOYMENT_LESSONS_LEARNED.md)

For support, check:

- Application logs in Coolify
- Health endpoint status
- PocketBase admin panel

## 📄 License

Private - Memoro AI © 2024
