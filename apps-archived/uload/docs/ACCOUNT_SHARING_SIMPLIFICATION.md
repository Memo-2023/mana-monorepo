# Account Sharing System - Vereinfachungsvorschlag

## 1. Aktuelle Situation - Probleme

Das aktuelle System ist überkomplex:
- Separate `business` und `personal` Account-Typen
- Komplexe `account_connections` Tabelle mit Rollen und Permissions
- Separate `business_subscriptions` Tabelle
- Duplizierung von Funktionalität zwischen persönlichen und Business-Accounts
- Verwirrende UI mit Business Account Erstellung

## 2. Vorgeschlagene Vereinfachung

### Kernkonzept
**Jeder Account bleibt ein normaler User-Account, kann aber anderen Usern Zugriff gewähren.**

### Hauptmerkmale
1. **Keine Unterscheidung zwischen Personal/Business**
   - Alle Accounts sind gleich
   - Jeder kann Premium-Features kaufen
   - Jeder kann Team-Mitglieder einladen

2. **Einfaches Sharing-Modell**
   - User A lädt User B ein
   - User B kann zwischen eigenen und geteilten Accounts wechseln
   - User B kann nur eigene Links erstellen, bearbeiten/löschen
   - User B sieht alle Statistiken des geteilten Accounts

3. **Vereinfachte Datenstruktur**
   ```
   users (bleibt gleich)
   ├── id
   ├── email
   ├── username
   └── subscription_status (free, pro, team)
   
   account_access (NEU - ersetzt account_connections)
   ├── id
   ├── owner_id (user who grants access)
   ├── user_id (user who gets access)
   ├── permissions (view_stats, create_links, edit_own, delete_own)
   └── created
   
   links (erweitert)
   ├── ...existing fields...
   ├── account_id (whose account this belongs to)
   └── created_by (who created this link)
   ```

## 3. Migrations-Plan

### Phase 1: Datenbank-Schema
```sql
-- 1. Neue account_access Tabelle erstellen
CREATE TABLE account_access (
    id TEXT PRIMARY KEY,
    owner_id TEXT REFERENCES users(id),
    user_id TEXT REFERENCES users(id),
    permissions JSON DEFAULT '{"view_stats": true, "create_links": true, "edit_own": true, "delete_own": true}',
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Links Tabelle erweitern
ALTER TABLE links ADD COLUMN account_id TEXT REFERENCES users(id);
ALTER TABLE links ADD COLUMN created_by TEXT REFERENCES users(id);

-- 3. Bestehende Daten migrieren
UPDATE links SET 
    account_id = user_id,
    created_by = user_id 
WHERE account_id IS NULL;
```

### Phase 2: Backend-Änderungen

#### A. Entfernen
- `/routes/(app)/business/create/` - Komplette Business-Erstellung
- `business_subscriptions` Collection
- `account_type` Feld aus users
- `parent_account` Feld aus users
- `business_info` Feld aus users

#### B. Vereinfachen
- `account_connections` → `account_access` (simpler)
- Komplexe Rollen-Logik entfernen
- Business-spezifische API-Endpunkte entfernen

#### C. Neue Features
```typescript
// /src/lib/types/sharing.ts
export interface AccountAccess {
    id: string;
    owner_id: string;
    user_id: string;
    permissions: {
        view_stats: boolean;
        create_links: boolean;
        edit_own: boolean;
        delete_own: boolean;
    };
}

// API: Invite team member
POST /api/team/invite
{
    email: "colleague@example.com",
    permissions: {...}
}

// API: Switch account context
POST /api/account/switch
{
    account_id: "owner_user_id"
}
```

### Phase 3: UI-Änderungen

#### A. Vereinfachter Account-Switcher
```svelte
<!-- Nur noch eine Liste von Accounts -->
<AccountSwitcher>
    <MyAccount /> <!-- Eigener Account -->
    <SharedAccount owner="max@example.com" /> <!-- Geteilter Account 1 -->
    <SharedAccount owner="lisa@example.com" /> <!-- Geteilter Account 2 -->
</AccountSwitcher>
```

#### B. Team-Verwaltung
```svelte
<!-- Neue einfache Team-Seite unter /settings/team -->
<TeamSettings>
    <InviteMember /> <!-- Email eingeben, Einladung senden -->
    <MemberList>    <!-- Liste der Team-Mitglieder mit Permissions -->
        <Member email="colleague@example.com" permissions={...} />
    </MemberList>
</TeamSettings>
```

#### C. Link-Verwaltung
- Links zeigen Creator-Badge: "Created by @username"
- Edit/Delete nur bei eigenen Links
- Klare visuelle Unterscheidung zwischen eigenen und Team-Links

## 4. Vorteile der Vereinfachung

### Für Nutzer
- **Einfacher zu verstehen**: "Ich kann andere zu meinem Account einladen"
- **Flexibler**: Jeder kann ein Team haben, nicht nur "Business Accounts"
- **Günstiger**: Keine separaten Business-Pläne nötig
- **Schneller**: Kein komplizierter Setup-Prozess

### Für Entwicklung
- **Weniger Code**: ~40% weniger Komplexität
- **Einfachere Wartung**: Ein Account-Typ statt zwei
- **Bessere Performance**: Weniger Joins und Lookups
- **Klarere Logik**: Permissions sind explizit und einfach

## 5. Pricing-Modell Vorschlag

```typescript
const PLANS = {
    free: {
        price: 0,
        team_members: 0,  // Keine Team-Mitglieder
        links_per_month: 50
    },
    pro: {
        price: 4.99,
        team_members: 0,  // Keine Team-Mitglieder
        links_per_month: 500
    },
    team: {
        price: 9.99,
        team_members: 5,  // Bis zu 5 Team-Mitglieder
        links_per_month: 'unlimited'
    },
    team_plus: {
        price: 19.99,
        team_members: 20, // Bis zu 20 Team-Mitglieder
        links_per_month: 'unlimited'
    }
};
```

## 6. Migration für bestehende Business Accounts

```typescript
// Automatische Migration
async function migrateBusinesAccounts() {
    // 1. Finde alle Business Accounts
    const businessAccounts = await pb.collection('users')
        .getFullList({ filter: 'account_type = "business"' });
    
    // 2. Für jeden Business Account
    for (const business of businessAccounts) {
        // Finde alle Verbindungen
        const connections = await pb.collection('account_connections')
            .getFullList({ filter: `business_account = "${business.id}"` });
        
        // Konvertiere zu neuem System
        for (const conn of connections) {
            if (conn.role === 'owner') {
                // Owner wird zum Haupt-Account
                await pb.collection('users').update(business.id, {
                    email: business.email,
                    subscription_status: 'team'
                });
            } else {
                // Andere bekommen Zugriff
                await pb.collection('account_access').create({
                    owner_id: conn.personal_account,
                    user_id: business.parent_account,
                    permissions: mapRoleToPermissions(conn.role)
                });
            }
        }
    }
}
```

## 7. Implementierungs-Roadmap

### Woche 1: Vorbereitung
- [ ] Backup aller Daten
- [ ] Neue Datenbank-Schema erstellen
- [ ] Migration Scripts schreiben und testen

### Woche 2: Backend
- [ ] Account Access API implementieren
- [ ] Permission-System vereinfachen
- [ ] Team-Einladungen implementieren

### Woche 3: Frontend
- [ ] Account Switcher vereinfachen
- [ ] Team-Settings Page erstellen
- [ ] Link-Ownership UI anpassen

### Woche 4: Migration & Testing
- [ ] Bestehende Accounts migrieren
- [ ] Umfangreiche Tests
- [ ] Rollback-Plan vorbereiten

## 8. Risiken und Mitigationen

| Risiko | Mitigation |
|--------|------------|
| Datenverlust bei Migration | Vollständiges Backup, stufenweise Migration |
| User-Verwirrung | Klare Kommunikation, Migrations-Guide |
| Feature-Verlust | Alle wichtigen Features bleiben erhalten |
| Performance-Probleme | Neue Indizes, optimierte Queries |

## 9. Zusammenfassung

Die Vereinfachung würde das System **dramatisch vereinfachen** bei gleichzeitiger **Erhaltung aller wichtigen Features**:

- ✅ Team-Kollaboration bleibt möglich
- ✅ Statistiken werden geteilt
- ✅ Permissions bleiben granular
- ✅ Einfachere Preisstruktur
- ✅ Bessere User Experience
- ✅ Weniger Wartungsaufwand

**Empfehlung**: Diese Vereinfachung durchführen, bevor das System weiter wächst. Je früher, desto einfacher die Migration.