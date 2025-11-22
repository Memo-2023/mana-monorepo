Jetzt starten 

bookmark_border
In diesem Leitfaden erfahren Sie, wie Sie mit Genkit in einer Node.js-App beginnen.

Vorbereitung
In diesem Leitfaden wird davon ausgegangen, dass Sie mit dem Erstellen von Anwendungen mit Node.js vertraut sind.

Damit Sie diese Kurzanleitung ausführen können, muss Ihre Entwicklungsumgebung die folgenden Anforderungen erfüllen:

Node.js v20 und höher
npm
Genkit-Abhängigkeiten installieren
Installieren Sie die folgenden Genkit-Abhängigkeiten, um Genkit in Ihrem Projekt zu verwenden:

genkit stellt die wichtigsten Funktionen von Genkit bereit.
@genkit-ai/googleai bietet Zugriff auf die Google AI-Gemini-Modelle.

npm install genkit @genkit-ai/googleai
API-Schlüssel des Modells konfigurieren
In dieser Anleitung zeigen wir Ihnen, wie Sie die Gemini API verwenden. Diese bietet eine großzügige kostenlose Stufe, sodass Sie für den Einstieg keine Kreditkarte brauchen. Zur Verwendung der Gemini API benötigen Sie einen API-Schlüssel. Wenn Sie noch keinen haben, erstellen Sie einen in Google AI Studio.

API-Schlüssel von Google AI Studio abrufen

Nachdem Sie den API-Schlüssel erstellt haben, legen Sie die Umgebungsvariable MAERCHENZAUBER_GOOGLE_GENAI_API_KEY mit dem folgenden Befehl auf Ihren Schlüssel fest:


export MAERCHENZAUBER_GOOGLE_GENAI_API_KEY=<your API key>
Hinweis: In diesem Tutorial wird die Gemini API von AI Studio verwendet. Genkit unterstützt jedoch eine Vielzahl von Modellanbietern, darunter Gemini von Vertex AI, die Claude 3-Modelle von Anthropoic und Llama 3.1 über die Vertex AI Model Garden, Open-Source-Modelle über Ollama und mehrere andere von der Community unterstützte Anbieter wie OpenAI und Cohere.
Erste Anfrage senden
In Genkit können Sie mit nur wenigen Codezeilen loslegen.


// import the Genkit and Google AI plugin libraries
import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

// configure a Genkit instance
const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash, // set default model
});

(async () => {
  // make a generation request
  const { text } = await ai.generate('Hello, Gemini!');
  console.log(text);
})();
Nächste Schritte
Sie haben die Voraussetzungen für Modellanfragen mit Genkit geschaffen. Es gibt jedoch noch weitere Genkit-Funktionen zum Erstellen KI-basierter Apps und Workflows. Informationen zu den ersten Schritten mit diesen zusätzlichen Genkit-Funktionen finden Sie in diesen Anleitungen:

Entwicklertools: Hier erfahren Sie, wie Sie die Befehlszeile und die Entwickler-UI von Genkit einrichten und verwenden, um Ihre App lokal zu testen und zu debuggen.
Inhalte generieren: Hier erfahren Sie, wie Sie die einheitliche Generierungs-API von Genkit verwenden, um Text und strukturierte Daten aus einem beliebigen unterstützten Modell zu erstellen.
Flows erstellen: Wir zeigen Ihnen, wie Sie spezielle Genkit-Funktionen, sogenannte Flows, verwenden, die eine End-to-End-Beobachtbarkeit für Workflows sowie umfangreiches Debugging mit Genkit-Tools ermöglichen.
Prompts verwalten: Hier finden Sie Informationen dazu, wie Sie mit Genkit Prompts und Konfigurationen als Code verwalten.

Firebase Genkit-Entwicklertools 

bookmark_border
Firebase Genkit bietet zwei wichtige Entwicklertools:

Eine Node.js-Befehlszeile für Befehlszeilenvorgänge
Eine optionale lokale Webanwendung, die als Entwickleroberfläche bezeichnet wird und für interaktive Tests und die Entwicklung mit Ihrer Genkit-Konfiguration verwendet wird
Befehlszeile
Installieren Sie die Befehlszeile in Ihrem Projekt mit:


npm install -D genkit-cli
Die Befehlszeile unterstützt verschiedene Befehle, um die Arbeit mit Genkit-Projekten zu erleichtern:

genkit start -- <command to run your code>: Starten Sie die Entwickler-Benutzeroberfläche und stellen Sie eine Verbindung zu einem laufenden Codeprozess her.
genkit flow:run <flowName>: Einen bestimmten Ablauf ausführen.
genkit eval:flow <flowName>: Einen bestimmten Ablauf bewerten.
Eine vollständige Liste der Befehle erhalten Sie mit:


npx genkit --help
Genkit-Benutzeroberfläche für Entwickler
Die Genkit-Entwickler-UI ist eine lokale Webanwendung, mit der Sie interaktiv mit Modellen, Abläufen, Prompts und anderen Elementen in Ihrem Genkit-Projekt arbeiten können.

Die Entwickleroberfläche kann anhand eines laufenden Codeprozesses ermitteln, welche Genkit-Komponenten Sie in Ihrem Code definiert haben.

Führen Sie den folgenden Befehl aus, um die Benutzeroberfläche zu starten:


npx genkit start -- <command to run your code>
Die <command to run your code> variiert je nach Projekteinrichtung und Datei, die Sie ausführen möchten. Hier sind einige Beispiele:


# Running a typical development server
npx genkit start -- npm run dev
# Running a TypeScript file directly
npx genkit start -- npx tsx --watch src/index.ts
# Running a JavaScript file directly
npx genkit start -- node --watch src/index.js
Wenn Sie die Option --watch angeben, werden gespeicherte Änderungen am Code in der Entwickleroberfläche erkannt und berücksichtigt, ohne dass der Code neu gestartet werden muss.

Nach der Ausführung des Befehls erhalten Sie eine Ausgabe wie die folgende:


Telemetry API running on http://localhost:4033
Genkit Developer UI: http://localhost:4000
Öffnen Sie die lokale Hostadresse für die Genkit-Entwickler-UI in Ihrem Browser, um sie aufzurufen. Sie können sie auch im einfachen Browser von VS Code öffnen, um sie neben Ihrem Code anzusehen.

Alternativ können Sie dem Startbefehl die Option -o hinzufügen, um die Entwickleroberfläche automatisch in Ihrem Standardbrowsertab zu öffnen.


npx genkit start -o -- <command to run your code>
Willkommen bei der Genkit-Benutzeroberfläche für Entwickler

Die Entwickleroberfläche enthält Aktionsauslöser für flow, prompt, model, tool, retriever, indexer, embedder und evaluator, die auf den Komponenten basieren, die Sie in Ihrem Code definiert haben.

Hier ist eine kurze GIF-Demo mit Katzen.

GIF-Übersicht der Genkit-Benutzeroberfläche für Entwickler

Analytics
Die Genkit-Befehlszeile und die Entwickler-Benutzeroberfläche verwenden Cookies und ähnliche Technologien von Google, um die Qualität der angebotenen Dienste zu verbessern und Zugriffe zu analysieren. Weitere Informationen

Wenn Sie die Analyse deaktivieren möchten, können Sie den folgenden Befehl ausführen:


npx genkit config set analyticsOptOut true
Sie können die aktuelle Einstellung mit folgendem Befehl aufrufen:


npx genkit config get analyticsOptOut

Inhalte mit KI-Modellen generieren 

bookmark_border
Im Mittelpunkt der generativen KI stehen KI-Modelle. Die beiden derzeit bekanntesten Beispiele für generative Modelle sind Large Language Models (LLMs) und Modelle zur Bildgenerierung. Diese Modelle nehmen eine Eingabe, einen sogenannten Prompt (am häufigsten Text, ein Bild oder eine Kombination aus beiden), und generieren daraus Text, ein Bild oder sogar Audio- oder Videoinhalte.

Die Ausgabe dieser Modelle kann überraschend überzeugend sein: LLMs generieren Text, der so aussieht, als könnte er von einem Menschen geschrieben worden sein, und Modelle zur Bildgenerierung können Bilder erstellen, die sehr nah an echten Fotos oder von Menschen erstellten Kunstwerken sind.

Darüber hinaus haben sich LLMs für Aufgaben bewährt, die über die einfache Textgenerierung hinausgehen:

Computerprogramme schreiben
Unteraufgaben planen, die für den Abschluss einer größeren Aufgabe erforderlich sind
Unorganisierte Daten organisieren
Informationsdaten aus einem Textkorpus verstehen und extrahieren
Automatisierte Aktivitäten ausführen, die auf einer Textbeschreibung der Aktivität basieren
Es gibt viele Modelle von verschiedenen Anbietern. Jedes Modell hat seine eigenen Stärken und Schwächen. Ein Modell kann bei einer Aufgabe hervorragend abschneiden, bei anderen aber weniger gut abschneiden. Bei Apps, die Generative AI nutzen, kann es oft von Vorteil sein, je nach Aufgabe mehrere verschiedene Modelle zu verwenden.

Als App-Entwickler interagieren Sie in der Regel nicht direkt mit generativen KI-Modellen, sondern über Dienste, die als Web-APIs verfügbar sind. Auch wenn diese Dienste oft ähnliche Funktionen haben, werden sie alle über unterschiedliche und inkompatible APIs bereitgestellt. Wenn Sie mehrere Modelldienste nutzen möchten, müssen Sie jedes der proprietären SDKs verwenden, die möglicherweise nicht miteinander kompatibel sind. Wenn Sie von einem Modell auf das neueste und leistungsfähigste Modell umsteigen möchten, müssen Sie diese Integration möglicherweise noch einmal erstellen.

Genkit löst dieses Problem, indem es eine einzige Oberfläche bietet, die die Details des Zugriffs auf potenziell jeden Dienst für Modelle mit generativer KI abstrahiert. Es sind bereits mehrere vorgefertigte Implementierungen verfügbar. Wenn Sie Ihre KI-gestützte App auf Genkit aufbauen, wird der erste Aufruf der generativen KI vereinfacht. Außerdem können Sie mehrere Modelle kombinieren oder ein Modell durch ein anderes ersetzen, sobald neue Modelle verfügbar sind.

Hinweis
Wenn Sie die Codebeispiele auf dieser Seite ausführen möchten, führen Sie zuerst die Schritte in der Anleitung Erste Schritte aus. Bei allen Beispielen wird davon ausgegangen, dass Sie Genkit bereits als Abhängigkeit in Ihrem Projekt installiert haben.

Von Genkit unterstützte Modelle
Genkit ist so flexibel, dass damit potenziell jeder Dienst für generative KI-Modelle verwendet werden kann. Die Kernbibliotheken definieren die gemeinsame Schnittstelle für die Arbeit mit Modellen und die Modell-Plug-ins definieren die Implementierungsdetails für die Arbeit mit einem bestimmten Modell und seiner API.

Das Genkit-Team verwaltet Plug-ins für die Arbeit mit Modellen von Vertex AI, Google Generative AI und Ollama:

LLMs der Gemini-Familie über das Google Cloud Vertex AI-Plug-in
LLMs der Gemini-Reihe über das Google AI-Plug-in
Bildgenerierungsmodelle Imagen2 und Imagen3 über Google Cloud Vertex AI
Die LLM-Familie Claude 3 von Anthropic über den Model Garden von Google Cloud Vertex AI
Gemma 2, Llama 3 und viele weitere offene Modelle über das Ollama-Plug-in (Sie müssen den Ollama-Server selbst hosten)
Außerdem gibt es mehrere von der Community unterstützte Plug-ins, die Schnittstellen zu diesen Modellen bieten:

LLMs der Claude 3-Familie über das Anthropic-Plug-in
GPT-Familie von LLMs über das OpenAI-Plug-in
GPT-Familie von LLMs über das Azure OpenAI-Plug-in
R-Familie von LLMs über das Cohere-Plug-in steuern
Mistral-LLMs über das Mistral-Plug-in
Gemma 2, Llama 3 und viele weitere offene Modelle, die auf Groq gehostet werden, über das Groq-Plug-in
Weitere Informationen findest du, wenn du auf npmjs.org nach genkit-model-getaggten Paketen suchst.

Modell-Plug-ins laden und konfigurieren
Bevor du mit Genkit Inhalte generieren kannst, musst du ein Modell-Plug-in laden und konfigurieren. Wenn Sie aus der Anleitung „Erste Schritte“ hierher gelangt sind, haben Sie das bereits getan. Andernfalls lesen Sie den Einstiegsleitfaden oder die Dokumentation des jeweiligen Plug-ins und folgen Sie der Anleitung, bevor Sie fortfahren.

Die Methode „generate()“
In Genkit ist die generate()-Methode die primäre Schnittstelle, über die Sie mit generativen KI-Modellen interagieren.

Der einfachste generate()-Aufruf gibt das gewünschte Modell und einen Textprompt an:


import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

(async () => {
  const { text } = await ai.generate(
    'Invent a menu item for a pirate themed restaurant.'
  );
  console.log(text);
})();
Wenn Sie dieses kurze Beispiel ausführen, werden einige Informationen zur Fehlerbehebung und dann die Ausgabe des generate()-Aufrufs ausgegeben. Dies ist in der Regel Markdown-Text wie im folgenden Beispiel:


## The Blackheart's Bounty

**A hearty stew of slow-cooked beef, spiced with rum and molasses, served in a
hollowed-out cannonball with a side of crusty bread and a dollop of tangy
pineapple salsa.**

**Description:** This dish is a tribute to the hearty meals enjoyed by pirates
on the high seas. The beef is tender and flavorful, infused with the warm spices
of rum and molasses. The pineapple salsa adds a touch of sweetness and acidity,
balancing the richness of the stew. The cannonball serving vessel adds a fun and
thematic touch, making this dish a perfect choice for any pirate-themed
adventure.
Wenn Sie das Script noch einmal ausführen, erhalten Sie eine andere Ausgabe.

Im vorherigen Codebeispiel wurde die Generierungsanfrage an das Standardmodell gesendet, das Sie beim Konfigurieren der Genkit-Instanz angegeben haben.

Sie können auch ein Modell für einen einzelnen generate()-Aufruf angeben:


const { text } = await ai.generate({
  model: gemini15Pro,
  prompt: 'Invent a menu item for a pirate themed restaurant.',
});
In diesem Beispiel wird eine vom Modell-Plug-in exportierte Modellreferenz verwendet. Eine weitere Möglichkeit ist, das Modell mit einer Stringkennzeichnung anzugeben:


const { text } = await ai.generate({
  model: 'googleai/gemini-1.5-pro-latest',
  prompt: 'Invent a menu item for a pirate themed restaurant.',
});
Eine Modell-String-ID sieht so aus: providerid/modelid. Dabei identifiziert die Anbieter-ID (in diesem Fall googleai) das Plug-in und die Modell-ID ist eine plug-inspezifische String-ID für eine bestimmte Version eines Modells.

Einige Modell-Plug-ins wie das Ollama-Plug-in bieten Zugriff auf potenziell Dutzende verschiedener Modelle und exportieren daher keine einzelnen Modellreferenzen. In diesen Fällen können Sie ein Modell für generate() nur über seine String-ID angeben.

Diese Beispiele veranschaulichen auch einen wichtigen Punkt: Wenn Sie generate() verwenden, um generative KI-Modellaufrufe zu starten, können Sie das gewünschte Modell einfach ändern, indem Sie dem Modellparameter einen anderen Wert übergeben. Wenn Sie generate() anstelle der nativen Modell-SDKs verwenden, haben Sie die Flexibilität, mehrere verschiedene Modelle in Ihrer App einfacher zu verwenden und in Zukunft zu ändern.

Bisher haben Sie nur Beispiele für die einfachsten generate()-Aufrufe gesehen. generate() bietet jedoch auch eine Benutzeroberfläche für erweiterte Interaktionen mit generativen Modellen, wie in den folgenden Abschnitten beschrieben.

Systemaufforderungen
Einige Modelle unterstützen die Angabe eines Systemprompts, der dem Modell Anweisungen gibt, wie es auf Nachrichten von Nutzern reagieren soll. Mit dem Systemvorschlag können Sie beispielsweise eine Persona angeben, die das Modell übernehmen soll, den Ton der Antworten oder das Format der Antworten.

Wenn das von Ihnen verwendete Modell Systemaufforderungen unterstützt, können Sie eine mit dem Parameter system angeben:


const { text } = await ai.generate({
  system: 'You are a food industry marketing consultant.',
  prompt: 'Invent a menu item for a pirate themed restaurant.',
});
Modellparameter
Die Funktion generate() verwendet den Parameter config, mit dem Sie optionale Einstellungen angeben können, die steuern, wie das Modell Inhalte generiert:


const { text } = await ai.generate({
  prompt: 'Invent a menu item for a pirate themed restaurant.',
  config: {
    maxOutputTokens: 400,
    stopSequences: ['<end>', '<fin>'],
    temperature: 1.2,
    topP: 0.4,
    topK: 50,
  },
});
Die genauen unterstützten Parameter hängen vom jeweiligen Modell und der jeweiligen Modell-API ab. Die Parameter im vorherigen Beispiel sind jedoch für fast alle Modelle üblich. Im Folgenden werden diese Parameter erläutert:

Parameter zur Steuerung der Ausgabelänge
maxOutputTokens

LLMs arbeiten mit Einheiten, die als Tokens bezeichnet werden. Ein Token wird in der Regel, aber nicht unbedingt, einer bestimmten Zeichenfolge zugeordnet. Wenn Sie einen Prompt an ein Modell übergeben, wird der Promptstring als einer der ersten Schritte in eine Sequenz von Tokens getaggt. Anschließend generiert der LLM eine Token-Sequenz aus der tokenisierten Eingabe. Schließlich wird die Token-Sequenz wieder in Text umgewandelt, was die Ausgabe ist.

Mit dem Parameter „Maximale Ausgabetokens“ wird einfach festgelegt, wie viele Tokens mit dem LLM generiert werden sollen. Jedes Modell verwendet möglicherweise einen anderen Tokenisierer. Als Faustregel gilt jedoch, dass ein einzelnes englisches Wort aus zwei bis vier Tokens besteht.

Wie bereits erwähnt, werden einige Tokens möglicherweise nicht Zeichenfolgen zugeordnet. Ein Beispiel hierfür ist, dass es oft ein Token gibt, das das Ende der Sequenz angibt: Wenn ein LLM dieses Token generiert, generiert es keine weiteren. Daher ist es möglich und häufig der Fall, dass ein LLM weniger Token als das Maximum generiert, weil es das „Stopp“-Token generiert hat.

stopSequences

Mit diesem Parameter können Sie die Tokens oder Tokenfolgen festlegen, die beim Generieren das Ende der LLM-Ausgabe anzeigen. Die richtigen Werte hängen in der Regel davon ab, wie das Modell trainiert wurde, und werden normalerweise vom Modell-Plug-in festgelegt. Wenn Sie das Modell jedoch aufgefordert haben, eine weitere Haltestellensequenz zu generieren, können Sie sie hier angeben.

Sie geben also Zeichenfolgen an, keine Tokens. In den meisten Fällen geben Sie eine Zeichenfolge an, die vom Tokenizer des Modells einem einzelnen Token zugeordnet wird.

Parameter für „Creativity“
Die Parameter Temperatur, Top-P und Top-K steuern gemeinsam, wie kreativ das Modell sein soll. Im Folgenden finden Sie eine sehr kurze Erklärung der Bedeutung dieser Parameter. Wichtiger ist jedoch Folgendes: Mit diesen Parametern wird der Charakter der Ausgabe einer LLM angepasst. Die optimalen Werte für diese Parameter hängen von Ihren Zielen und Präferenzen ab und lassen sich wahrscheinlich nur durch Tests ermitteln.

Temperatur

LLMs sind im Grunde Maschinen zur Tokenvorhersage. Für eine bestimmte Tokenfolge (z. B. den Prompt) prognostiziert ein LLM für jedes Token in seinem Vokabular die Wahrscheinlichkeit, dass das Token als Nächstes in der Sequenz kommt. Die Temperatur ist ein Skalierungsfaktor, durch den diese Vorhersagen geteilt werden, bevor sie auf eine Wahrscheinlichkeit zwischen 0 und 1 normalisiert werden.

Niedrige Temperaturwerte zwischen 0,0 und 1,0 verstärken den Unterschied in den Wahrscheinlichkeiten zwischen den Tokens. Das Modell wird also noch unwahrscheinlicher ein Token generieren, das bereits als unwahrscheinlich eingestuft wurde. Das wird oft als weniger kreativ wahrgenommen. Obwohl 0,0 technisch gesehen kein gültiger Wert ist, wird er in vielen Modellen als Hinweis darauf interpretiert, dass sich das Modell deterministisch verhalten und nur das wahrscheinlichste Token berücksichtigen soll.

Hohe Temperaturwerte (über 1,0) komprimieren die Unterschiede in den Wahrscheinlichkeiten zwischen Tokens.Das Modell generiert dann mit höherer Wahrscheinlichkeit Tokens, die zuvor als unwahrscheinlich eingestuft wurden. Das wird oft als kreativer Output wahrgenommen. Einige Modell-APIs setzen eine maximale Temperatur fest, oft 2.0.

topP

Top-p ist ein Wert zwischen 0,0 und 1,0, der die Anzahl der möglichen Tokens steuert, die vom Modell berücksichtigt werden sollen. Dazu wird die kumulative Wahrscheinlichkeit der Tokens angegeben. Ein Wert von 1,0 bedeutet beispielsweise, dass alle möglichen Tokens berücksichtigt werden, aber die Wahrscheinlichkeit jedes Tokens berücksichtigt wird. Ein Wert von 0,4 bedeutet, dass nur die wahrscheinlichsten Tokens berücksichtigt werden, deren Wahrscheinlichkeiten zusammen 0,4 ergeben, und die verbleibenden Tokens ausgeschlossen werden.

topK

Top-K ist ein Ganzzahlwert, mit dem auch die Anzahl der möglichen Tokens gesteuert wird, die vom Modell berücksichtigt werden sollen. Dies geschieht jedoch durch explizite Angabe der maximalen Anzahl von Tokens. Wenn Sie den Wert „1“ angeben, soll sich das Modell deterministisch verhalten.

Mit Modellparametern experimentieren
Mit der Entwickler-Benutzeroberfläche können Sie die Auswirkungen dieser Parameter auf die Ausgabe testen, die durch verschiedene Modell- und Prompt-Kombinationen generiert wird. Starten Sie die Entwickler-UI mit dem Befehl genkit start. Daraufhin werden automatisch alle Modelle geladen, die von den in Ihrem Projekt konfigurierten Plug-ins definiert wurden. Sie können schnell verschiedene Prompts und Konfigurationswerte ausprobieren, ohne diese Änderungen wiederholt im Code vornehmen zu müssen.

Strukturierte Ausgabe
Wenn Sie generative KI als Komponente in Ihrer Anwendung verwenden, möchten Sie die Ausgabe häufig in einem anderen Format als Nur-Text haben. Auch wenn Sie nur Inhalte generieren, die Nutzern angezeigt werden sollen, können Sie von strukturierten Ergebnissen profitieren, um sie Nutzern ansprechender zu präsentieren. Für erweiterte Anwendungen generativer KI, z. B. die programmatische Verwendung der Ausgabe des Modells oder die Eingabe der Ausgabe eines Modells in ein anderes, ist jedoch eine strukturierte Ausgabe unerlässlich.

In Genkit können Sie eine strukturierte Ausgabe von einem Modell anfordern, indem Sie beim Aufrufen von generate() ein Schema angeben:


import { z } from 'genkit'; // Import Zod, which is re-exported by Genkit.

const MenuItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  calories: z.number(),
  allergens: z.array(z.string()),
});

const { output } = await ai.generate({
  prompt: 'Invent a menu item for a pirate themed restaurant.',
  output: { schema: MenuItemSchema },
});
Modellausgabeschemata werden mit der Zod-Bibliothek angegeben. Neben einer Schemadefinitionsprache bietet Zod auch eine Laufzeittypprüfung, die die Lücke zwischen statischen TypeScript-Typen und der unvorhersehbaren Ausgabe generativer KI-Modelle schließt. Mit Zod können Sie Code schreiben, bei dem Sie sich darauf verlassen können, dass ein erfolgreicher generate-Aufruf immer eine Ausgabe zurückgibt, die Ihren TypeScript-Typen entspricht.

Wenn Sie in generate() ein Schema angeben, führt Genkit im Hintergrund mehrere Aktionen aus:

Ergänzt den Prompt um zusätzliche Hinweise zum gewünschten Ausgabeformat. Außerdem können Sie dem Modell so mitteilen, welche Inhalte genau Sie generieren möchten, z. B. nicht nur einen Menüpunkt vorschlagen, sondern auch eine Beschreibung und eine Liste der Allergene generieren.
Parst die Modellausgabe in ein JavaScript-Objekt.
Prüft, ob die Ausgabe dem Schema entspricht.
Wenn Sie eine strukturierte Ausgabe aus einem erfolgreichen generate-Aufruf erhalten möchten, verwenden Sie die Property output des Antwortobjekts:


if (output) {
  const { name, description, calories, allergens } = output;
}
Fehlerbehebung
Beachten Sie im vorherigen Beispiel, dass das Attribut output null sein kann. Das kann passieren, wenn das Modell keine Ausgabe generiert, die dem Schema entspricht. Die beste Strategie für den Umgang mit solchen Fehlern hängt von Ihrem genauen Anwendungsfall ab. Hier sind einige allgemeine Hinweise:

Versuchen Sie es mit einem anderen Modell. Damit eine strukturierte Ausgabe möglich ist, muss das Modell in der Lage sein, eine Ausgabe im JSON-Format zu generieren. Die leistungsstärksten LLMs wie Gemini und Claude sind vielseitig genug, um dies zu tun. Kleinere Modelle wie einige der lokalen Modelle, die Sie mit Ollama verwenden würden, können jedoch nur dann zuverlässig strukturierte Ausgabe generieren, wenn sie speziell dafür trainiert wurden.

Verwenden Sie die Erzwingungsfunktionen von Zod: Sie können in Ihren Schemas angeben, dass Zod versuchen soll, nicht konforme Typen in den vom Schema angegebenen Typ zu zwingen. Wenn Ihr Schema neben Strings auch andere primitive Typen enthält, können Sie mithilfe der Zod-Erzwigung die Anzahl der generate()-Fehler reduzieren. In der folgenden Version von MenuItemSchema werden Situationen, in denen das Modell Kalorieninformationen als String anstelle einer Zahl generiert, automatisch durch Typumwandlung korrigiert:


const MenuItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  calories: z.coerce.number(),
  allergens: z.array(z.string()),
});
Wiederholen Sie den Aufruf von „generate()“. Wenn das von Ihnen ausgewählte Modell nur selten keine konforme Ausgabe generiert, können Sie den Fehler wie einen Netzwerkfehler behandeln und die Anfrage einfach mit einer Art inkrementellem Backoff wiederholen.

Streaming
Wenn Sie große Mengen an Text generieren, können Sie die Nutzerfreundlichkeit verbessern, indem Sie die Ausgabe während der Generierung präsentieren, also streamen. Ein bekanntes Beispiel für Streaming in der Praxis findet sich in den meisten LLM-Chat-Apps: Nutzer können die Antwort des Modells auf ihre Nachricht lesen, während sie generiert wird. Dadurch wird die wahrgenommene Reaktionsfähigkeit der Anwendung verbessert und der Eindruck entsteht, mit einem intelligenten Gegenüber zu chatten.

In Genkit können Sie die Ausgabe mit der Methode generateStream() streamen. Die Syntax ähnelt der der generate()-Methode:


const { response, stream } = await ai.generateStream(
  'Suggest a complete menu for a pirate themed restaurant.'
);
Das Antwortobjekt hat das Attribut stream, mit dem Sie die Streamingausgabe der Anfrage iterieren können, während sie generiert wird:


for await (const chunk of stream) {
  console.log(chunk.text);
}
Wie bei einer nicht streamenden Anfrage können Sie auch die vollständige Ausgabe der Anfrage abrufen:


const completeText = (await response).text;
Streaming funktioniert auch mit strukturierter Ausgabe:


const MenuSchema = z.object({
  starters: z.array(MenuItemSchema),
  mains: z.array(MenuItemSchema),
  desserts: z.array(MenuItemSchema),
});

const { response, stream } = await ai.generateStream({
  prompt: 'Suggest a complete menu for a pirate themed restaurant.',
  output: { schema: MenuSchema },
});

for await (const chunk of stream) {
  // `output` is an object representing the entire output so far.
  console.log(chunk.output);
}

// Get the completed output.
const { output } = await response;
Der Streaming von strukturierten Daten funktioniert etwas anders als der Streaming von Text: Die output-Eigenschaft eines Antwort-Chunks ist ein Objekt, das aus der Ansammlung der bisher erstellten Chunks erstellt wird, und kein Objekt, das einen einzelnen Chunk darstellt, der möglicherweise nicht für sich allein gültig ist. Jeder Block strukturierter Ausgabe ersetzt in gewisser Weise den vorherigen Block.

Die ersten fünf Ausgaben aus dem vorherigen Beispiel könnten beispielsweise so aussehen:


null

{ starters: [ {} ] }

{
  starters: [ { name: "Captain's Treasure Chest", description: 'A' } ]
}

{
  starters: [
    {
      name: "Captain's Treasure Chest",
      description: 'A mix of spiced nuts, olives, and marinated cheese served in a treasure chest.',
      calories: 350
    }
  ]
}

{
  starters: [
    {
      name: "Captain's Treasure Chest",
      description: 'A mix of spiced nuts, olives, and marinated cheese served in a treasure chest.',
      calories: 350,
      allergens: [Array]
    },
    { name: 'Shipwreck Salad', description: 'Fresh' }
  ]
}
Multimodale Eingabe
In den bisherigen Beispielen wurden Textstrings als Prompts für das Modell verwendet. Dies ist zwar die gängigste Methode, um generative KI-Modelle zu steuern, aber viele Modelle können auch andere Medien als Prompts akzeptieren. Medien-Prompts werden am häufigsten in Kombination mit Text-Prompts verwendet, die das Modell anweisen, eine bestimmte Aktion an den Medien auszuführen, z. B. ein Bild zu beschriften oder eine Audioaufnahme zu transkribieren.

Ob Medieneingabe akzeptiert wird und welche Medientypen verwendet werden können, hängt vollständig vom Modell und seiner API ab. Die Gemini 1.5-Modellreihe kann beispielsweise Bilder, Video und Audio als Prompts akzeptieren.

Wenn Sie einem Modell, das dies unterstützt, einen Medien-Prompt geben möchten, übergeben Sie anstelle eines einfachen Text-Prompts an generate ein Array, das aus einem Medien- und einem Textteil besteht:


const { text } = await ai.generate([
  { media: { url: 'https://example.com/photo.jpg' } },
  { text: 'Compose a poem about this image.' },
]);
Im obigen Beispiel haben Sie ein Bild mit einer öffentlich zugänglichen HTTPS-URL angegeben. Du kannst Mediendaten auch direkt übergeben, indem du sie als Daten-URL codierst. Beispiel:


import { readFile } from 'node:fs/promises';

const b64Data = await readFile('photo.jpg', { encoding: 'base64url' });
const dataUrl = `data:image/jpeg;base64,${b64Data}`;

const { text } = await ai.generate([
  { media: { url: dataUrl } },
  { text: 'Compose a poem about this image.' },
]);
Alle Modelle, die Medieneingabe unterstützen, unterstützen sowohl Daten- als auch HTTPS-URLs. Einige Modell-Plug-ins bieten Unterstützung für andere Medienquellen. Mit dem Vertex AI-Plug-in können Sie beispielsweise Cloud Storage-URLs (gs://) verwenden.

Medien generieren
Bisher ging es in den meisten Beispielen auf dieser Seite um die Generierung von Text mithilfe von LLMs. Genkit kann jedoch auch mit Modellen zur Bildgenerierung verwendet werden. Die Verwendung von generate() mit einem Modell zur Bildgenerierung ähnelt der Verwendung eines LLM. So generieren Sie beispielsweise ein Bild mit dem Imagen2-Modell über Vertex AI:

Genkit verwendet data:-URLs als Standardausgabeformat für generierte Medien. Das ist ein Standardformat, für das viele Bibliotheken zur Verfügung stehen. In diesem Beispiel wird das data-urls-Paket von jsdom verwendet:


npm i --save data-urls
npm i --save-dev @types/data-urls
Wenn Sie ein Bild generieren und in einer Datei speichern möchten, rufen Sie generate() auf und geben Sie ein Bildgenerierungsmodell und den Medientyp des Ausgabeformats an:


import { imagen3Fast, vertexAI } from '@genkit-ai/vertexai';
import parseDataURL from 'data-urls';
import { genkit } from 'genkit';

import { writeFile } from 'node:fs/promises';

const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' })],
});

(async () => {
  const { media } = await ai.generate({
    model: imagen3Fast,
    prompt: 'photo of a meal fit for a pirate',
    output: { format: 'media' },
  });

  if (media === null) throw new Error('No media generated.');

  const data = parseDataURL(media.url);
  if (data === null) throw new Error('Invalid "data:" URL.');

  await writeFile(`output.${data.mimeType.subtype}`, data.body);
})();
Nächste Schritte
Weitere Informationen zu Genkit
Als App-Entwickler können Sie die Ausgabe von generativen KI-Modellen hauptsächlich über Prompts beeinflussen. Im Artikel Prompt-Verwaltung erfahren Sie, wie Sie mit Genkit effektive Prompts entwickeln und in Ihrer Codebasis verwalten können.
generate() ist zwar der Kern jeder Anwendung mit generativer KI, aber in der Praxis sind vor und nach dem Aufruf eines generativen KI-Modells in der Regel zusätzliche Arbeiten erforderlich. Aus diesem Grund führt Genkit das Konzept von Abläufen ein, die wie Funktionen definiert sind, aber zusätzliche Funktionen wie Beobachtbarkeit und vereinfachte Bereitstellung bieten. Weitere Informationen finden Sie unter Workflows definieren.
Erweiterte LLM-Nutzung
Eine Möglichkeit, die Funktionen von LLMs zu verbessern, besteht darin, ihnen eine Liste mit Möglichkeiten zur Verfügung zu stellen, wie sie weitere Informationen von Ihnen anfordern oder Sie um eine bestimmte Aktion bitten können. Dies wird als Toolaufruf oder Funktionsaufruf bezeichnet. Modelle, die für diese Funktion trainiert wurden, können auf einen Prompt mit einer speziell formatierten Antwort reagieren, die der aufrufenden Anwendung angibt, dass sie eine Aktion ausführen und das Ergebnis zusammen mit dem ursprünglichen Prompt an das LLM zurücksenden soll. Genkit bietet Bibliotheksfunktionen, die sowohl die Promptgenerierung als auch die Call-Response-Schleifenelemente eines Tools automatisieren, das eine Implementierung aufruft. Weitere Informationen finden Sie unter Tools aufrufen.
Die Retrieval-Augmented Generation (RAG) ist eine Methode, mit der domänenspezifische Informationen in die Ausgabe eines Modells eingefügt werden. Dazu werden relevante Informationen in einen Prompt eingefügt, bevor er an das Sprachmodell übergeben wird. Für eine vollständige RAG-Implementierung müssen mehrere Technologien kombiniert werden: Modelle zur Generierung von Text-Embeddings, Vektordatenbanken und Large Language Models. Unter Retrieval-Augmented Generation (RAG) erfahren Sie, wie Genkit die Koordination dieser verschiedenen Elemente vereinfacht.
Modellausgabe testen
Als Softwareentwickler sind Sie an deterministische Systeme gewöhnt, bei denen dieselbe Eingabe immer dieselbe Ausgabe liefert. Da KI-Modelle jedoch probabilistisch sind, kann die Ausgabe je nach subtilen Nuancen in der Eingabe, den Trainingsdaten des Modells und sogar der Zufälligkeit variieren, die durch Parameter wie die Temperatur absichtlich eingeführt wird.

Die Bewertungstools von Genkit sind strukturierte Methoden zur Bewertung der Qualität der Antworten Ihres LLM mithilfe verschiedener Strategien. Weitere Informationen finden Sie auf der Seite Bewertung.