# Hetzner Production Deployment Guide

**Version**: 1.0
**Last Updated**: 2025-12-01
**Scope**: Complete production deployment guide for Manacore monorepo on Hetzner Cloud

---

## Table of Contents

1. [Server Specifications](#1-server-specifications--instance-types)
2. [Network Architecture](#2-network-architecture)
3. [Storage & Backup Strategies](#3-storage--backup-strategies)
4. [Security Hardening](#4-security-hardening-checklist)
5. [Monitoring & Logging](#5-monitoring--logging-solutions)
6. [CI/CD Integration](#6-cicd-integration-patterns)
7. [Cost Optimization](#7-cost-optimization-tips)
8. [Orchestration Choice](#8-orchestration-choice-docker-swarm-vs-kubernetes)
9. [Production Setup Scripts](#9-production-ready-deployment-scripts)
10. [Production Checklist](#10-production-ready-checklist)

---

## 1. Server Specifications & Instance Types

### Recommended Server Types

#### Entry-Level Production (Small Applications)

**Hetzner CX23**: 2 vCPUs, 4 GB RAM, 40 GB storage, 20 TB traffic
- **Price**: €3.49/month
- **Use Case**: Single container apps, development/staging environments
- **Suitable For**: Individual microservices, low-traffic applications

#### Mid-Tier Production (Standard Applications)

**Hetzner CPX21**: 3 shared vCPUs, 4 GB RAM, 80 GB storage
- **Price**: ~€7/month
- **Use Case**: Multi-container applications, small microservices
- **Best For**: 2-3 backend services + web apps

**Hetzner CX33**: 2 vCPUs, 8 GB RAM, 80 GB storage, 20 TB traffic
- **Price**: €5.49/month
- **Use Case**: Standard production workloads
- **Best For**: Full stack with 5-6 services

#### High-Performance Production

**CCX Series**: Dedicated vCPUs for CPU-intensive workloads
- **CCX42**: 16 vCPU, 64 GB RAM - €101/month
- **Use Case**: High-traffic applications, full monorepo deployment
- **Best For**: 10+ services with monitoring stack

**CAX ARM Series**: 40% better cost efficiency
- **CAX21**: 4 ARM vCPUs, 8 GB RAM - ~€8/month
- **Use Case**: ARM-compatible Docker images
- **Benefit**: Better performance-per-euro

### ARM vs x86 Considerations

**ARM64 (CAX) Advantages**:
- 40% cost savings
- Better performance-per-euro
- Modern Docker images support ARM64

**Compatibility Check**:
- Node.js: ✅ Full ARM64 support
- Python: ✅ Full ARM64 support
- Go: ✅ Native ARM64
- PostgreSQL: ✅ Official ARM images
- Redis: ✅ Official ARM images

**Check Your Dependencies**:
```bash
# Test ARM compatibility locally (M1/M2 Mac)
docker buildx build --platform linux/arm64 .

# Or on AMD64 with QEMU
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
docker buildx build --platform linux/arm64 .
```

### Installation Method

**Recommended**: Use **Docker CE App** from Hetzner Cloud Apps during server creation.

**Benefits**:
- Docker and docker-compose pre-installed
- Optimized for Hetzner infrastructure
- Eliminates manual installation errors

**Alternative** (Manual Installation):
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
```

---

## 2. Network Architecture

### Private Networks

**Architecture Overview**:

```
┌─────────────────┐     ┌─────────────────┐
│   Web Server    │────▶│   App Server    │
│  (Public IP)    │     │ (Private only)  │
│  - Traefik      │     │  - Backends     │
│  - Web Apps     │     │  - Processing   │
└─────────────────┘     └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │  Database   │
              │  (Private)  │
              │ - PostgreSQL│
              │ - Redis     │
              └─────────────┘
```

### Best Practices

**1. Configure Private Networks BEFORE Docker Installation**

```bash
# Create private network via Hetzner Console or CLI
hcloud network create --name production-network --ip-range 10.0.0.0/16

# Create subnet
hcloud network add-subnet production-network --network-zone eu-central --type server --ip-range 10.0.1.0/24

# Attach servers to network
hcloud server attach-to-network <server-id> --network production-network --ip 10.0.1.2
```

**2. Docker Daemon Configuration for Private Networks**

**MTU for Private Networks**: 1450 bytes (Hetzner requirement)

```json
// /etc/docker/daemon.json
{
  "mtu": 1450,
  "default-address-pools": [
    {"base": "172.17.0.0/12", "size": 24}
  ],
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "icc": false
}
```

**Apply Configuration**:
```bash
systemctl restart docker
```

**3. Network Isolation Strategy**

- **Public Network**: Only expose necessary services (web apps, APIs)
- **Private Network**: All inter-service communication (backends, databases)
- **Hetzner Cloud Firewall**: Primary security layer
- **UFW (Secondary)**: Host-level firewall

### Floating IPs (High Availability)

**Use Cases**:
- High availability setups
- Zero-downtime deployments
- Failover scenarios

**Implementation with Docker Swarm**:

```bash
# Create floating IP
hcloud floating-ip create --type ipv4 --name production-lb --home-location nbg1

# Assign to server
hcloud floating-ip assign <floating-ip-id> <server-id>

# Docker service for IP management
docker service create \
  --name ip-floater \
  --mode global \
  --constraint 'node.role==manager' \
  --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
  -e HCLOUD_TOKEN=${HCLOUD_TOKEN} \
  -e FLOATING_IP=${FLOATING_IP} \
  costela/hetzner-ip-floater:latest
```

### Load Balancers

**Hetzner Cloud Load Balancer**:

- **Protocol Support**: TCP, HTTP, HTTPS (HTTP/2 by default)
- **Health Checks**: Active and passive monitoring
- **Instant Configuration**: Changes apply immediately
- **Proxy Protocol**: Preserve client IP addresses
- **Pricing**: Starting at €5.39/month

**Recommended Architecture**:

```
Internet → Hetzner LB → Private Network → Docker Containers
```

**Configuration Options**:

1. **Direct Binding**: App containers bind to private IPs
   ```yaml
   services:
     web:
       networks:
         - private
       ports:
         - "10.0.1.2:3000:3000"
   ```

2. **Traefik Reverse Proxy**: LB routes to Traefik on Docker Swarm
   ```yaml
   services:
     traefik:
       ports:
         - "80:80"
         - "443:443"
       networks:
         - public
         - private
   ```

3. **Kubernetes Ingress**: Automatic LB provisioning
   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     annotations:
       load-balancer.hetzner.cloud/location: nbg1
   spec:
     type: LoadBalancer
   ```

---

## 3. Storage & Backup Strategies

### Block Storage Volumes

**Characteristics**:
- Attach to **single server only** (not shared)
- ext4 or xfs filesystems (ext4 recommended)
- Up to 10 TB per volume
- Hot-attach/detach support
- **€0.05/GB/month** pricing

**Docker Volume Best Practices**:

```bash
# 1. Create and format volume (first time)
mkfs.ext4 -F /dev/disk/by-id/scsi-0HC_Volume_12345

# 2. Mount volume to dedicated path
mkdir -p /mnt/volumes/data
mount /dev/disk/by-id/scsi-0HC_Volume_12345 /mnt/volumes/data

# 3. Add to /etc/fstab for persistence
echo '/dev/disk/by-id/scsi-0HC_Volume_12345 /mnt/volumes/data ext4 discard,nofail,defaults 0 0' >> /etc/fstab

# 4. Test auto-mount
umount /mnt/volumes/data
mount -a
```

**Docker Compose Usage**:

```yaml
volumes:
  app-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/volumes/data
```

### ⚠️ Critical: Hetzner Does NOT Provide Volume Backups

**You MUST implement your own backup solution**

### Backup Strategy

#### Option 1: Borg Backup with Storage Box (Recommended)

**Why Borg?**
- Deduplication (saves space)
- Compression (lz4, zstd)
- Encryption (AES-256)
- Incremental backups
- Fast recovery

**Setup**:

```bash
# 1. Install Borg
apt install borgbackup

# 2. Initialize repository on Storage Box
borg init --encryption=repokey \
  ssh://u123456@u123456.your-storagebox.de:23/./backups

# Store passphrase securely
echo "your-encryption-passphrase" > /root/.borg-passphrase
chmod 600 /root/.borg-passphrase

# 3. Create backup script
cat > /usr/local/bin/docker-backup.sh <<'EOF'
#!/bin/bash
set -e

BORG_REPO="ssh://u123456@u123456.your-storagebox.de:23/./backups"
export BORG_PASSPHRASE=$(cat /root/.borg-passphrase)

# Stop containers for consistency (optional)
# docker-compose -f /app/docker-compose.yml stop

# Create backup
borg create --stats --compression lz4 \
  $BORG_REPO::$(date +%Y%m%d-%H%M%S) \
  /mnt/volumes/data \
  /var/lib/docker/volumes

# Prune old backups
borg prune \
  --keep-daily=7 \
  --keep-weekly=4 \
  --keep-monthly=6 \
  $BORG_REPO

# Restart containers
# docker-compose -f /app/docker-compose.yml start

echo "Backup completed successfully"
EOF

chmod +x /usr/local/bin/docker-backup.sh

# 4. Schedule with cron (daily at 2 AM)
echo "0 2 * * * /usr/local/bin/docker-backup.sh >> /var/log/backup.log 2>&1" | crontab -
```

**Restore**:

```bash
# List backups
borg list ssh://u123456@u123456.your-storagebox.de:23/./backups

# Restore specific backup
borg extract ssh://u123456@u123456.your-storagebox.de:23/./backups::20251201-020000
```

#### Option 2: Restic (Alternative)

```bash
# Install Restic
apt install restic

# Initialize repository
restic -r sftp:u123456@u123456.your-storagebox.de:backups init

# Create backup
restic -r sftp:u123456@u123456.your-storagebox.de:backups \
  backup /mnt/volumes/data

# Restore
restic -r sftp:u123456@u123456.your-storagebox.de:backups \
  restore latest --target /mnt/volumes/data
```

#### Option 3: Database-Specific Backups

**PostgreSQL**:

```bash
#!/bin/bash
# /usr/local/bin/postgres-backup.sh

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

# Dump all databases
docker exec postgres pg_dumpall -U manacore | \
  gzip > $BACKUP_DIR/all-databases-$DATE.sql.gz

# Retain last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "PostgreSQL backup completed: $DATE"
```

**Redis**:

```bash
#!/bin/bash
# Redis automatically creates dump.rdb and appendonly.aof
# Just backup these files

cp /var/lib/docker/volumes/redis-data/_data/dump.rdb \
   /backup/redis/dump-$(date +%Y%m%d).rdb
```

**Schedule Both**:

```cron
# /etc/cron.d/database-backups
0 3 * * * root /usr/local/bin/postgres-backup.sh >> /var/log/postgres-backup.log 2>&1
30 3 * * * root /usr/local/bin/redis-backup.sh >> /var/log/redis-backup.log 2>&1
```

### Storage Box Usage

**Hetzner Storage Box** (NOT for Docker Images):

- **Remote storage via**: CIFS/SMB, SSHFS, SFTP, Borg
- **Pricing**: Starting at €3.81/month for 100 GB
- **Best For**: Backups, media files, logs

**Critical Warning**:

❌ **DO NOT store Docker images on Storage Box**
- Causes instability (storage can disconnect)
- Docker requires 100% available storage
- Use only for application data, NOT `/var/lib/docker`

**Safe Usage Pattern** (Application Uploads):

```yaml
# docker-compose.yml
volumes:
  uploads:
    driver: local
    driver_opts:
      type: cifs
      o: "username=u123456,password=${STORAGE_BOX_PASSWORD},addr=u123456.your-storagebox.de"
      device: "//u123456.your-storagebox.de/uploads"
```

---

## 4. Security Hardening Checklist

### Initial Server Setup

#### 1. SSH Hardening

```bash
# Disable root login
sed -i 's/#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication (SSH keys only)
sed -i 's/#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config

# Create sudo user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Setup SSH keys
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Restart SSH
systemctl restart sshd
```

#### 2. Firewall Configuration (Defense in Depth)

**Layer 1: Hetzner Cloud Firewall** (Primary):

```bash
# Create firewall via Hetzner CLI
hcloud firewall create --name production

# Allow SSH (from specific IPs only - replace with your IP)
hcloud firewall add-rule production \
  --direction in \
  --protocol tcp \
  --port 22 \
  --source-ips YOUR_IP/32

# Allow HTTP/HTTPS from anywhere
hcloud firewall add-rule production \
  --direction in \
  --protocol tcp \
  --port 80 \
  --source-ips 0.0.0.0/0,::/0

hcloud firewall add-rule production \
  --direction in \
  --protocol tcp \
  --port 443 \
  --source-ips 0.0.0.0/0,::/0

# Apply to server
hcloud firewall apply-to-resource production \
  --type server \
  --server web-01
```

**Layer 2: UFW** (Secondary, Host-Level):

```bash
# Install UFW
apt install ufw

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Allow Docker Swarm (if using)
ufw allow 2377/tcp   # Cluster management
ufw allow 7946/tcp   # Node communication
ufw allow 7946/udp   # Node communication
ufw allow 4789/udp   # Overlay network

# Enable firewall
ufw enable

# Check status
ufw status verbose
```

#### 3. Docker-Specific Security

```json
// /etc/docker/daemon.json
{
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "icc": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "metrics-addr": "127.0.0.1:9323",
  "experimental": true
}
```

**Docker Compose Security**:

```yaml
services:
  app:
    image: myapp:latest
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    user: "1000:1000"
```

#### 4. Fail2ban Configuration

```bash
apt install fail2ban

# Create local config
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[docker-auth]
enabled = true
filter = docker-auth
logpath = /var/log/docker.log
maxretry = 5
bantime = 1800
EOF

# Start fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

#### 5. Automatic Security Updates

```bash
apt install unattended-upgrades

# Configure automatic updates
dpkg-reconfigure --priority=low unattended-upgrades

# Verify configuration
cat /etc/apt/apt.conf.d/50unattended-upgrades
```

#### 6. Docker Secrets (for Swarm)

```bash
# Create secret from file
docker secret create db_password ./secrets/db_password.txt

# Or from stdin
echo "my_secure_password" | docker secret create db_password -

# Use in service
docker service create \
  --name app \
  --secret db_password \
  myapp:latest
```

**Access in Application**:

```javascript
// Node.js example
const fs = require('fs');
const dbPassword = fs.readFileSync('/run/secrets/db_password', 'utf8').trim();
```

### Security Checklist Summary

- [ ] SSH key-only authentication enabled
- [ ] Root SSH login disabled
- [ ] Hetzner Cloud Firewall configured with IP restrictions
- [ ] UFW enabled on all servers
- [ ] fail2ban installed and configured
- [ ] Automatic security updates enabled
- [ ] Docker secrets for sensitive data (production)
- [ ] All containers run as non-root users
- [ ] Docker content trust enabled (optional)
- [ ] Regular security audits with Docker Bench

---

## 5. Monitoring & Logging Solutions

### Option 1: Official Hetzner Prometheus + Grafana App

**Quick Setup**:

```bash
# 1. Select "Prometheus Grafana" app during server creation
# 2. After boot, SSH and activate:

cd /opt/prometheus-grafana
./activate.sh

# Access Grafana: http://your-server-ip:3000
# Default credentials: admin/admin (change immediately)
```

**Included Components**:
- Prometheus (metrics collection)
- Grafana (visualization)
- cAdvisor (container metrics)
- Node Exporter (host metrics)

### Option 2: Custom Docker Compose Monitoring Stack

**File**: `docker-compose.monitoring.yml`

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    ports:
      - "127.0.0.1:9090:9090"
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    volumes:
      - grafana-data:/var/lib/grafana
      - ./docker/grafana/provisioning:/etc/grafana/provisioning:ro
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_INSTALL_PLUGINS=redis-datasource,grafana-piechart-panel
      - GF_SERVER_ROOT_URL=https://grafana.yourdomain.com
    ports:
      - "127.0.0.1:3000:3000"
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - "127.0.0.1:8080:8080"
    restart: unless-stopped
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    command:
      - '--path.rootfs=/host'
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - '/:/host:ro,rslave'
    ports:
      - "127.0.0.1:9100:9100"
    restart: unless-stopped
    networks:
      - monitoring

  loki:
    image: grafana/loki:latest
    container_name: loki
    volumes:
      - loki-data:/loki
      - ./docker/loki/loki-config.yml:/etc/loki/local-config.yaml:ro
    ports:
      - "127.0.0.1:3100:3100"
    restart: unless-stopped
    networks:
      - monitoring

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./docker/promtail/promtail-config.yml:/etc/promtail/config.yml:ro
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - loki

volumes:
  prometheus-data:
    name: manacore-prometheus-data
  grafana-data:
    name: manacore-grafana-data
  loki-data:
    name: manacore-loki-data

networks:
  monitoring:
    name: manacore-monitoring
    driver: bridge
```

**Prometheus Configuration** (`docker/prometheus/prometheus.yml`):

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'manacore-production'
    environment: 'production'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'docker'
    static_configs:
      - targets: ['172.17.0.1:9323']

  - job_name: 'mana-core-auth'
    static_configs:
      - targets: ['mana-core-auth:3001']
    metrics_path: '/metrics'

  - job_name: 'chat-backend'
    static_configs:
      - targets: ['chat-backend:3002']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

**Alerting Configuration** (`docker/prometheus/alerts.yml`):

```yaml
groups:
  - name: docker
    interval: 30s
    rules:
      - alert: ContainerDown
        expr: up{job=~".*backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Container {{ $labels.job }} is down"
          description: "Container {{ $labels.job }} has been down for more than 1 minute."

      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.name }}"
          description: "Container {{ $labels.name }} memory usage is above 90%."

      - alert: HighCPUUsage
        expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.name }}"
          description: "Container {{ $labels.name }} CPU usage is above 80%."

  - name: host
    interval: 30s
    rules:
      - alert: HostOutOfDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Host out of disk space"
          description: "Disk space is below 10%."

      - alert: HostHighCPULoad
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Host high CPU load"
          description: "CPU load is > 80%."
```

### Hetzner-Specific Monitoring

**Hetzner Cloud Exporter** (Monitor Hetzner Resources):

```bash
docker run -d \
  --name hcloud-exporter \
  -p 9501:9501 \
  -e HCLOUD_TOKEN=${HCLOUD_TOKEN} \
  promhippie/hcloud_exporter:latest
```

**Add to Prometheus**:

```yaml
scrape_configs:
  - job_name: 'hetzner-cloud'
    static_configs:
      - targets: ['hcloud-exporter:9501']
```

**Available Grafana Dashboards**:
- **Hetzner Cloud Servers**: Dashboard ID 16169
- **Hetzner Cloud Servers & Load Balancers**: Dashboard ID 20257

### Log Management

**Loki Configuration** (`docker/loki/loki-config.yml`):

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-05-15
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 720h
```

**Promtail Configuration** (`docker/promtail/promtail-config.yml`):

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/**/*.log

  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/**/*.log
```

**Deploy Monitoring Stack**:

```bash
# Start monitoring services
docker compose -f docker-compose.monitoring.yml up -d

# Check status
docker compose -f docker-compose.monitoring.yml ps

# Access Grafana
http://your-server-ip:3000
```

---

## 6. CI/CD Integration Patterns

### GitHub Actions with Hetzner Cloud

#### Option 1: Deploy to Existing Server (Recommended)

**Workflow**: `.github/workflows/deploy-hetzner.yml`

```yaml
name: Deploy to Hetzner

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push Docker images
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./services/mana-core-auth/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Hetzner
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /app

            # Pull latest images
            docker compose -f docker-compose.production.yml pull

            # Rolling update (zero downtime)
            docker compose -f docker-compose.production.yml up -d --remove-orphans

            # Run migrations if needed
            docker compose -f docker-compose.production.yml exec -T mana-core-auth pnpm migration:run || true

            # Health check
            sleep 10
            curl -f http://localhost:3001/api/v1/health || exit 1

            echo "Deployment completed successfully"

      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to Hetzner failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

#### Option 2: Self-Hosted GitHub Runner on Hetzner

**Benefits**:
- 3-10x cheaper than GitHub-hosted runners
- Faster builds with persistent caching
- Full control over environment

**Setup**:

```bash
# On Hetzner server
cd /opt
mkdir actions-runner && cd actions-runner

# Download runner (check latest version)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

tar xzf actions-runner-linux-x64-2.311.0.tar.gz

# Configure (get token from GitHub repo settings)
./config.sh --url https://github.com/your-org/manacore-monorepo --token YOUR_TOKEN

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

**Use in Workflow**:

```yaml
jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d
```

⚠️ **Important**: Hetzner bills per hour, not per minute. A 30-second run costs the same as a 1-hour run.

### Docker Registry Options

#### Option 1: GitHub Container Registry (Recommended)

```yaml
- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and Push
  uses: docker/build-push-action@v5
  with:
    push: true
    tags: ghcr.io/${{ github.repository }}:latest
```

#### Option 2: Docker Hub

```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

#### Option 3: Self-Hosted Harbor Registry

```bash
# Deploy Harbor on Hetzner
docker compose -f harbor-docker-compose.yml up -d
```

### Deployment Strategies

#### Blue-Green Deployment

```yaml
- name: Blue-Green Deploy
  run: |
    ssh deploy@${{ secrets.HETZNER_HOST }} << 'EOF'
      cd /app

      # Start green environment
      docker compose -f docker-compose.green.yml up -d

      # Wait for health checks
      sleep 30

      # Switch traffic (update nginx/traefik config)
      sudo mv /etc/nginx/sites-enabled/blue.conf /etc/nginx/sites-enabled/blue.conf.bak
      sudo mv /etc/nginx/sites-enabled/green.conf.new /etc/nginx/sites-enabled/green.conf
      sudo nginx -s reload

      # Stop blue environment
      docker compose -f docker-compose.blue.yml down
    EOF
```

#### Rolling Update (Docker Swarm)

```yaml
- name: Deploy to Swarm
  run: |
    ssh deploy@${{ secrets.HETZNER_HOST }} << 'EOF'
      docker service update \
        --image ghcr.io/your-org/myapp:${{ github.sha }} \
        --update-parallelism 2 \
        --update-delay 10s \
        --update-failure-action rollback \
        myapp
    EOF
```

---

## 7. Cost Optimization Tips

### Server Right-Sizing

**Progressive Scaling Strategy**:

```
Development/Testing: CX11 (€3.92/month)
    ↓
Staging: CX23 (€3.49/month)
    ↓
Production (Small): CPX21 (€7/month)
    ↓
Production (Medium): CX33 (€28/month)
    ↓
Production (Large): CCX42 (€101/month)
```

**Cost Calculator**: https://costgoat.com/pricing/hetzner

### Resource Optimization Strategies

#### 1. Use ARM Servers (CAX Series)

**Cost Savings**: 40% lower operational costs vs x86

**Example**:
- **CX21** (x86): 2 vCPU, 4GB RAM - €6/month
- **CAX21** (ARM): 4 vCPU, 8GB RAM - ~€8/month
- **Better**: More CPUs, more RAM, same price range

**Requirements**:
- ARM64-compatible Docker images
- Test thoroughly before production migration

#### 2. Implement Auto-Scaling with Hetzner API

```bash
#!/bin/bash
# auto-scale.sh

LOAD=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | xargs)
THRESHOLD=4.0

if (( $(echo "$LOAD > $THRESHOLD" | bc -l) )); then
  # Scale up - create new server
  hcloud server create \
    --type cpx21 \
    --name web-$(date +%s) \
    --image docker-ce \
    --ssh-key default

  echo "Scaled up due to load: $LOAD"
else
  echo "Load normal: $LOAD"
fi
```

#### 3. Volume Management

```bash
#!/bin/bash
# cleanup-volumes.sh

# List detached volumes
hcloud volume list -o json | jq -r '.[] | select(.server == null) | .id'

# Delete old snapshots (>30 days)
hcloud snapshot list -o json | \
  jq -r '.[] | select(.created | fromdateiso8601 < now - 2592000) | .id' | \
  xargs -I {} hcloud snapshot delete {}
```

**Cost Impact**:
- Volumes: €0.05/GB/month (even when detached)
- Snapshots: €0.01/GB/month
- Storage Box: €0.04/GB/month (cheaper for cold storage)

#### 4. Network Traffic Optimization

**Included Traffic**: 20 TB/month (most plans)
**Additional Traffic**: €1.19/TB

**Optimization**:
- Use private networks for inter-server communication (free)
- Enable compression in Nginx/Traefik
- Serve static assets from CDN (Cloudflare free)

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml application/json application/javascript;
```

#### 5. Load Balancer Optimization

**Pricing**:
- Small LB (5K connections): €5.39/month
- Large LB (40K connections): €15.49/month

**When to Use**:
- Multi-server setups only
- For single server, use Nginx/Traefik directly (no LB cost)

#### 6. Monitoring Costs

**Self-Hosted** (Prometheus + Grafana):
- Cost: ~€0/month (runs on same server)
- Overhead: ~200MB RAM
- No external service fees

**External Monitoring** (Datadog, New Relic):
- Cost: $20-50+/month per host
- Only if specific features required

### Total Cost Examples

#### Single App Deployment (Minimal)

```
Server (CPX21):              €7.00/month
Volume (50GB):               €2.50/month
Snapshot (weekly, 10GB):     €0.50/month
Storage Box (100GB backup):  €3.81/month
─────────────────────────────────────────
Total:                      €13.81/month
```

#### High-Availability Setup (Production)

```
2x Servers (CPX21):         €14.00/month
Load Balancer (small):       €5.39/month
3x Volumes (50GB each):      €7.50/month
Storage Box (500GB backup): €10.11/month
Private Network:             €0.00/month (free)
Cloud Firewall:              €0.00/month (free)
─────────────────────────────────────────
Total:                      €37.00/month
```

#### Full Monorepo Deployment (All Services)

```
3x App Servers (CX33):      €84.00/month
1x DB Server (CX31):        €28.00/month
Load Balancer (medium):     €10.00/month
5x Volumes (100GB each):    €25.00/month
Storage Box (1TB backup):   €19.00/month
Private Network:             €0.00/month
Cloud Firewall:              €0.00/month
─────────────────────────────────────────
Total:                     €166.00/month

Equivalent on AWS: $400-600/month
Savings: 60-75%
```

### Cost Monitoring

**Track Usage with Hetzner API**:

```bash
#!/bin/bash
# cost-report.sh

# Get current month billing
YEAR_MONTH=$(date +%Y-%m)
hcloud billing get-month $YEAR_MONTH | jq

# Example output:
# {
#   "from": "2025-12-01",
#   "to": "2025-12-31",
#   "total_net": "45.67",
#   "total_gross": "54.35"
# }
```

**Set Billing Alerts** (via Hetzner Console):
- Alert at €50
- Alert at €100
- Alert at €150

### Cost Optimization Checklist

- [ ] Start with smaller server types
- [ ] Evaluate CAX ARM servers for 40% savings
- [ ] Use private networks for inter-server traffic (free)
- [ ] Delete unused volumes and snapshots regularly
- [ ] Use Storage Box for backups (cheaper than volumes)
- [ ] Implement auto-scaling for variable workloads
- [ ] Monitor resource usage and right-size servers
- [ ] Use Hetzner's included 20TB/month traffic
- [ ] Self-host monitoring (Prometheus/Grafana)
- [ ] Regular cost audits with billing API

---

## 8. Orchestration Choice: Docker Swarm vs Kubernetes

### When to Use Docker Swarm

**Best For**:
- Small to medium deployments (<50 nodes)
- Teams familiar with Docker Compose
- Quick setup requirements (<30 minutes to production)
- Simple applications without complex networking
- Projects prioritizing simplicity over features

**Advantages**:
- Native Docker integration (same CLI)
- Easy migration from docker-compose
- Lower learning curve
- Faster deployment times
- Lower resource overhead (~100MB vs ~1GB for K8s)

**Hetzner Setup**:

```bash
# Initialize swarm on manager node
docker swarm init --advertise-addr 10.0.1.2

# Join worker nodes
docker swarm join --token <TOKEN> 10.0.1.2:2377

# Deploy stack
docker stack deploy -c docker-compose.yml manacore

# Scale service
docker service scale manacore_chat-backend=3

# Rolling update
docker service update \
  --image ghcr.io/org/chat-backend:v2 \
  manacore_chat-backend
```

### When to Use Kubernetes (k3s)

**Best For**:
- Medium to large deployments (>20 nodes)
- Complex microservices architectures
- Need for advanced networking (service mesh)
- Teams requiring extensive ecosystem tools
- Enterprise compliance requirements

**Advantages on Hetzner**:
- k3s optimized for Hetzner's cost structure
- 40% lower costs vs MicroK8s
- Production-grade availability
- Extensive ecosystem (Helm, operators, etc.)
- Better for multi-tenant applications

**k3s Recommended** over full Kubernetes:
- 50% less memory usage
- Single binary installation
- Hetzner-specific tooling available

### Quick Comparison

| Factor | Docker Swarm | k3s on Hetzner |
|--------|--------------|----------------|
| **Setup Time** | 15 minutes | 30-60 minutes |
| **Learning Curve** | Low | Medium |
| **Resource Overhead** | Minimal (~100MB) | Low (~500MB) |
| **Ecosystem** | Limited | Extensive |
| **Cost (3 nodes)** | ~€21/month | ~€21/month |
| **Operational Complexity** | Lower | Higher |
| **Max Scale** | ~50 nodes | 1000+ nodes |
| **Auto-Scaling** | Manual | HPA (Horizontal Pod Autoscaler) |
| **Service Mesh** | No | Yes (Linkerd, Istio) |

### Recommendation for Manacore Monorepo

**Start with Docker Swarm**, then migrate to k3s if needed:

**Rationale**:
1. **Faster Time to Market**: 15-minute setup vs 1+ week for K8s
2. **Lower Complexity**: Existing Docker Compose knowledge sufficient
3. **Cost Effective**: Same infrastructure cost, lower ops overhead
4. **Sufficient for 90% of Use Cases**: <50 services, <100K requests/day

**Migration Path**:

```
Docker Compose (Development)
    ↓
Docker Swarm (Production)
    ↓
k3s/Kubernetes (if scaling beyond 50 nodes)
```

---

## 9. Production-Ready Deployment Scripts

### Complete Server Setup Script

```bash
#!/bin/bash
# hetzner-production-setup.sh
# Complete Hetzner production setup automation

set -e

echo "=== Hetzner Docker Production Setup ==="

# Configuration
DEPLOY_USER="deploy"
DOCKER_VERSION="24.0"
SERVER_IP=$(curl -s ifconfig.me)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 1. System Update
log_info "Updating system packages..."
apt update && apt upgrade -y || log_error "System update failed"

# 2. Install Docker (if not pre-installed)
if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    log_info "Docker already installed: $(docker --version)"
fi

# 3. Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_info "Installing Docker Compose..."
    apt install -y docker-compose-plugin
fi

# 4. Create deploy user
if ! id "$DEPLOY_USER" &> /dev/null; then
    log_info "Creating deploy user..."
    adduser --disabled-password --gecos "" $DEPLOY_USER
    usermod -aG sudo,docker $DEPLOY_USER

    # Setup SSH keys
    mkdir -p /home/$DEPLOY_USER/.ssh
    if [ -f /root/.ssh/authorized_keys ]; then
        cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/
        chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
        chmod 700 /home/$DEPLOY_USER/.ssh
        chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
        log_info "SSH keys copied for $DEPLOY_USER"
    fi
else
    log_info "User $DEPLOY_USER already exists"
fi

# 5. Configure Docker daemon
log_info "Configuring Docker daemon..."
cat > /etc/docker/daemon.json <<EOF
{
  "mtu": 1450,
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "icc": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5",
    "labels": "environment,service"
  },
  "metrics-addr": "127.0.0.1:9323",
  "experimental": true,
  "default-address-pools": [
    {"base": "172.17.0.0/12", "size": 24}
  ]
}
EOF

systemctl restart docker
log_info "Docker daemon configured and restarted"

# 6. Setup firewall (UFW)
log_info "Configuring firewall..."
apt install -y ufw fail2ban

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Docker Swarm ports (optional)
# ufw allow 2377/tcp comment 'Docker Swarm'
# ufw allow 7946/tcp comment 'Docker Swarm'
# ufw allow 7946/udp comment 'Docker Swarm'
# ufw allow 4789/udp comment 'Docker Swarm Overlay'

ufw --force enable
log_info "Firewall configured and enabled"

# 7. Configure fail2ban
log_info "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

systemctl enable fail2ban
systemctl restart fail2ban
log_info "fail2ban configured and started"

# 8. Harden SSH
log_info "Hardening SSH configuration..."
sed -i 's/#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config

systemctl restart sshd
log_info "SSH hardened and restarted"

# 9. Setup monitoring directory
log_info "Creating monitoring stack..."
mkdir -p /opt/monitoring
mkdir -p /opt/monitoring/prometheus
mkdir -p /opt/monitoring/grafana/provisioning/{dashboards,datasources}
mkdir -p /opt/monitoring/loki
mkdir -p /opt/monitoring/promtail

# Create basic Prometheus config
cat > /opt/monitoring/prometheus/prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'docker'
    static_configs:
      - targets: ['172.17.0.1:9323']
EOF

# Create Grafana datasource
cat > /opt/monitoring/grafana/provisioning/datasources/prometheus.yml <<EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

log_info "Monitoring stack configuration created"

# 10. Install backup tools
log_info "Installing backup tools..."
apt install -y borgbackup

# 11. Setup automatic security updates
log_info "Configuring automatic security updates..."
apt install -y unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades

# 12. Create application directory
mkdir -p /app /backup /logs
chown -R $DEPLOY_USER:$DEPLOY_USER /app /backup /logs

# 13. Setup logrotate for Docker logs
cat > /etc/logrotate.d/docker-containers <<EOF
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  size=10M
  missingok
  delaycompress
  copytruncate
}
EOF

log_info "Log rotation configured"

# Summary
echo ""
echo "============================================"
log_info "Setup completed successfully!"
echo "============================================"
echo ""
echo "Server IP: $SERVER_IP"
echo "Deploy User: $DEPLOY_USER"
echo "Application Directory: /app"
echo "Backup Directory: /backup"
echo "Logs Directory: /logs"
echo ""
echo "Next steps:"
echo "1. Test SSH access: ssh $DEPLOY_USER@$SERVER_IP"
echo "2. Configure Hetzner Cloud Firewall"
echo "3. Setup backup credentials (Borg)"
echo "4. Deploy your application"
echo "5. Configure monitoring stack"
echo ""
log_warn "IMPORTANT: Update the following:"
echo "  - Change Grafana admin password"
echo "  - Configure backup encryption passphrase"
echo "  - Setup alert notifications (email/Slack)"
echo "  - Configure DNS records for your domain"
echo ""
```

### Application Deployment Script

```bash
#!/bin/bash
# deploy-app.sh
# Deploy Manacore application to Hetzner

set -e

APP_DIR="/app"
REGISTRY="ghcr.io/your-org"
TAG="${1:-latest}"
COMPOSE_FILE="docker-compose.production.yml"

log_info() { echo "[INFO] $1"; }
log_error() { echo "[ERROR] $1"; exit 1; }

log_info "Deploying Manacore with tag: $TAG"

# Navigate to app directory
cd $APP_DIR || log_error "App directory not found"

# Pull latest code (if using git deployment)
# git pull origin main

# Pull latest Docker images
log_info "Pulling Docker images..."
export TAG=$TAG
docker compose -f $COMPOSE_FILE pull || log_error "Failed to pull images"

# Run database migrations (if needed)
log_info "Running database migrations..."
docker compose -f $COMPOSE_FILE exec -T mana-core-auth pnpm migration:run || true

# Deploy with zero downtime (rolling update)
log_info "Deploying services..."
docker compose -f $COMPOSE_FILE up -d --remove-orphans --no-recreate || log_error "Deployment failed"

# Wait for health checks
log_info "Waiting for services to be healthy..."
sleep 30

# Health check
log_info "Running health checks..."
SERVICES=("mana-core-auth:3001" "chat-backend:3002" "picture-backend:3006")

for service in "${SERVICES[@]}"; do
    SERVICE_NAME=$(echo $service | cut -d: -f1)
    PORT=$(echo $service | cut -d: -f2)

    if curl -f -s http://localhost:$PORT/health > /dev/null; then
        log_info "✓ $SERVICE_NAME is healthy"
    else
        log_error "✗ $SERVICE_NAME health check failed"
    fi
done

# Clean up old images
log_info "Cleaning up old Docker images..."
docker image prune -f

log_info "Deployment completed successfully!"
```

---

## 10. Production-Ready Checklist

### Infrastructure

- [ ] **Server Provisioned**: Appropriate Hetzner server type selected
- [ ] **Private Network Configured**: 10.0.0.0/16 network created
- [ ] **Floating IP Setup** (if HA required)
- [ ] **Load Balancer Configured** (if multi-server)
- [ ] **Volumes Mounted**: Block storage attached and formatted
- [ ] **Hetzner Cloud Firewall**: Rules configured with IP restrictions
- [ ] **DNS Records**: A/AAAA records pointing to server IP

### Storage & Backup

- [ ] **Volumes Mounted**: Attached to `/mnt/volumes/*`
- [ ] **Storage Box Configured**: Access credentials set
- [ ] **Borg Backup Setup**: Repository initialized
- [ ] **Automated Backups**: Cron job scheduled (daily at 2 AM)
- [ ] **Database Backups**: PostgreSQL/Redis backup scripts created
- [ ] **Backup Testing**: Restore procedure tested and documented
- [ ] **Retention Policy**: Old backups pruned (7 days, 4 weeks, 6 months)

### Security

- [ ] **SSH Key-Only Authentication**: Password auth disabled
- [ ] **Root Login Disabled**: PermitRootLogin no
- [ ] **UFW Configured**: Host-level firewall enabled
- [ ] **fail2ban Installed**: Brute force protection active
- [ ] **Automatic Security Updates**: unattended-upgrades enabled
- [ ] **Docker Secrets**: Production secrets stored securely
- [ ] **Containers Run as Non-Root**: All services use unprivileged users
- [ ] **SSL/TLS Configured**: Let's Encrypt certificates active
- [ ] **Security Scanning**: Trivy/Hadolint integrated in CI/CD

### Monitoring

- [ ] **Prometheus Deployed**: Metrics collection running
- [ ] **Grafana Deployed**: Dashboards configured
- [ ] **cAdvisor Running**: Container metrics available
- [ ] **Node Exporter Running**: Host metrics collected
- [ ] **Loki + Promtail**: Centralized logging active
- [ ] **Hetzner Cloud Exporter** (optional): Cloud resource monitoring
- [ ] **Alert Rules Configured**: Critical alerts defined
- [ ] **Alert Notifications**: Email/Slack notifications working
- [ ] **Health Checks**: All services have health endpoints

### Deployment

- [ ] **Docker Compose Files**: Production files tested
- [ ] **Environment Variables**: Secrets properly configured
- [ ] **CI/CD Pipeline**: GitHub Actions workflow working
- [ ] **Docker Registry**: Images pushed to registry
- [ ] **Deployment Strategy**: Blue-green or rolling updates defined
- [ ] **Rollback Procedure**: Tested and documented
- [ ] **Health Checks**: Pre-deployment and post-deployment checks

### Documentation

- [ ] **Deployment Runbook**: Step-by-step deployment guide
- [ ] **Rollback Procedure**: Emergency rollback documented
- [ ] **Disaster Recovery Plan**: Complete recovery steps
- [ ] **On-Call Procedures**: Incident response playbook
- [ ] **Architecture Diagram**: Current infrastructure documented
- [ ] **Access Documentation**: Server access, credentials locations
- [ ] **Monitoring Dashboard**: Team has access to Grafana

### Cost Management

- [ ] **Right-Sized Servers**: Appropriate server types selected
- [ ] **ARM Servers Evaluated**: CAX series considered for savings
- [ ] **Private Networks Used**: Inter-server traffic optimized
- [ ] **Unused Resources Cleaned**: Old volumes/snapshots removed
- [ ] **Billing Alerts Configured**: Threshold alerts set
- [ ] **Cost Monitoring**: Monthly cost reports automated

### Performance

- [ ] **Resource Limits Set**: CPU/memory limits defined
- [ ] **Database Optimization**: PostgreSQL tuned for workload
- [ ] **Redis Caching**: Cache hit ratio monitored
- [ ] **CDN Configured**: Static assets served via CDN
- [ ] **Compression Enabled**: Gzip/Brotli compression active
- [ ] **Load Testing**: Application stress-tested

---

## Conclusion

This guide provides a comprehensive production deployment strategy for the Manacore monorepo on Hetzner Cloud infrastructure. Following these practices will result in:

- **Cost-Effective**: 60-75% cost savings vs AWS/GCP
- **Secure**: Defense-in-depth security strategy
- **Reliable**: High availability with failover capabilities
- **Observable**: Complete monitoring and logging stack
- **Maintainable**: Automated deployments and backups

**Estimated Time to Production**:
- Initial setup: 4-6 hours
- Application deployment: 2-3 hours
- Testing and hardening: 4-6 hours
- **Total**: ~10-15 hours for complete production deployment

**Monthly Operational Cost**:
- Single server: €14-28/month
- HA setup: €37-50/month
- Full monorepo: €166/month

---

**Related Documentation**:
- `DOCKER_SETUP_ANALYSIS.md` - Current Docker setup analysis
- `DOCKER_COMPOSE_PRODUCTION_ARCHITECTURE.md` - Architecture design
- `DEPLOYMENT_HETZNER.md` - Deployment options comparison
- `CI_CD_SETUP.md` - CI/CD pipeline details
