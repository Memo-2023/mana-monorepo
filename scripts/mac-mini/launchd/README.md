# LaunchD Services for Mac Mini

These plist files configure automatic services on the Mac Mini server.

## Installation

```bash
# Copy all plists to LaunchAgents
cp *.plist ~/Library/LaunchAgents/

# Load all services
for f in *.plist; do launchctl load ~/Library/LaunchAgents/$f; done
```

## Services

| Service | Description | Interval |
|---------|-------------|----------|
| `docker-startup` | Starts Docker containers on boot | At login |
| `ensure-containers` | Detects and restarts stuck/crash-looping containers | Every 5 min |
| `health-check` | Checks all services and sends alerts | Every 5 min |
| `backup-databases` | PostgreSQL backup with daily/weekly rotation | Daily 3 AM |
| `disk-check` | Monitors disk space, alerts on thresholds | Hourly |
| `weekly-report` | Generates system health summary | Sunday 10 AM |
| `ssd-check` | Monitors SSD health | Periodic |
| `mana-stt` | Speech-to-text service (Whisper) | At login |
| `mana-tts` | Text-to-speech service (Kokoro) | At login |
| `image-gen` | Image generation service | At login |
| `telegram-ollama-bot` | Telegram bot with Ollama | At login |

## Management Commands

```bash
# Check status
launchctl list | grep mana

# View logs
tail -f /tmp/mana-*.log

# Reload a service
launchctl unload ~/Library/LaunchAgents/com.mana.health-check.plist
launchctl load ~/Library/LaunchAgents/com.mana.health-check.plist

# Stop a service
launchctl unload ~/Library/LaunchAgents/com.mana.<service>.plist
```

## Troubleshooting

Exit codes in `launchctl list`:
- `0` = Running successfully
- `1` = Last run had errors (check logs)
- `-` = Not running / waiting for next interval
- `78` = Configuration error

Check error logs:
```bash
cat /tmp/mana-<service>.error.log
```
