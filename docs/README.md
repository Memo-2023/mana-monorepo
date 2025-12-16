# Manacore Monorepo Documentation

Welcome to the Manacore monorepo documentation. This guide helps you find exactly what you need.

## 🚀 Quick Navigation

| I want to... | Go here |
|-------------|---------|
| **Start developing locally** | [Local Development](getting-started/local-development.md) |
| **Set up environment variables** | [Environment Setup](../CLAUDE.md#environment-variables) |
| **Understand the architecture** | [Deployment Architecture](DEPLOYMENT_ARCHITECTURE.md) |
| **Work with databases** | [Database Migrations](DATABASE_MIGRATIONS.md) |
| **Deploy to staging** | [Staging Setup](STAGING_SETUP.md) |
| **Deploy to production** | [Deployment Runbooks](DEPLOYMENT_RUNBOOKS.md) |
| **Use Docker locally** | [Docker Guide](DOCKER_GUIDE.md) |
| **Debug an issue** | [Staging Issues](STAGING_DEPLOYMENT_ISSUES.md) |
| **Learn code patterns** | [Guidelines](../.claude/GUIDELINES.md) |
| **Configure CI/CD** | [CI/CD Setup](CI_CD_SETUP.md) |
| **Work with runtime config** | [Runtime Config](RUNTIME_CONFIG.md) |
| **Self-host the platform** | [Self-Hosting Guide](SELF-HOSTING-GUIDE.md) |

## 📁 Documentation Structure

### Getting Started
First-time setup, environment configuration, and basic workflows.
- [Local Development](LOCAL_DEVELOPMENT.md) - Complete local development setup
- [Setup Templates](SETUP_TEMPLATES.md) - Templates for new projects

### Architecture & Design
System design, technology choices, and architectural patterns.
- [Deployment Architecture](DEPLOYMENT_ARCHITECTURE.md) - Complete infrastructure overview
- [Deployment Diagrams](DEPLOYMENT_DIAGRAMS.md) - Visual architecture diagrams

### Development Workflows
Day-to-day development, migrations, and Docker.
- [Database Migrations](DATABASE_MIGRATIONS.md) - Migration best practices
- [Docker Guide](DOCKER_GUIDE.md) - Local Docker setup
- [Git Workflow](GIT_WORKFLOW.md) - Git branching and commit conventions
- [Development Scripts](DEVELOPMENT_SCRIPTS.md) - Helper scripts

### Deployment & Operations
CI/CD, staging, production deployment, and operational procedures.
- [Deployment Overview](DEPLOYMENT.md) - Deployment strategy overview
- [Deployment Runbooks](DEPLOYMENT_RUNBOOKS.md) - Step-by-step deployment procedures
- [Staging Setup](STAGING_SETUP.md) - Hetzner staging environment
- [Staging Issues](STAGING_DEPLOYMENT_ISSUES.md) - Known issues and solutions
- [Hetzner Production Guide](HETZNER_PRODUCTION_GUIDE.md) - Production deployment
- [CI/CD Setup](CI_CD_SETUP.md) - GitHub Actions configuration
- [Runtime Config](RUNTIME_CONFIG.md) - Dynamic configuration injection

### Specialized Topics
- [PWA Guide](PWA_GUIDE.md) - Progressive Web App setup
- [I18N](I18N.md) - Internationalization
- [User Settings](USER_SETTINGS.md) - User settings architecture
- [Self-Hosting Guide](SELF-HOSTING-GUIDE.md) - Self-hosting instructions
- [Testing Guide](TESTING.md) - Testing strategies

### Project-Specific
- [ManaDeck Postgres Migration](MANADECK_POSTGRES_MIGRATION.md) - ManaDeck database migration
- [Uload Deployment](ULOAD-DEPLOYMENT.md) - Uload-specific deployment

### Archived Documentation
Historical documentation and analysis reports moved to [archive/](archive/).

## 🎯 Documentation Philosophy

This documentation follows these principles:

1. **Progressive Disclosure** - Start with essentials, link to deep dives
2. **Single Source of Truth** - Each topic has one authoritative document
3. **Task-Oriented** - Organized by what you're trying to accomplish
4. **Keep Current** - Archive or delete outdated docs instead of letting them linger

## 📝 For AI Assistants

If you're Claude or another AI assistant:
- Start with [CLAUDE.md](../CLAUDE.md) for essential patterns
- Reference [Guidelines](../.claude/GUIDELINES.md) for detailed coding patterns
- Use this README to find specific documentation topics
- Always check file modification dates to ensure information is current

## 🔄 Maintenance

When updating documentation:
- Update this README if you add/move/remove major docs
- Archive outdated docs to `archive/` rather than deleting
- Keep cross-references up to date
- Update the modification date in this file

---

**Last Updated:** 2025-12-16
