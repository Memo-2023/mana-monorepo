# PocketBase Admin Zugang

## 🚀 Schnellstart (3 Schritte)

### 1. Admin-Account erstellen

In Coolify Dashboard → uLoad App → **Terminal**:

```bash
./pocketbase superuser create
```

Email und Passwort eingeben (merken!).

### 2. SSH-Tunnel öffnen

Von deinem Computer:

```bash
ssh -L 8090:localhost:8090 root@91.99.221.179
```

### 3. Admin Panel öffnen

Browser: http://localhost:8090/\_/

Mit Email/Passwort aus Schritt 1 einloggen.

---

## 📝 Was tun im Admin Panel?

- **Collections** → Datenbank-Struktur einsehen
- **Users** → Benutzer verwalten, Username setzen
- **Links** → Alle Links einsehen
- **Settings** → Backup, Export, Konfiguration

## 🔒 Sicherheit

- Admin Panel ist **nur lokal** erreichbar (über SSH-Tunnel)
- Kein öffentlicher Zugang = maximale Sicherheit
- Nach Arbeit: Terminal schließen = Zugang geschlossen

## ❓ Troubleshooting

**SSH verweigert?**

```bash
ssh root@91.99.221.179
# Prüfen ob Server erreichbar
```

**Port 8090 belegt?**

```bash
ssh -L 8091:localhost:8090 root@91.99.221.179
# Dann: http://localhost:8091/_/
```

**Passwort vergessen?**
Schritt 1 wiederholen (neuer Admin wird erstellt).

---

✅ Das war's! Sicher, einfach, funktioniert.
