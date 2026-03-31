# Subscription Page - Ausführliche Dokumentation

## Übersicht

Die Subscription Page ist ein vollständiges Abo-/Kaufsystem mit RevenueCat Integration für In-App-Käufe. Diese Dokumentation beschreibt alle Komponenten, Dateien und Abhängigkeiten, die benötigt werden, um die Subscription Page in einer anderen App zu implementieren.

## 1. Hauptkomponenten

### 1.1 Screen-Komponente
**Datei:** `app/(protected)/subscription.tsx`

Dies ist die Haupt-Route-Komponente. Sie:
- Prüft, ob der Benutzer ein B2B-Benutzer ist (RevenueCat deaktiviert)
- Zeigt entweder die B2B-Nachricht oder die normale Subscription Page
- Konfiguriert den Header mit SubscriptionMenu
- Verwaltet Screen-Tracking und Onboarding-Toasts

**Abhängigkeiten:**
- `SubscriptionPage` (Hauptseite)
- `SubscriptionPageSkeleton` (Ladeseite)
- `SubscriptionMenu` (Menü mit Restore Purchases)
- `B2BSubscriptionMessage` (Nachricht für B2B-Benutzer)
- `authService.shouldDisableRevenueCat()` (B2B-Prüfung)

### 1.2 Haupt-Subscription-Page
**Datei:** `features/subscription/SubscriptionPage.tsx`

Die zentrale Komponente mit folgenden Funktionen:
- Zeigt Abonnements (monatlich/jährlich) und Einmal-Pakete
- Filtert nach Individual/Team/Enterprise
- Verwaltet Billing-Zyklus (monatlich/jährlich) mit Toggle
- Zeigt Usage und Kosten-Übersicht
- Integriert RevenueCat für echte Käufe
- Legacy-Subscription-Support

**Wichtige Features:**
- Sticky BillingToggle beim Scrollen
- Expandierbare Abschnitte für größere Pläne
- RevenueCat Integration mit Fallback zu JSON-Daten
- B2B-User-Detection
- Analytics-Tracking

## 2. UI-Komponenten

### 2.1 SubscriptionCard
**Datei:** `features/subscription/SubscriptionCard.tsx`

Zeigt einen einzelnen Abo-Plan mit:
- Plan-Name und Preisgestaltung
- Monatliche Mana-Menge
- Visuelles Mana-Icon mit tier-spezifischer Farbe und Größe
- Current Plan Badge
- Legacy Plan Badge
- Buy Button

**Design-System:**
- Tier-spezifische Farben (Free: Grau, Small-Giant: Blauabstufungen)
- 3-Spalten-Layout: Icon, Mana-Menge, Preis
- Responsive Design

### 2.2 PackageCard
**Datei:** `features/subscription/PackageCard.tsx`

Zeigt Einmal-Käufe (Mana Potions) mit:
- Package-Name
- Mana-Menge
- Preis
- Visuelles Mana-Icon mit package-spezifischer Farbe
- Buy Button

**Ähnliches Design wie SubscriptionCard** mit angepassten Farben für Pakete.

### 2.3 SubscriptionButton
**Datei:** `features/subscription/SubscriptionButton.tsx`

Wiederverwendbarer Button für Käufe mit:
- 3 Varianten: primary, secondary, accent
- Links- und Rechts-Icons
- Hover-States (Web)
- Disabled-State
- Theme-aware Farben

### 2.4 BillingToggle
**Datei:** `features/subscription/BillingToggle.tsx`

Toggle zwischen monatlich/jährlich mit:
- Discount-Badge für Jahres-Abo
- Theme-aware Design
- Accent-Farbe für Auswahl

### 2.5 CostCard
**Datei:** `features/subscription/CostCard.tsx`

Zeigt Mana-Kosten für verschiedene Aktionen:
- Liste von Aktionen mit Icons
- Mana-Kosten pro Aktion
- i18n-Support für Übersetzungen

### 2.6 UsageCard
**Datei:** `features/subscription/UsageCard.tsx`

Zeigt Nutzungsstatistiken (muss noch gelesen werden für vollständige Details)

### 2.7 SubscriptionMenu
**Datei:** `features/subscription/SubscriptionMenu.tsx`

Dropdown-Menü mit:
- Restore Purchases
- Contact Support
- Platform-spezifische Implementierungen (Native: @react-native-menu/menu, Web: Modal)

### 2.8 B2BSubscriptionMessage
**Datei:** `features/subscription/B2BSubscriptionMessage.tsx`

Zeigt Nachricht für B2B-Benutzer mit:
- Organisation-Info
- Plan-Info
- Rolle
- Kontakt-Administrator-Hinweis

### 2.9 SubscriptionPageSkeleton
**Datei:** `features/subscription/SubscriptionPageSkeleton.tsx`

Loading-State mit Skeleton-Komponenten

### 2.10 ManaIcon
**Datei:** `features/subscription/ManaIcon.tsx` (muss erstellt werden oder vorhanden sein)

Icon-Komponente für Mana-Visualisierung

## 3. Services & Daten

### 3.1 subscriptionService.ts
**Datei:** `features/subscription/subscriptionService.ts`

Zentraler Service für RevenueCat Integration:

**Funktionen:**
- `initializeRevenueCat()` - SDK initialisieren
- `identifyUser(userId)` - User identifizieren
- `resetUser()` - User auf anonym setzen
- `getOfferings()` - Verfügbare Angebote holen
- `getSubscriptionData()` - Alle Subscription-Daten (mit Fallback zu JSON)
- `getCustomerInfo()` - Kunden-Info
- `hasActiveSubscription()` - Prüft aktives Abo
- `purchaseSubscription(id, cycle)` - Abo kaufen
- `purchaseManaPackage(id)` - Paket kaufen
- `restorePurchases()` - Käufe wiederherstellen

**Plattform-Support:**
- iOS: Native RevenueCat SDK
- Android: Native RevenueCat SDK
- Web: RevenueCat Web SDK (`revenueCatWebService`)

### 3.2 revenueCatManager.ts
**Datei:** `features/subscription/revenueCatManager.ts`

Manager für bedingte RevenueCat-Initialisierung:
- Prüft B2B-Status
- Deaktiviert RevenueCat für B2B-Benutzer
- Singleton-Pattern
- Fallback für B2B-Benutzer

### 3.3 revenueCatWebService.ts
**Datei:** `features/subscription/services/revenueCatWebService.ts`

Web-spezifischer Service für RevenueCat Web SDK (muss gelesen werden)

### 3.4 subscriptionData.json
**Datei:** `features/subscription/subscriptionData.json`

Fallback-Daten und Master-Daten-Quelle mit:

**Subscriptions:**
- `free` - Free Tier (150 Mana/Monat)
- `Mana_Stream_Small_v1` - Klein monatlich (600 Mana, 5.99€)
- `Mana_Stream_Small_Yearly_v1` - Klein jährlich (600 Mana, 47.99€)
- `Mana_Stream_Medium_v1` - Mittel monatlich (1500 Mana, 14.99€)
- `Mana_Stream_Medium_Yearly_v1` - Mittel jährlich (1500 Mana, 119.99€)
- `Mana_Stream_Large_v1` - Groß monatlich (3000 Mana, 29.99€)
- `Mana_Stream_Large_Yearly_v1` - Groß jährlich (3000 Mana, 239.99€)
- `Mana_Stream_Giant_v1` - Riesig monatlich (5000 Mana, 49.99€)
- `Mana_Stream_Giant_Yearly_v1` - Riesig jährlich (5000 Mana, 399.99€)

**Legacy Subscriptions:**
- Alte Plan-IDs für bestehende Kunden (Mini, Plus, Pro, Ultra)
- iOS und Android Legacy-IDs

**Packages (Einmal-Käufe):**
- `Mana_Potion_Small_v1` - 350 Mana, 4.99€
- `Mana_Potion_Medium_v1` - 700 Mana, 9.99€
- `Mana_Potion_Large_v1` - 1400 Mana, 19.99€
- `Mana_Potion_Giant_v2` - 2800 Mana, 39.99€

### 3.5 appCosts.json
**Datei:** `features/subscription/appCosts.json`

Mana-Kosten für verschiedene App-Aktionen (muss gelesen werden)

### 3.6 usageData.json
**Datei:** `features/subscription/usageData.json`

Nutzungsdaten für UsageCard (muss gelesen werden)

### 3.7 productIds.ts
**Datei:** `features/subscription/productIds.ts`

Mapping zwischen App-IDs und Store-Produkt-IDs (muss gelesen werden)

### 3.8 subscriptionTypes.ts
**Datei:** `features/subscription/subscriptionTypes.ts`

TypeScript-Typen für Subscription-System (muss gelesen werden)

### 3.9 useSubscriptionData.ts
**Datei:** `features/subscription/useSubscriptionData.ts`

React Hook zum Laden von Subscription-Daten

## 4. Abhängigkeiten (npm packages)

### 4.1 RevenueCat
```json
{
  "react-native-purchases": "^x.x.x",
  "@revenuecat/purchases-js": "^x.x.x"
}
```

### 4.2 Weitere Dependencies
- `react-i18next` - Internationalisierung
- `expo-router` - Navigation
- `@react-native-menu/menu` - Native Menüs
- `@expo/vector-icons` - Icons

## 5. Theme & Styling

### 5.1 Theme Provider
**Context:** `features/theme/ThemeProvider`

Benötigt für:
- `isDark` - Dark Mode Detection
- `themeVariant` - Theme-Varianten
- `tw` - Tailwind-Klassen
- `colors` - Theme-Farben

### 5.2 Tailwind Config
**Datei:** `tailwind.config.js`

Enthält Theme-Farben für:
- `pageBackground`
- `contentBackground`
- `border`
- Theme-Varianten (z.B. Lume, Stone, etc.)

### 5.3 Konsistente Farben

**Mana Accent Color:** `#4287f5` (Blau)

**Tier Colors (Subscriptions):**
- Free: `#F5F5F5` (Grau)
- Small: `#E3F2FD` / `#2196F3` (Hell-Blau)
- Medium: `#BBDEFB` / `#1976D2` (Mittel-Blau)
- Large: `#90CAF9` / `#1565C0` (Dunkel-Blau)
- Giant: `#64B5F6` / `#0D47A1` (Sehr-Dunkel-Blau)

## 6. Authentication & User Settings

### 6.1 authService
**Service:** `features/auth/services/authService`

Benötigte Methoden:
- `shouldDisableRevenueCat()` - Prüft B2B-Status
- `getB2BInfo()` - Holt B2B-Informationen

### 6.2 userSettingsService
**Service:** `features/settings/services/userSettingsService`

Benötigte Methoden:
- `getAllSettings()` - Holt alle User-Settings inkl. `subscription_plan_id`

## 7. Analytics

### 7.1 Analytics Tracking
**Service:** `features/analytics`

Events:
- `subscription_page` - Screen View
- `subscription_purchase_attempted` - Kauf gestartet
- `subscription_purchased` - Kauf erfolgreich
- `subscription_restore_attempted` - Restore gestartet
- `subscription_restore_completed` - Restore erfolgreich

## 8. Credits System

### 8.1 CreditContext
**Context:** `features/credits/CreditContext`

Benötigte Methoden:
- `refreshCredits()` - Credits nach Kauf aktualisieren

## 9. Weitere Features

### 9.1 Header Context
**Context:** `features/menus/HeaderContext`

Für dynamische Header-Konfiguration:
- `updateConfig()` - Header-Konfiguration ändern

### 9.2 Onboarding Context
**Context:** `features/onboarding/contexts/OnboardingContext`

Für Page-Onboarding:
- `showPageOnboardingToast()` - Toast anzeigen
- `cleanupPageToast()` - Toast cleanup

### 9.3 Support Email
**Utility:** `features/support/utils/emailSupport`

Methode:
- `openSupportEmail()` - E-Mail-Client öffnen mit vorgefüllten Daten

## 10. iOS & Android Konfiguration

### 10.1 iOS (Xcode)
- RevenueCat SDK in Podfile
- StoreKit Configuration für Testing
- In-App Purchase Capability

### 10.2 Android (Google Play Console)
- In-App Products konfiguriert
- Subscription Products erstellt
- RevenueCat mit Play Store verbunden

### 10.3 RevenueCat Dashboard
- Products/Offerings konfiguriert
- Entitlements definiert (z.B. "premium")
- App Stores verbunden (iOS/Android)
- Webhooks (optional)

## 11. Environment Variables

Benötigte Keys:

```bash
# iOS
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxx

# Android
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxx

# Web (Production)
EXPO_PUBLIC_REVENUECAT_WEB_PUBLIC_KEY_PROD=rcb_xxxxx

# Web (Development)
EXPO_PUBLIC_REVENUECAT_WEB_PUBLIC_KEY_DEV=rcb_xxxxx
```

## 12. Migrations & Upgrades

### 12.1 Legacy Plan Mapping
**Datei:** `features/migration/utils/subscriptionPlanMapping.ts`

Mappt alte Plan-IDs zu neuen Plan-IDs für Bestandskunden.

### 12.2 Plan ID Mapping

Die App verwendet eine Mapping-Funktion `mapDatabasePlanIdToUIPlanId()` in SubscriptionPage.tsx, die:
- Legacy iOS IDs zu aktuellen IDs mapped
- Legacy Android IDs zu aktuellen IDs mapped
- Neue RevenueCat IDs verarbeitet

## 13. Translation Keys (i18n)

Benötigte Translation Keys:

```json
{
  "subscription": {
    "title": "Buy Mana",
    "subscriptions": "Subscriptions",
    "one_time_purchases": "One-time Purchases",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "yearly_discount": "-{{percentage}}",
    "per_month": "pro Monat",
    "per_year": "pro Jahr",
    "mana": "Mana",
    "mana_amount": "{{amount}} Mana",
    "mana_costs": "Mana Costs",
    "one_time": "Einmalig",
    "buy": "Buy",
    "popular": "Popular",
    "current_plan": "Current Plan",
    "legacy_plan": "Legacy Plan",
    "your_plan": "Your Plan",
    "your_legacy_plan": "Your Legacy Plan",
    "show_larger_plans": "Show Larger Plans",
    "show_larger_packages": "Show Larger Packages",
    "individual": "Individual",
    "team": "Team",
    "enterprise": "Enterprise",
    "restore_purchases": "Restore Purchases",
    "contact_support": "Contact Support",
    "subscribe_success_title": "Successfully Subscribed!",
    "subscribe_success_message": "You have successfully subscribed to the {{planName}} plan.",
    "purchase_success_title": "Successfully Purchased!",
    "purchase_success_message": "You have successfully purchased the {{packageName}} package with {{manaAmount}} Mana.",
    "subscribe_error_title": "Subscription Error",
    "subscribe_error_message": "An error occurred while completing the subscription. Please try again later.",
    "purchase_error_title": "Purchase Error",
    "purchase_error_message": "An error occurred while purchasing the package. Please try again later.",
    "restore_title": "Restore Purchases",
    "restore_message": "Your purchases are being restored...",
    "restore_success": "Success",
    "restore_success_message": "Your purchases have been successfully restored.",
    "failed_to_load": "Failed to load subscription data",
    "b2b": {
      "title": "Enterprise Account",
      "message": "You have an enterprise account with managed billing.",
      "organization": "Organization",
      "plan": "Plan",
      "role": "Role",
      "contact_admin": "For billing questions, please contact your organization administrator."
    }
  },
  "common": {
    "ok": "OK"
  }
}
```

## 14. Dateistruktur zum Kopieren

### Mindest-Set an Dateien:

```
app/(protected)/
  └── subscription.tsx                          # Route Screen

features/subscription/
  ├── SubscriptionPage.tsx                      # Haupt-Page
  ├── SubscriptionCard.tsx                      # Abo-Card
  ├── PackageCard.tsx                           # Paket-Card
  ├── SubscriptionButton.tsx                    # Button
  ├── BillingToggle.tsx                         # Monatlich/Jährlich Toggle
  ├── CostCard.tsx                              # Kosten-Übersicht
  ├── UsageCard.tsx                             # Nutzungs-Übersicht
  ├── SubscriptionMenu.tsx                      # Menü
  ├── SubscriptionPageSkeleton.tsx              # Loading State
  ├── B2BSubscriptionMessage.tsx                # B2B Nachricht
  ├── ManaIcon.tsx                              # Mana Icon
  ├── subscriptionData.json                     # Master-Daten
  ├── appCosts.json                             # Kosten-Daten
  ├── usageData.json                            # Nutzungs-Daten
  ├── subscriptionService.ts                    # RevenueCat Service
  ├── revenueCatManager.ts                      # RC Manager
  ├── productIds.ts                             # Produkt-ID Mapping
  ├── subscriptionTypes.ts                      # TypeScript Types
  ├── useSubscriptionData.ts                    # React Hook
  └── services/
      └── revenueCatWebService.ts               # Web Service

features/migration/utils/
  └── subscriptionPlanMapping.ts                # Legacy Mapping
```

### Abhängige Services (bereits vorhanden):
```
features/auth/services/
  └── authService.ts                            # B2B Check

features/settings/services/
  └── userSettingsService.ts                    # User Settings

features/theme/
  └── ThemeProvider.tsx                         # Theme Context

features/analytics/
  └── (analytics services)                      # Analytics

features/credits/
  └── CreditContext.tsx                         # Credits

features/menus/
  └── HeaderContext.tsx                         # Header

features/onboarding/contexts/
  └── OnboardingContext.tsx                     # Onboarding

features/support/utils/
  └── emailSupport.ts                           # Support Email
```

## 15. Implementierungs-Schritte

### Schritt 1: Dateien kopieren
1. Alle Dateien aus `features/subscription/` kopieren
2. Route-Datei `app/(protected)/subscription.tsx` kopieren

### Schritt 2: Dependencies installieren
```bash
npm install react-native-purchases @revenuecat/purchases-js @react-native-menu/menu
```

### Schritt 3: RevenueCat konfigurieren
1. RevenueCat Account erstellen
2. App in RevenueCat Dashboard hinzufügen
3. Products/Offerings erstellen
4. API Keys in `.env` hinzufügen

### Schritt 4: Store Products konfigurieren
1. **iOS:** In-App Purchases in App Store Connect erstellen
2. **Android:** In-App Products in Google Play Console erstellen
3. Produkt-IDs in `productIds.ts` anpassen

### Schritt 5: Abhängige Services anpassen
1. Auth Service mit B2B-Check erweitern (falls benötigt)
2. User Settings Service mit subscription_plan_id erweitern
3. Credits System implementieren

### Schritt 6: Theme & Styling anpassen
1. Theme Provider prüfen
2. Tailwind Config anpassen
3. Farben nach Bedarf ändern

### Schritt 7: Translations hinzufügen
1. Alle i18n-Keys aus Abschnitt 13 hinzufügen
2. Übersetzungen für alle Sprachen erstellen

### Schritt 8: Testing
1. iOS Sandbox Testing
2. Android Testing
3. Web Testing
4. Restore Purchases testen
5. Legacy Plan Migration testen

## 16. Besonderheiten & Best Practices

### 16.1 Platform-Spezifische Implementierungen
- Web nutzt `@revenuecat/purchases-js`
- Mobile nutzt `react-native-purchases`
- Conditional Imports für Plattformen

### 16.2 Error Handling
- User Cancellation wird separat behandelt
- Keine Error-Alert bei User Cancellation
- Detailliertes Error-Logging für Debugging

### 16.3 B2B Support
- RevenueCat wird für B2B-Benutzer deaktiviert
- B2B-Nachricht statt normale Subscription Page
- Separate B2B-Daten aus authService

### 16.4 Legacy Support
- Alte Plan-IDs werden zu neuen mapped
- Legacy-Badge für Bestandskunden
- Legacy Plans sind nicht mehr kaufbar

### 16.5 Analytics
- Alle wichtigen Events werden getrackt
- Plan-Details werden mitgesendet
- User-Verhalten wird gemessen

### 16.6 Credits Refresh
- Credits werden 3 Sekunden nach Kauf aktualisiert
- Delay sorgt für Backend-Synchronisation

### 16.7 Sticky Toggle
- BillingToggle wird beim Scrollen sticky
- Smooth Animation
- Verbessert UX beim Vergleich von Plänen

## 17. Troubleshooting

### Problem: RevenueCat SDK nicht initialisiert
**Lösung:** API Keys prüfen, Plattform prüfen

### Problem: Produkte nicht gefunden
**Lösung:** Store-Konfiguration prüfen, Product IDs prüfen

### Problem: Käufe funktionieren nicht
**Lösung:** Sandbox-Accounts prüfen (iOS), Test-Karten prüfen (Android)

### Problem: Legacy Plans werden nicht erkannt
**Lösung:** Plan-Mapping in `mapDatabasePlanIdToUIPlanId()` prüfen

### Problem: Credits werden nicht aktualisiert
**Lösung:** Backend-Webhook prüfen, Credits-Refresh-Delay erhöhen

## 18. Weitere Hinweise

### Testing-Umgebungen
- **iOS:** Sandbox-Accounts in TestFlight
- **Android:** Test-Tracks in Play Console
- **Web:** Development-Keys verwenden

### Production Deployment
1. API Keys für Production setzen
2. Store-Reviews für In-App Purchases durchführen
3. RevenueCat Webhooks konfigurieren
4. Analytics Monitoring aktivieren

### Maintenance
- Regelmäßig RevenueCat Dashboard prüfen
- Failed Purchases monitoren
- Subscription Churn analysieren
- Legacy Plans migrieren

---

**Stand:** 2025-10-17
**Version:** 1.0
**Autor:** Dokumentation basierend auf Memoro-App-Code
