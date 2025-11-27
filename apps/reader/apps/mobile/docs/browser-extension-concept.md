# Browser Extension für URL-Extraktion

## Konzept
Eine Browser Extension kann direkt auf den gerenderten Content zugreifen, nachdem der Nutzer Cookies akzeptiert hat.

## Implementation (Chrome/Safari)

### Manifest.json
```json
{
  "manifest_version": 3,
  "name": "Reader App Extractor",
  "permissions": ["activeTab", "clipboardWrite"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}
```

### Content Script
```javascript
// content.js
function extractArticle() {
  // Nutze Readability direkt im Browser
  const documentClone = document.cloneNode(true);
  const reader = new Readability(documentClone);
  const article = reader.parse();
  
  if (article) {
    // Sende an Reader App
    const readerUrl = `reader-app://add?title=${encodeURIComponent(article.title)}&content=${encodeURIComponent(article.content)}`;
    window.location.href = readerUrl;
  }
}
```

### Integration in React Native
```typescript
// Deep Link Handler
import { Linking } from 'react-native';

Linking.addEventListener('url', (event) => {
  const url = new URL(event.url);
  if (url.protocol === 'reader-app:' && url.pathname === 'add') {
    const title = url.searchParams.get('title');
    const content = url.searchParams.get('content');
    // Erstelle neuen Text
  }
});
```

## iOS Share Extension Alternative

### Info.plist
```xml
<key>NSExtension</key>
<dict>
  <key>NSExtensionAttributes</key>
  <dict>
    <key>NSExtensionActivationRule</key>
    <string>SUBQUERY(extensionItems, $e, SUBQUERY($e.attachments, $a, $a.registeredTypeIdentifiers UTI-CONFORMS-TO "public.url").@count > 0).@count > 0</string>
  </dict>
</dict>
```

### Share Extension Code
```swift
import MobileCoreServices

class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        if let item = extensionContext?.inputItems.first as? NSExtensionItem,
           let provider = item.attachments?.first {
            
            if provider.hasItemConformingToTypeIdentifier(kUTTypeURL as String) {
                provider.loadItem(forTypeIdentifier: kUTTypeURL as String) { (url, error) in
                    if let shareURL = url as? URL {
                        // Extrahiere Content mit WKWebView
                        self.extractContent(from: shareURL)
                    }
                }
            }
        }
    }
    
    func extractContent(from url: URL) {
        let webView = WKWebView()
        webView.load(URLRequest(url: url))
        
        // Nach dem Laden JavaScript ausführen
        webView.evaluateJavaScript("document.body.innerText") { (result, error) in
            if let text = result as? String {
                // Speichere in App Group oder sende an App
                self.saveToApp(title: url.host ?? "Artikel", content: text, url: url.absoluteString)
            }
        }
    }
}
```

## Vorteile
1. Umgeht alle Cookie-Banner (Nutzer akzeptiert im Browser)
2. Zugriff auf den vollständig gerenderten Content
3. Native Integration in iOS/Android Share-Menü
4. Kein Server-Side Rendering nötig

## Nachteile
1. Zusätzliche Installation erforderlich
2. Platform-spezifische Entwicklung
3. App Store Review Process für Extensions