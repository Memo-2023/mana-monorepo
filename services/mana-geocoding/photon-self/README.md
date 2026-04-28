# photon-self — operator files for the GPU-server Photon

Source-of-truth copies of the scripts and systemd units that run on
`mana-gpu` to host the self-hosted Photon. Versioned here so the setup
can be rebuilt in DR scenarios without recreating from memory.

## What lives where

| File | Where it runs | Purpose |
|---|---|---|
| `photon-update.sh` | inside the WSL2 Ubuntu distro on mana-gpu, at `/usr/local/bin/photon-update.sh` | Weekly index refresh — download new tarball, atomic swap, restart container, rollback on failure |
| `photon-update.service` | `/etc/systemd/system/photon-update.service` | Oneshot wrapper that invokes the script |
| `photon-update.timer` | `/etc/systemd/system/photon-update.timer` | Sunday 03:30 + 30-min jitter, persistent across reboots |

## Re-installation (after a clean Windows reinstall etc.)

After you've followed [docs/runbooks/photon-on-mana-gpu.md](../../../docs/runbooks/photon-on-mana-gpu.md)
to get WSL2 + Docker + the initial Photon container running:

```bash
# Run inside WSL2 Ubuntu as root:
cp /mnt/c/path/to/repo/services/mana-geocoding/photon-self/photon-update.sh \
   /usr/local/bin/photon-update.sh
chmod +x /usr/local/bin/photon-update.sh

cp /mnt/c/path/to/repo/services/mana-geocoding/photon-self/photon-update.service \
   /etc/systemd/system/
cp /mnt/c/path/to/repo/services/mana-geocoding/photon-self/photon-update.timer \
   /etc/systemd/system/

systemctl daemon-reload
systemctl enable --now photon-update.timer
systemctl list-timers photon-update.timer  # verify next run
```

## Manual trigger

To force a refresh outside the schedule:

```bash
# Inside WSL2 Ubuntu as root
systemctl start photon-update.service
journalctl -u photon-update.service -f   # watch progress
tail -f /var/log/photon-update.log       # script-level detail
```

## What the update script does

```
1. curl new tarball → /opt/photon-data/photon-db.tar.bz2.new
2. Verify size ≥ 25 GB (sanity guard against truncated downloads)
3. tar -xjf into /opt/photon-data/photon_data.new
4. docker stop photon
5. mv old → .old, mv new → live (atomic-ish — both renames in same FS)
6. docker start photon
7. Poll /api?q=Konstanz for up to 180 s
   - On success: rm -rf .old (cleanup)
   - On failure: rollback (mv live → .bad, mv .old → live, restart)
```

The rollback path is the load-bearing part — a corrupted GraphHopper
dump or a Photon version-mismatch can otherwise leave the service in a
non-serving state until the operator notices.

## Why systemd timer instead of cron

WSL2 Ubuntu has systemd enabled by default since the 0.67.6 release.
Timers give us:

- `Persistent=true` — runs missed jobs at next boot if the GPU server
  was off Sunday morning. Cron just skips them.
- `RandomizedDelaySec=30min` — spreads 100s of weekly jobs across the
  GraphHopper CDN window, polite-neighbour style.
- `journalctl -u photon-update` — structured logs in one place.
- Status-checkable with `systemctl list-timers`.

The downside (more files on disk than a single crontab entry) is
negligible.
