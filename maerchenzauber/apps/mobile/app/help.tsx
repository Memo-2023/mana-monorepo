import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import CommonHeader from '../components/molecules/CommonHeader';
import { Feather } from '@expo/vector-icons';

interface HelpCategory {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  articles: HelpArticle[];
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
}

const helpData: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Erste Schritte',
    icon: 'compass',
    articles: [
      {
        id: 'welcome',
        title: 'Willkommen bei Märchenzauber',
        content: 'Märchenzauber ist deine App für magische, personalisierte Kindergeschichten. Erstelle einzigartige Charaktere und lass KI wunderschöne illustrierte Geschichten für dich schreiben.',
      },
      {
        id: 'how-to-start',
        title: 'Wie starte ich?',
        content: '1. Erstelle zunächst einen Charakter - entweder aus einer Beschreibung oder einem Foto\n2. Wähle deinen Charakter aus und beschreibe deine Geschichte\n3. Warte wenige Minuten, während die KI deine Geschichte schreibt und illustriert\n4. Genieße deine persönliche Geschichte!',
      },
    ],
  },
  {
    id: 'characters',
    title: 'Charaktere',
    icon: 'users',
    articles: [
      {
        id: 'create-character',
        title: 'Charakter erstellen',
        content: 'Du kannst Charaktere auf zwei Arten erstellen:\n\n• Aus einer Beschreibung: Beschreibe einfach, wie dein Charakter aussehen soll\n• Aus einem Foto: Lade ein Foto hoch und die KI erstellt einen passenden Charakter',
      },
      {
        id: 'character-consistency',
        title: 'Konstante Charaktere',
        content: 'Alle Bilder deines Charakters werden konsistent generiert - dein Charakter sieht in jeder Geschichte gleich aus. Das macht es perfekt für wiederkehrende Geschichten mit demselben Helden.',
      },
      {
        id: 'character-prompts',
        title: 'Gute Charakter-Beschreibungen',
        content: '✅ Gut - Sei spezifisch:\n"Ein kleiner Drache mit grünen Schuppen, großen blauen Augen und kleinen orangenen Flügeln"\n\n"Ein freundliches Einhorn mit rosa Mähne, goldenem Horn und Sternenflecken am Körper"\n\n❌ Zu vage:\n"Ein süßes Tier"\n"Ein Mädchen"\n\nTipps:\n• Beschreibe Farben und Merkmale\n• Nenne charakteristische Details\n• Denke an den Stil (niedlich, realistisch, etc.)',
      },
    ],
  },
  {
    id: 'stories',
    title: 'Geschichten',
    icon: 'book-open',
    articles: [
      {
        id: 'create-story',
        title: 'Geschichte erstellen',
        content: 'So erstellst du eine Geschichte:\n\n1. Wähle einen Charakter\n2. Beschreibe, was in der Geschichte passieren soll (z.B. "Ein Abenteuer im Zauberwald")\n3. Die KI generiert automatisch:\n   • 10 Seiten Text\n   • Passende Illustrationen\n   • Deutsche und englische Version',
      },
      {
        id: 'story-prompts',
        title: 'Gute Geschichten-Beschreibungen',
        content: '✅ Gute Beispiele:\n\n"Mein Charakter findet einen magischen Schlüssel und erkundet ein verzaubertes Schloss"\n\n"Ein Abenteuer am Strand, wo mein Charakter sprechende Muscheln entdeckt und eine Meerjungfrau trifft"\n\n"Mein Charakter rettet ein verlorenes Einhorn im dunklen Wald"\n\n❌ Zu kurz:\n"Eine Geschichte"\n"Abenteuer"\n\nTipps:\n• Nenne einen Ort (Wald, Schloss, Stadt)\n• Beschreibe eine Herausforderung oder Aufgabe\n• Erwähne andere Charaktere oder Kreaturen\n• Halte es einfach - die KI fügt Details hinzu',
      },
      {
        id: 'story-pages',
        title: 'Geschichtenseiten',
        content: 'Jede Geschichte hat 10 wunderschön illustrierte Seiten. Wische nach links/rechts, um durch die Seiten zu blättern. Jede Seite enthält Text und ein passendes Bild.',
      },
      {
        id: 'archive-stories',
        title: 'Geschichten archivieren',
        content: 'Alte Geschichten kannst du archivieren:\n\n1. Öffne die Geschichte\n2. Tippe auf das Archiv-Symbol\n3. Die Geschichte wird ins Archiv verschoben\n\nArchivierte Geschichten findest du in den Einstellungen unter "Archiv".',
      },
    ],
  },
  {
    id: 'credits',
    title: 'Mana & Credits',
    icon: 'zap',
    articles: [
      {
        id: 'what-is-mana',
        title: 'Was ist Mana?',
        content: 'Mana ist deine kreative Energiewährung. Du brauchst Mana, um Geschichten zu generieren und Charaktere zu erstellen.\n\n• Story Generation: 100 Mana\n• Charakter Erstellung: 30 Mana',
      },
      {
        id: 'get-mana',
        title: 'Mana bekommen',
        content: 'Du kannst Mana auf zwei Arten bekommen:\n\n📅 Abonnements (monatlich):\n• Free: 150 Mana/Monat (kostenlos)\n• Small: 600 Mana für 5,99€/Monat\n• Medium: 1500 Mana für 14,99€/Monat\n• Large: 3000 Mana für 29,99€/Monat\n• Giant: 5000 Mana für 49,99€/Monat\n\n💎 Einmal-Pakete:\n• Small Potion: 350 Mana für 4,99€\n• Medium Potion: 700 Mana für 9,99€\n• Large Potion: 1400 Mana für 19,99€\n• Giant Potion: 2800 Mana für 39,99€',
      },
      {
        id: 'mana-costs',
        title: 'Was kostet wie viel Mana?',
        content: '📖 Story Generation: 100 Mana\n• 10 illustrierte Seiten\n• Deutsche und englische Version\n• Hochwertige KI-Generierung\n\n👤 Charakter Erstellung: 30 Mana\n• Mehrere konsistente Bilder\n• Aus Beschreibung oder Foto\n\nBeispiel: Mit dem kostenlosen Plan (150 Mana/Monat) kannst du 1 Geschichte + 1 Charakter erstellen oder 5 Charaktere ohne Geschichte.',
      },
    ],
  },
  {
    id: 'tips',
    title: 'Tipps & Best Practices',
    icon: 'lightbulb',
    articles: [
      {
        id: 'prompt-basics',
        title: 'Grundlagen guter Prompts',
        content: '🎯 Die Formel für gute Prompts:\n\n1. WER: Dein Charakter (automatisch ausgewählt)\n2. WAS: Die Handlung/das Abenteuer\n3. WO: Der Ort/die Umgebung\n4. WARUM/WIE: Das Ziel oder die Herausforderung\n\nBeispiel:\n"Mein Charakter (WER) sucht einen verlorenen Schatz (WAS) in einer alten Pyramide (WO) und muss Rätsel lösen (WIE)"',
      },
      {
        id: 'prompt-themes',
        title: 'Beliebte Themen',
        content: '🌟 Magische Welten:\n• Zauberwald mit sprechenden Tieren\n• Unterwasserabenteuer mit Meeresbewohnern\n• Wolkenschloss mit fliegenden Kreaturen\n\n🏰 Abenteuer:\n• Schatzsuche in alten Ruinen\n• Rettungsmission für Freunde\n• Zeitreise in die Vergangenheit\n\n🎪 Alltag mit Twist:\n• Erster Schultag in einer Zauberschule\n• Haustier wird lebendig und kann sprechen\n• Geheime Tür im Kinderzimmer\n\n🌈 Lerngeschichten:\n• Freundschaft und Zusammenarbeit\n• Mut und Selbstvertrauen\n• Kreativität und Problemlösung',
      },
      {
        id: 'prompt-donts',
        title: 'Was du vermeiden solltest',
        content: '❌ Vermeide:\n\n• Zu komplexe Handlungen mit vielen Wendungen\n• Sehr spezifische Details ("genau 7 rote Blumen")\n• Zu dunkle oder gruselige Themen\n• Namen von bekannten Marken/Charakteren\n\n✅ Besser:\n\n• Einfache, klare Handlung\n• Beschreibende Details ("viele bunte Blumen")\n• Positive, altersgerechte Themen\n• Originale Ideen und Charaktere\n\nDie KI fügt automatisch passende Details hinzu!',
      },
      {
        id: 'creative-ideas',
        title: 'Kreative Ideen',
        content: '💡 Inspirierende Ausgangspunkte:\n\n📚 Klassiker neu interpretiert:\n• "Rotkäppchen trifft auf freundliche Wölfe"\n• "Hänsel und Gretel im Weltraum"\n\n🎨 Ungewöhnliche Kombinationen:\n• "Ein Roboter lernt Gefühle durch Musik"\n• "Ein Drache, der Angst vor Feuer hat"\n\n🌍 Verschiedene Settings:\n• "Abenteuer in einer Spielzeugstadt"\n• "Reise durch ein Gemälde"\n• "Safari im Garten (winzig klein)"\n\n🎭 Charakterentwicklung:\n• "Schüchterner Charakter wird zum Helden"\n• "Lernt eine neue Fähigkeit"\n• "Findet einen unerwarteten Freund"',
      },
      {
        id: 'age-appropriate',
        title: 'Altersgerechte Geschichten',
        content: '👶 3-5 Jahre:\n• Einfache Handlung mit 1-2 Ereignissen\n• Bekannte Orte (Garten, Haus, Park)\n• Klare Gut-Böse-Unterscheidung\n• Beispiel: "Mein Charakter hilft einem verlorenen Kätzchen nach Hause zu finden"\n\n🧒 6-8 Jahre:\n• Abenteuer mit kleinen Herausforderungen\n• Fantasy-Elemente\n• Freundschaftsthemen\n• Beispiel: "Mein Charakter entdeckt eine magische Tür und findet neue Freunde"\n\n👦 9-12 Jahre:\n• Komplexere Plots\n• Moralische Dilemmata\n• Teamwork und Strategie\n• Beispiel: "Mein Charakter muss mit Rivalen zusammenarbeiten, um das Dorf zu retten"',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Einstellungen',
    icon: 'settings',
    articles: [
      {
        id: 'archive',
        title: 'Archiv',
        content: 'Im Archiv findest du alle deine archivierten Geschichten. Du kannst sie jederzeit wieder aktivieren oder endgültig löschen.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Fehlerbehebung',
    icon: 'alert-circle',
    articles: [
      {
        id: 'generation-fails',
        title: 'Generierung schlägt fehl',
        content: 'Wenn die Generierung fehlschlägt:\n\n1. Prüfe deine Internetverbindung\n2. Stelle sicher, dass du genug Mana hast\n3. Versuche es erneut\n4. Wenn das Problem weiterhin besteht, kontaktiere den Support',
      },
      {
        id: 'images-not-loading',
        title: 'Bilder laden nicht',
        content: 'Wenn Bilder nicht laden:\n\n1. Prüfe deine Internetverbindung\n2. Schließe die App und öffne sie erneut\n3. Warte einen Moment - große Bilder brauchen Zeit\n4. Bei anhaltenden Problemen: App neu installieren',
      },
      {
        id: 'feedback',
        title: 'Problem melden',
        content: 'Du kannst uns jederzeit Feedback geben:\n\n1. Gehe zu Einstellungen\n2. Tippe auf "Feedback geben"\n3. Beschreibe dein Problem oder deinen Vorschlag\n4. Wir melden uns so schnell wie möglich',
      },
    ],
  },
];

export default function Help() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const { width: screenWidth } = Dimensions.get('window');
  const isWideScreen = screenWidth > 1000;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setExpandedArticle(null); // Close any open article when switching categories
  };

  const toggleArticle = (articleId: string) => {
    setExpandedArticle(expandedArticle === articleId ? null : articleId);
  };

  const dynamicStyles = {
    container: {
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center' as const,
      paddingHorizontal: isWideScreen ? 0 : 20,
    },
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CommonHeader
        title="Hilfe"
        showBackButton
        onBack={() => router.back()}
      />
      <View style={[styles.container, dynamicStyles.container]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            <Text style={styles.description}>
              Hier findest du Antworten auf die häufigsten Fragen zu Märchenzauber.
            </Text>

            {helpData.map((category) => (
              <View key={category.id} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryTitleContainer}>
                    <Feather name={category.icon} size={24} color="#FFD700" style={styles.categoryIcon} />
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                  </View>
                  <Feather
                    name={expandedCategory === category.id ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#FFD700"
                  />
                </TouchableOpacity>

                {expandedCategory === category.id && (
                  <View style={styles.articlesContainer}>
                    {category.articles.map((article) => (
                      <View key={article.id} style={styles.articleContainer}>
                        <TouchableOpacity
                          style={styles.articleHeader}
                          onPress={() => toggleArticle(article.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.articleTitle}>{article.title}</Text>
                          <Feather
                            name={expandedArticle === article.id ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#999"
                          />
                        </TouchableOpacity>

                        {expandedArticle === article.id && (
                          <Text style={styles.articleContent}>{article.content}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Hast du weitere Fragen?
              </Text>
              <TouchableOpacity
                style={styles.feedbackButton}
                onPress={() => router.push('/feedback')}
                activeOpacity={0.7}
              >
                <Feather name="message-circle" size={20} color="#FFD700" />
                <Text style={styles.feedbackButtonText}>Feedback geben</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 100,
    paddingBottom: 40,
  },
  scrollContent: {
    flexGrow: 1,
  },
  description: {
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
    lineHeight: 24,
  },
  categoryContainer: {
    marginBottom: 16,
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  articlesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  articleContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 52, // Indent to align with category title
  },
  articleTitle: {
    fontSize: 16,
    color: '#CCCCCC',
    flex: 1,
  },
  articleContent: {
    fontSize: 15,
    color: '#999',
    lineHeight: 22,
    paddingHorizontal: 52,
    paddingBottom: 16,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  feedbackButtonText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
});
