import { Author } from '../../contentLoader';

export const authorsDE: Author[] = [
	{
		id: 'einstein-albert',
		name: 'Albert Einstein',
		profession: ['Theoretical Physicist', 'Philosopher', 'Humanitarian'],
		biography: {
			short:
				'Theoretischer Physiker, der die Relativitätstheorie entwickelte und den Nobelpreis für Physik erhielt.',
			long: 'Albert Einstein revolutionierte unser Verständnis von Raum, Zeit, Gravitation und dem Universum. Seine Relativitätstheorie und die Formel E=mc² gehören zu den bekanntesten wissenschaftlichen Erkenntnissen.',
			sections: {
				earlyLife: {
					title: 'Kindheit und Ausbildung (1879-1900)',
					content:
						'Geboren in Ulm, wuchs in München auf. Entgegen der Legende war er ein guter Schüler, der früh mathematische Begabung zeigte. Studierte am Polytechnikum Zürich, wo er seine spätere Frau Mileva Marić kennenlernte.',
				},
				patentClerk: {
					title: 'Patentamt und Wunderjahr (1900-1909)',
					content:
						"Arbeitete als technischer Experte im Berner Patentamt. 1905, sein 'Annus Mirabilis', veröffentlichte er fünf revolutionäre Arbeiten: über Brownsche Bewegung, Photoeffekt, spezielle Relativitätstheorie und die berühmte Formel E=mc².",
				},
				professor: {
					title: 'Universitätslaufbahn (1909-1914)',
					content:
						'Professuren in Zürich und Prag, entwickelte die allgemeine Relativitätstheorie. 1914 Rückkehr nach Deutschland als Direktor des Kaiser-Wilhelm-Instituts für Physik in Berlin.',
				},
				worldFame: {
					title: 'Weltberühmtheit (1914-1933)',
					content:
						'1919 bestätigte eine Sonnenfinsternis seine Theorie - er wurde über Nacht weltberühmt. Erhielt 1921 den Nobelpreis für den photoelektrischen Effekt. Engagierte sich für Pazifismus und gegen Antisemitismus.',
				},
				america: {
					title: 'Exil und späte Jahre (1933-1955)',
					content:
						"Floh vor den Nazis in die USA, Princeton Institute for Advanced Study. Suchte vergeblich nach einer 'Weltformel'. Warnte vor Atomwaffen, obwohl sein Brief an Roosevelt das Manhattan-Projekt anstieß.",
				},
			},
			keyAchievements: [
				'Spezielle und allgemeine Relativitätstheorie',
				'Nobelpreis für Physik (1921)',
				'Formel E=mc²',
				'Grundlagen der Quantenmechanik',
				'Engagement für Frieden und Menschenrechte',
			],
			famousQuote: 'Phantasie ist wichtiger als Wissen, denn Wissen ist begrenzt.',
		},
		lifespan: {
			birth: '1879-03-14',
			death: '1955-04-18',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/19191125_A_New_Physics_Based_on_Einstein_-_The_New_York_Times.png/330px-19191125_A_New_Physics_Based_on_Einstein_-_The_New_York_Times.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/19191125_A_New_Physics_Based_on_Einstein_-_The_New_York_Times.png/330px-19191125_A_New_Physics_Based_on_Einstein_-_The_New_York_Times.png',
			credit: 'RCraig09',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'saint-exupery-antoine',
		name: 'Antoine de Saint-Exupéry',
		profession: ['Writer', 'Pilot', 'Poet'],
		biography: {
			short: "Französischer Schriftsteller und Pilot, bekannt für 'Der kleine Prinz'.",
			sections: {
				aviator: {
					title: 'Pionier der Luftfahrt (1921-1931)',
					content:
						"Begann als Postpilot bei der Compagnie Latécoère. Flog gefährliche Routen über Afrika und Südamerika. Diese Erfahrungen inspirierten seine ersten Bücher 'Südkurier' und 'Nachtflug'.",
				},
				writer: {
					title: 'Schriftsteller und Journalist (1931-1939)',
					content:
						"Wurde durch 'Wind, Sand und Sterne' weltberühmt. Arbeitete als Journalist und Kriegsberichterstatter. Seine poetische Prosa verband Abenteuer mit philosophischen Reflexionen über Menschlichkeit.",
				},
				war: {
					title: 'Zweiter Weltkrieg (1939-1943)',
					content:
						"Diente als Aufklärungspilot, wurde bei der Niederlage Frankreichs nach New York versetzt. In der Emigration schrieb er 'Der kleine Prinz' (1943), sein Meisterwerk über Freundschaft und die Essenz des Menschseins.",
				},
				lastFlight: {
					title: 'Letzter Flug (1944)',
					content:
						'Kehrte trotz seines Alters zum Militärdienst zurück. Verschwand bei einem Aufklärungsflug über dem Mittelmeer. Sein Flugzeugwrack wurde erst 2004 gefunden. Starb als Held und Poet.',
				},
			},
			keyAchievements: [
				"Autor von 'Der kleine Prinz'",
				'Pionierpilot der Postluftfahrt',
				'Kriegsberichterstatter und Philosoph',
				'Meister der poetischen Prosa',
				'Symbol für Mut und Menschlichkeit',
			],
			famousQuote:
				'Man sieht nur mit dem Herzen gut. Das Wesentliche ist für die Augen unsichtbar.',
		},
		lifespan: {
			birth: '1900-06-29',
			death: '1944-07-31',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'adenauer-konrad',
		name: 'Konrad Adenauer',
		profession: ['Politician', 'Chancellor', 'Statesman'],
		biography: {
			short: 'Erster Bundeskanzler der Bundesrepublik Deutschland und Mitbegründer der CDU.',
			long: 'Konrad Adenauer prägte die deutsche Nachkriegsgeschichte wie kaum ein anderer Politiker. Als erster Bundeskanzler führte er die junge Bundesrepublik in die westliche Staatengemeinschaft.',
			sections: {
				earlyLife: {
					title: 'Frühe Jahre (1876-1917)',
					content:
						'Geboren in Köln als drittes von fünf Kindern einer katholischen Beamtenfamilie. Studium der Rechtswissenschaften und Volkswirtschaft in Freiburg, München und Bonn. 1906 Eintritt in die Zentrumspartei und Beginn seiner politischen Karriere in Köln.',
				},
				riseToProminence: {
					title: 'Oberbürgermeister von Köln (1917-1933)',
					content:
						'Mit nur 41 Jahren wurde er zum Oberbürgermeister von Köln gewählt. In seiner Amtszeit modernisierte er die Stadt, gründete die Universität zu Köln neu und baute die Infrastruktur aus. 1933 von den Nationalsozialisten aus dem Amt entfernt.',
				},
				darkYears: {
					title: 'NS-Zeit und Verfolgung (1933-1945)',
					content:
						'Während der NS-Diktatur lebte Adenauer zurückgezogen und wurde mehrfach verhaftet. Nach dem gescheiterten Attentat vom 20. Juli 1944 wurde er erneut inhaftiert. Diese Zeit prägte sein Misstrauen gegenüber totalitären Systemen.',
				},
				chancellor: {
					title: 'Bundeskanzler (1949-1963)',
					content:
						'Als 73-Jähriger wurde er zum ersten Bundeskanzler gewählt. Seine 14-jährige Amtszeit war geprägt von Westbindung, Wirtschaftswunder und europäischer Integration. Er setzte die Wiederbewaffnung durch und erreichte 1955 die Souveränität der Bundesrepublik.',
				},
				legacy: {
					title: 'Vermächtnis',
					content:
						'Adenauer gilt als Architekt der deutschen Demokratie und Wegbereiter der europäischen Einigung. Seine Politik der Westintegration legte den Grundstein für Deutschlands Rolle in der NATO und EU. Berühmt für seinen trockenen Humor und seine Weitsicht.',
				},
			},
			keyAchievements: [
				'Gründung der CDU (1945)',
				'Westintegration der Bundesrepublik',
				'Deutsch-Französische Aussöhnung',
				'Wirtschaftswunder unter Ludwig Erhard',
			],
			famousQuote:
				'Wir leben alle unter dem gleichen Himmel, aber wir haben nicht alle den gleichen Horizont.',
		},
		lifespan: {
			birth: '1876-01-05',
			death: '1967-04-19',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'konfuzius',
		name: 'Konfuzius',
		profession: ['Philosopher', 'Teacher', 'Politician'],
		biography: {
			short: 'Chinesischer Philosoph, dessen Lehren die Grundlage des Konfuzianismus bilden.',
			sections: {
				teacher: {
					title: 'Der große Lehrer (527-497 v.Chr.)',
					content:
						"Eröffnete die erste private Schule Chinas, lehrte gegen geringes Entgelt jeden Schüler - unabhängig von Herkunft. Entwickelte revolutionäre pädagogische Methoden: 'Lernen ohne Denken ist nutzlos, Denken ohne Lernen ist gefährlich.'",
				},
				politician: {
					title: 'Kurze politische Laufbahn (497-484 v.Chr.)',
					content:
						'Diente als Beamter und Minister im Staat Lu. Träumte von einer Rückkehr zur goldenen Vergangenheit der Zhou-Dynastie. Enttäuscht von der Politik, verließ er Lu und wanderte 14 Jahre durch China.',
				},
				wanderer: {
					title: 'Wanderjahre und Lehre (484-479 v.Chr.)',
					content:
						"Reiste von Hof zu Hof, suchte Herrscher, die seine Ideale umsetzen würden. Fand wenig Gehör, aber sammelte treue Schüler. Lehrte die 'Fünf Konstanten': Menschlichkeit, Gerechtigkeit, Sittlichkeit, Weisheit, Vertrauen.",
				},
				legacy: {
					title: 'Vermächtnis des Meisters',
					content:
						"Seine Schüler sammelten seine Lehren in den 'Analekten'. Der Konfuzianismus wurde zur Staatsphilosophie und prägte 2000 Jahre chinesische Zivilisation. Seine Betonung von Bildung, Familie und sozialer Ordnung wirkt bis heute.",
				},
			},
			keyAchievements: [
				'Begründung des Konfuzianismus',
				'Erste private Schule Chinas',
				'Die Analekten als Grundlagenwerk',
				'Betonung von Bildung für alle',
				'Ethik der sozialen Harmonie',
			],
			famousQuote: 'Der Weg ist das Ziel.',
		},
		lifespan: {
			birth: '-551',
			death: '-479',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Cao_Pi_Tang.jpg/330px-Cao_Pi_Tang.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Cao_Pi_Tang.jpg/330px-Cao_Pi_Tang.jpg',
			credit: 'Jappalang',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'brecht-bertolt',
		name: 'Bertolt Brecht',
		profession: ['Playwright', 'Poet', 'Theatre Director'],
		biography: {
			short: 'Deutscher Dramatiker, Lyriker und Begründer des epischen Theaters.',
			sections: {
				weimar: {
					title: 'Weimarer Jahre (1918-1933)',
					content:
						"Zog nach Berlin, wurde Teil der avantgardistischen Szene. 1928 Durchbruch mit der 'Dreigroschenoper' und Kurt Weill. Entwickelte das 'epische Theater' - Zuschauer sollen denken, nicht nur fühlen. Wurde zum Kommunisten.",
				},
				exile: {
					title: 'Exil und Flucht (1933-1947)',
					content:
						"Floh vor den Nazis über Europa nach Amerika. Lebte in Dänemark, Finnland, schließlich Hollywood. Schrieb seine Hauptwerke: 'Mutter Courage', 'Der gute Mensch von Sezuan', 'Der kaukasische Kreidekreis'.",
				},
				return: {
					title: 'Rückkehr nach Deutschland (1947-1949)',
					content:
						'Kehrte nach Deutschland zurück, entschied sich für die DDR. Gründete 1949 das Berliner Ensemble mit seiner Frau Helene Weigel. Wollte das Theater als Instrument der gesellschaftlichen Veränderung nutzen.',
				},
				master: {
					title: 'Meister des Theaters (1949-1956)',
					content:
						'Das Berliner Ensemble wurde weltberühmt. Brechts Verfremdungseffekt revolutionierte das Theater global. Erhielt 1955 den Stalin-Friedenspreis. Starb 1956 an Herzinfarkt, hinterließ ein neues Theaterverständnis.',
				},
			},
			keyAchievements: [
				'Begründung des epischen Theaters',
				'Die Dreigroschenoper (1928)',
				'Mutter Courage und ihre Kinder',
				'Berliner Ensemble',
				'Verfremdungseffekt als Theatermethode',
			],
			famousQuote: 'Wer kämpft, kann verlieren. Wer nicht kämpft, hat schon verloren.',
		},
		lifespan: {
			birth: '1898-02-10',
			death: '1956-08-14',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'nietzsche-friedrich',
		name: 'Friedrich Nietzsche',
		profession: ['Philosopher', 'Poet', 'Composer'],
		biography: {
			short:
				'Deutscher Philosoph und klassischer Philologe, bekannt für seine Kritik der traditionellen Moral.',
			sections: {
				basel: {
					title: 'Basler Jahre (1869-1879)',
					content:
						"Lehrte klassische Philologie, freundete sich mit Richard Wagner an. Schrieb 'Die Geburt der Tragödie' und die 'Unzeitgemäßen Betrachtungen'. Gesundheitsprobleme zwangen ihn zur Aufgabe der Professur.",
				},
				wanderer: {
					title: 'Wanderjahre (1879-1889)',
					content:
						"Lebte als freier Schriftsteller in der Schweiz und Italien. Schuf seine Hauptwerke: 'Menschliches, Allzumenschliches', 'Die fröhliche Wissenschaft', 'Also sprach Zarathustra' und 'Jenseits von Gut und Böse'.",
				},
				zarathustra: {
					title: 'Zarathustra und der Übermensch',
					content:
						"Mit 'Also sprach Zarathustra' schuf er sein poetisches Meisterwerk. Entwickelte Konzepte wie den Übermenschen, die ewige Wiederkehr und den 'Tod Gottes'. Seine Philosophie forderte zur Selbstschöpfung auf.",
				},
				madness: {
					title: 'Zusammenbruch und Ende (1889-1900)',
					content:
						'1889 geistiger Zusammenbruch in Turin. Seine letzten elf Lebensjahre verbrachte er in geistiger Umnachtung, gepflegt von seiner Schwester Elisabeth. Starb 1900, seine Philosophie wurde erst posthum richtig verstanden.',
				},
			},
			keyAchievements: [
				"Autor von 'Also sprach Zarathustra'",
				'Entwicklung der Übermensch-Philosophie',
				'Kritik der christlichen Moral',
				'Konzept der ewigen Wiederkehr',
				'Einfluss auf Existentialismus und Postmoderne',
			],
			famousQuote: 'Was mich nicht umbringt, macht mich stärker.',
		},
		lifespan: {
			birth: '1844-10-15',
			death: '1900-08-25',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'wittgenstein-ludwig',
		name: 'Ludwig Wittgenstein',
		profession: ['Philosopher', 'Logician'],
		biography: {
			short:
				'Österreichisch-britischer Philosoph, einer der einflussreichsten Denker des 20. Jahrhunderts.',
			sections: {
				cambridge: {
					title: 'Cambridge und Russell (1911-1914)',
					content:
						"Wechselte zur Philosophie, studierte bei Bertrand Russell in Cambridge. Russell erkannte sein Genie: 'Er ist der vollkommenste Typus eines Genies, den ich je kennengelernt habe - leidenschaftlich, tiefgreifend, intensiv und beherrschend.'",
				},
				tractus: {
					title: 'Krieg und Tractus (1914-1921)',
					content:
						"Diente im Ersten Weltkrieg als Soldat, schrieb den 'Tractus logico-philosophicus' in den Schützengräben. Das Werk versucht die Grenzen der Sprache und damit des Denkbaren zu bestimmen. Glaubte, alle philosophischen Probleme gelöst zu haben.",
				},
				teacher: {
					title: 'Dorfschullehrer (1921-1929)',
					content:
						'Verschenkte sein Erbe und wurde Volksschullehrer in österreichischen Bergdörfern. Lebte asketisch und suchte nach einem sinnvollen Leben. Diese Zeit der praktischen Arbeit beeinflusste seine späte Philosophie.',
				},
				return: {
					title: 'Rückkehr zur Philosophie (1929-1951)',
					content:
						"Kehrte nach Cambridge zurück, entwickelte eine völlig neue Philosophie. Die 'Philosophischen Untersuchungen' zeigten, dass Sprache durch Gebrauch bestimmt wird. Starb 1951 mit den Worten: 'Sagt ihnen, ich hatte ein wundervolles Leben.'",
				},
			},
			keyAchievements: [
				'Tractus logico-philosophicus (1921)',
				'Philosophische Untersuchungen (posthum 1953)',
				'Begründung der analytischen Sprachphilosophie',
				'Konzept der Sprachspiele',
				'Zwei revolutionäre philosophische Systeme',
			],
			famousQuote: 'Wovon man nicht sprechen kann, darüber muss man schweigen.',
		},
		lifespan: {
			birth: '1889-04-26',
			death: '1951-04-29',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'descartes-rene',
		name: 'René Descartes',
		profession: ['Philosopher', 'Mathematician', 'Scientist'],
		biography: {
			short: 'Französischer Philosoph und Mathematiker, Begründer des modernen Rationalismus.',
			sections: {
				soldier: {
					title: 'Soldat und Weltreisender (1616-1628)',
					content:
						"Diente als Offizier in verschiedenen europäischen Armeen. 1619 die berühmte 'Ofenbank-Vision' in Deutschland: Erkannte die Einheit aller Wissenschaften durch mathematische Methodik. Reiste durch Europa, sammelte Erfahrungen.",
				},
				method: {
					title: 'Methodischer Zweifel (1628-1637)',
					content:
						"Zog sich in die Niederlande zurück, entwickelte seine philosophische Methode. Zweifelte an allem, bis er zum unhinterfragbaren 'Ich denke, also bin ich' gelangte. Schrieb 'Discours de la méthode' - Grundlage der modernen Wissenschaft.",
				},
				metaphysics: {
					title: 'Metaphysische Meditationen (1637-1649)',
					content:
						"Veröffentlichte seine 'Meditationes', begründete den Dualismus von Geist und Körper. Seine analytische Geometrie revolutionierte die Mathematik. Geriet in Konflikt mit Theologen, aber gewann internationale Anerkennung.",
				},
				sweden: {
					title: 'Schweden und Tod (1649-1650)',
					content:
						'Folgte der Einladung Königin Christinas nach Stockholm. Das harte nordische Klima und die frühen Morgenstunden der Philosophiestunden setzten ihm zu. Starb an Lungenentzündung, hinterließ die moderne Philosophie.',
				},
			},
			keyAchievements: [
				"'Cogito ergo sum' - Grundlage der Erkenntnistheorie",
				'Begründung des methodischen Zweifels',
				'Analytische Geometrie (Koordinatensystem)',
				'Dualismus von res extensa und res cogitans',
				'Vater der modernen Philosophie',
			],
			famousQuote: 'Ich denke, also bin ich.',
		},
		lifespan: {
			birth: '1596-03-31',
			death: '1650-02-11',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'goethe-johann',
		name: 'Johann Wolfgang von Goethe',
		profession: ['Poet', 'Writer', 'Scientist', 'Statesman'],
		biography: {
			short:
				'Deutscher Dichter und Naturforscher, einer der bedeutendsten Vertreter der Weltliteratur.',
			sections: {
				leipzig: {
					title: 'Studium und erste Liebe (1765-1771)',
					content:
						'Studierte Jura in Leipzig und Straßburg. Verliebte sich in Käthchen Schönkopf, erste große Liebe. Begegnung mit Herder in Straßburg prägte sein literarisches Schaffen. Entdeckte Shakespeare und Volksdichtung.',
				},
				werther: {
					title: 'Sturm und Drang (1771-1775)',
					content:
						"Zurück in Frankfurt, schrieb 'Die Leiden des jungen Werthers' - europäischer Bestseller, der die Romantik begründete. Unglückliche Liebe zu Charlotte Buff inspirierte den Roman. Wurde über Nacht berühmt.",
				},
				weimar: {
					title: 'Minister in Weimar (1775-1786)',
					content:
						'Folgte der Einladung des Herzogs Karl August nach Weimar. Wurde Minister, kümmerte sich um Bergbau, Straßenbau, Finanzen. Liebe zu Charlotte von Stein prägte diese Jahre. Begann naturwissenschaftliche Studien.',
				},
				italy: {
					title: 'Italienische Reise (1786-1788)',
					content:
						"Flucht nach Italien zur künstlerischen Erneuerung. 'Italienische Reise' dokumentiert diese Zeit. Wandte sich der Klassik zu, vollendete 'Egmont', arbeitete an 'Faust'. Entdeckung der Urpflanze in der Botanik.",
				},
				classic: {
					title: 'Weimarer Klassik (1788-1832)',
					content:
						"Rückkehr nach Weimar, Freundschaft mit Schiller ab 1794. Gemeinsam begründeten sie die deutsche Klassik. Vollendete 'Wilhelm Meisters Lehrjahre', 'Faust I' und naturwissenschaftliche Werke. Starb als 'Dichterfürst'.",
				},
			},
			keyAchievements: [
				'Faust - Hauptwerk der deutschen Literatur',
				'Die Leiden des jungen Werthers',
				'Begründer der Weimarer Klassik',
				'Naturwissenschaftliche Entdeckungen (Farbenlehre)',
				'Universalgenie und Dichterfürst',
			],
			famousQuote: 'Mehr Licht!',
		},
		lifespan: {
			birth: '1749-08-28',
			death: '1832-03-22',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'schopenhauer-arthur',
		name: 'Arthur Schopenhauer',
		profession: ['Philosopher'],
		biography: {
			short:
				'Deutscher Philosoph, Begründer einer pessimistischen Philosophie und Verfechter des Willens als Wesen der Welt.',
			sections: {
				studies: {
					title: 'Studium und Promotion (1809-1813)',
					content:
						"Studierte in Göttingen und Berlin Philosophie, Naturwissenschaften und Psychologie. 1813 Promotion mit 'Über die vierfache Wurzel des Satzes vom zureichenden Grunde'. Grundlagen für sein Hauptwerk gelegt.",
				},
				masterwork: {
					title: 'Die Welt als Wille und Vorstellung (1814-1818)',
					content:
						'Schrieb in Dresden sein Hauptwerk. Entwickelte die Philosophie, dass die Welt als Vorstellung nur Schein ist, dahinter aber der blinde, irrationale Wille als das wahre Wesen aller Dinge wirkt.',
				},
				isolation: {
					title: 'Ignoriert und verbittert (1818-1850)',
					content:
						'Sein Werk wurde zunächst ignoriert. Scheiterte als Dozent in Berlin, wo Hegel die Philosophie dominierte. Lebte zurückgezogen in Frankfurt, verbittert über die mangelnde Anerkennung seiner Philosophie.',
				},
				recognition: {
					title: 'Späte Anerkennung (1850-1860)',
					content:
						"Mit 'Parerga und Paralipomena' (1851) kam endlich der Durchbruch. Seine pessimistische Philosophie traf den Zeitgeist nach 1848. Beeinflusste Wagner, Nietzsche und die Literatur des fin de siècle.",
				},
			},
			keyAchievements: [
				'Die Welt als Wille und Vorstellung',
				'Begründung des philosophischen Pessimismus',
				'Einführung buddhistischer Gedanken in die westliche Philosophie',
				'Ästhetiktheorie des interesselosen Wohlgefallens',
				'Einfluss auf Nietzsche und Wagner',
			],
			famousQuote: 'Alles Wollen entspringt aus Mangel, also aus Leiden.',
		},
		lifespan: {
			birth: '1788-02-22',
			death: '1860-09-21',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'mandela-nelson',
		name: 'Nelson Mandela',
		profession: ['Politician', 'Activist', 'President'],
		biography: {
			short:
				'Südafrikanischer Politiker und Aktivist, erster schwarzer Präsident Südafrikas und Friedensnobelpreisträger.',
			sections: {
				lawyer: {
					title: 'Anwalt und Aktivist (1943-1962)',
					content:
						'Gründete 1952 die erste schwarze Anwaltskanzlei Südafrikas. Schloss sich dem ANC an, organisierte gewaltfreien Widerstand gegen Apartheid-Gesetze. Nach dem Massaker von Sharpeville 1960 Hinwendung zum bewaffneten Kampf.',
				},
				prisoner: {
					title: 'Gefängnis Robben Island (1962-1990)',
					content:
						"Verhaftet und zu lebenslanger Haft verurteilt. 27 Jahre auf Robben Island, wurde zum Symbol des Widerstands. Lehnte mehrfach Freilassung gegen politische Zugeständnisse ab: 'Gefangene können keine Verträge eingehen.'",
				},
				freedom: {
					title: 'Freilassung und Verhandlungen (1990-1994)',
					content:
						"1990 freigelassen, verhandelte mit Präsident de Klerk das Ende der Apartheid. Erhielt 1993 zusammen mit de Klerk den Friedensnobelpreis. Predigte Versöhnung statt Rache: 'Hass macht blind für alles andere.'",
				},
				president: {
					title: 'Präsident des Regenbogens (1994-1999)',
					content:
						"1994 erster schwarzer Präsident Südafrikas. Führte die 'Regenbogennation' in die Demokratie, gründete die Wahrheits- und Versöhnungskommission. Verzichtete nach einer Amtszeit auf die Macht - eine Seltenheit in Afrika.",
				},
			},
			keyAchievements: [
				'Ende der Apartheid in Südafrika',
				'Friedensnobelpreis (1993)',
				'Erster schwarzer Präsident Südafrikas',
				'Symbol für Versöhnung und Vergebung',
				'Inspiration für Menschenrechtsbewegungen weltweit',
			],
			famousQuote:
				'Bildung ist die mächtigste Waffe, die man verwenden kann, um die Welt zu verändern.',
		},
		lifespan: {
			birth: '1918-07-18',
			death: '2013-12-05',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'camus-albert',
		name: 'Albert Camus',
		profession: ['Writer', 'Philosopher', 'Journalist'],
		biography: {
			short:
				'Französisch-algerischer Schriftsteller und Philosoph, Vertreter des Existentialismus und Literaturnobelpreisträger.',
			sections: {
				paris: {
					title: 'Studium und erste Werke (1930-1940)',
					content:
						'Studierte Philosophie in Algier, schrieb über Augustinus. Gründete ein Amateurtheater, arbeitete als Journalist. Erkrankte an Tuberkulose - die Konfrontation mit dem Tod prägte seine Philosophie der Absurdität.',
				},
				resistance: {
					title: 'Widerstand und Durchbruch (1940-1945)',
					content:
						"Ging nach Paris, schloss sich der Résistance an, schrieb für die Untergrundzeitung 'Combat'. 1942 erschien 'Der Fremde' - ein Welterfolg. 'Der Mythos des Sisyphos' begründete seine Philosophie des Absurden.",
				},
				fame: {
					title: 'Weltberühmtheit (1945-1957)',
					content:
						"Wurde zu einem der führenden Intellektuellen Frankreichs. 'Die Pest' (1947) machte ihn weltberühmt. Brach mit Sartre wegen des Kommunismus. 1957 erhielt er den Literaturnobelpreis - mit 44 der zweitjüngste Preisträger.",
				},
				accident: {
					title: 'Tragischer Tod (1957-1960)',
					content:
						"Auf dem Höhepunkt seines Ruhms tödlicher Autounfall. Starb mit nur 46 Jahren. Hinterließ das unvollendete Manuskript 'Der erste Mensch'. Seine Philosophie des trotzigen Lebens inspiriert bis heute.",
				},
			},
			keyAchievements: [
				'Der Fremde (1942) - Klassiker der Weltliteratur',
				'Mythos des Sisyphos - Philosophie des Absurden',
				'Literaturnobelpreis 1957',
				'Die Pest - Allegorie auf das 20. Jahrhundert',
				'Symbol für intellektuellen Widerstand',
			],
			famousQuote: 'Es gibt nur ein wirklich ernstes philosophisches Problem: den Selbstmord.',
		},
		lifespan: {
			birth: '1913-11-07',
			death: '1960-01-04',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'bruckner-anton',
		name: 'Anton Bruckner',
		profession: ['Composer', 'Organist'],
		biography: {
			short:
				'Österreichischer Komponist und Organist, bekannt für seine neun Symphonien und religiösen Chorwerke.',
		},
		lifespan: {
			birth: '1824-09-04',
			death: '1896-10-11',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'churchill-winston',
		name: 'Winston Churchill',
		profession: ['Politician', 'Prime Minister', 'Writer'],
		biography: {
			short:
				'Britischer Staatsmann und Premierminister während des Zweiten Weltkriegs, Literaturnobelpreisträger.',
		},
		lifespan: {
			birth: '1874-11-30',
			death: '1965-01-24',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/0929_fc-churchill-halifax.jpg/330px-0929_fc-churchill-halifax.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/0929_fc-churchill-halifax.jpg/330px-0929_fc-churchill-halifax.jpg',
			credit: 'Remitamine',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'heraklit',
		name: 'Heraklit von Ephesos',
		profession: ['Philosopher'],
		biography: {
			short: 'Griechischer vorsokratischer Philosoph, bekannt für seine Lehre vom ewigen Wandel.',
		},
		lifespan: {
			birth: '-535',
			death: '-475',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'seneca',
		name: 'Lucius Annaeus Seneca',
		profession: ['Philosopher', 'Statesman', 'Dramatist'],
		biography: {
			short: 'Römischer Philosoph, Staatsmann und Dramatiker der stoischen Schule.',
		},
		lifespan: {
			birth: '4',
			death: '65',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'gandhi-mahatma',
		name: 'Mahatma Gandhi',
		profession: ['Lawyer', 'Political Leader', 'Activist'],
		biography: {
			short:
				'Indischer Rechtsanwalt, Widerstandskämpfer und Revolutionär, Führer der indischen Unabhängigkeitsbewegung.',
			sections: {
				london: {
					title: 'Studium in London (1888-1893)',
					content:
						'Studierte Jura in London, kämpfte mit der westlichen Kultur. Wurde Vegetarier aus Überzeugung, las die Bhagavad Gita und entdeckte Tolstoi. Kehrte als qualifizierter Anwalt nach Indien zurück.',
				},
				southAfrica: {
					title: 'Südafrika und Satyagraha (1893-1915)',
					content:
						"Erlebte Rassismus am eigenen Leib, entwickelte Satyagraha ('Festhalten an der Wahrheit'). Organisierte gewaltfreien Widerstand gegen diskriminierende Gesetze. Diese 21 Jahre formten den Mahatma ('Große Seele').",
				},
				independence: {
					title: 'Kampf um Unabhängigkeit (1915-1947)',
					content:
						'Führte Indien in die Unabhängigkeit durch gewaltfreien Widerstand. Salzmarsch 1930 erschütterte das Empire. Mehrfach inhaftiert, fastete für die Einheit. 1947 Unabhängigkeit, aber schmerzhafte Teilung in Indien und Pakistan.',
				},
				martyr: {
					title: 'Märtyrertod (1947-1948)',
					content:
						"Kämpfte gegen die religiöse Spaltung, fastete für Frieden zwischen Hindus und Muslimen. Am 30. Januar 1948 von einem Hindu-Nationalisten erschossen. Sterbende Worte: 'He Ram' (Oh Gott). Wurde zur globalen Ikone des Friedens.",
				},
			},
			keyAchievements: [
				'Entwicklung der Satyagraha (gewaltfreier Widerstand)',
				'Führer der indischen Unabhängigkeitsbewegung',
				'Salzmarsch 1930',
				'Inspiration für Martin Luther King Jr.',
				'Vorbild für gewaltfreie Revolutionen weltweit',
			],
			famousQuote: 'Sei du selbst die Veränderung, die du dir wünschst für diese Welt.',
		},
		lifespan: {
			birth: '1869-10-02',
			death: '1948-01-30',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'hugo-victor',
		name: 'Victor Hugo',
		profession: ['Writer', 'Poet', 'Dramatist'],
		biography: {
			short:
				"Französischer Schriftsteller der Romantik, bekannt für 'Les Misérables' und 'Der Glöckner von Notre-Dame'.",
		},
		lifespan: {
			birth: '1802-02-26',
			death: '1885-05-22',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Achille_Dev%C3%A9ria%2C_Victor_Hugo%2C_1829%2C_NGA_208390.jpg/330px-Achille_Dev%C3%A9ria%2C_Victor_Hugo%2C_1829%2C_NGA_208390.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Achille_Dev%C3%A9ria%2C_Victor_Hugo%2C_1829%2C_NGA_208390.jpg/330px-Achille_Dev%C3%A9ria%2C_Victor_Hugo%2C_1829%2C_NGA_208390.jpg',
			credit: 'Brwz',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'bacon-francis',
		name: 'Francis Bacon',
		profession: ['Philosopher', 'Statesman', 'Scientist'],
		biography: {
			short: 'Englischer Philosoph, Staatsmann und Wegbereiter der empirischen Wissenschaft.',
		},
		lifespan: {
			birth: '1561-01-22',
			death: '1626-04-09',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/18-year_old_Francis_Bacon.jpg/330px-18-year_old_Francis_Bacon.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/18-year_old_Francis_Bacon.jpg/330px-18-year_old_Francis_Bacon.jpg',
			credit: 'Liandrei',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'mazzini-giuseppe',
		name: 'Giuseppe Mazzini',
		profession: ['Politician', 'Revolutionary', 'Philosopher'],
		biography: {
			short: 'Italienischer Freiheitskämpfer und Politiker, Kämpfer für die italienische Einigung.',
		},
		lifespan: {
			birth: '1805-06-22',
			death: '1872-03-10',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/19092015-DSC_2848-2.JPG/330px-19092015-DSC_2848-2.JPG',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/19092015-DSC_2848-2.JPG/330px-19092015-DSC_2848-2.JPG',
			credit: 'Alex2015Genova',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'drucker-peter',
		name: 'Peter F. Drucker',
		profession: ['Management Consultant', 'Writer', 'Professor'],
		biography: {
			short:
				'Österreichisch-amerikanischer Managementberater und Autor, Vater des modernen Managements.',
		},
		lifespan: {
			birth: '1909-11-19',
			death: '2005-11-11',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Drucker5789.jpg/330px-Drucker5789.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Drucker5789.jpg/330px-Drucker5789.jpg',
			credit: 'VanWiel',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'twain-mark',
		name: 'Mark Twain',
		profession: ['Writer', 'Humorist', 'Entrepreneur'],
		biography: {
			short:
				"Amerikanischer Schriftsteller und Humorist, bekannt für 'Tom Sawyer' und 'Huckleberry Finn'.",
		},
		lifespan: {
			birth: '1835-11-30',
			death: '1910-04-21',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Autochrome_of_Mark_Twain.jpg/330px-Autochrome_of_Mark_Twain.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Autochrome_of_Mark_Twain.jpg/330px-Autochrome_of_Mark_Twain.jpg',
			credit: 'JayCubby',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'hippokrates',
		name: 'Hippokrates von Kos',
		profession: ['Physician', 'Teacher'],
		biography: {
			short:
				'Griechischer Arzt, Begründer der wissenschaftlichen Medizin und des hippokratischen Eides.',
		},
		lifespan: {
			birth: '-460',
			death: '-370',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Ancientgreek_surgical.jpg/330px-Ancientgreek_surgical.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Ancientgreek_surgical.jpg/330px-Ancientgreek_surgical.jpg',
			credit: 'Rmrfstar',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'franklin-benjamin',
		name: 'Benjamin Franklin',
		profession: ['Polymath', 'Inventor', 'Diplomat', 'Founding Father'],
		biography: {
			short:
				'Amerikanischer Drucker, Verleger, Schriftsteller, Naturwissenschaftler, Erfinder und Staatsmann.',
		},
		lifespan: {
			birth: '1706-01-17',
			death: '1790-04-17',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/1757_UPenn_Seal.png/330px-1757_UPenn_Seal.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/1757_UPenn_Seal.png/330px-1757_UPenn_Seal.png',
			credit: 'OgreBot',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'sokrates',
		name: 'Sokrates',
		profession: ['Philosopher'],
		biography: {
			short: 'Griechischer Philosoph, Begründer der philosophischen Methodik und Lehrer Platons.',
		},
		lifespan: {
			birth: '-469',
			death: '-399',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Alcibades_being_taught_by_Socrates%2C_Fran%C3%A7ois-Andr%C3%A9_Vincent.jpg/330px-Alcibades_being_taught_by_Socrates%2C_Fran%C3%A7ois-Andr%C3%A9_Vincent.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Alcibades_being_taught_by_Socrates%2C_Fran%C3%A7ois-Andr%C3%A9_Vincent.jpg/330px-Alcibades_being_taught_by_Socrates%2C_Fran%C3%A7ois-Andr%C3%A9_Vincent.jpg',
			credit: 'Fulvio314',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'newton-isaac',
		name: 'Isaac Newton',
		profession: ['Physicist', 'Mathematician', 'Astronomer'],
		biography: {
			short:
				'Englischer Naturforscher, gilt als einer der bedeutendsten Wissenschaftler aller Zeiten.',
		},
		lifespan: {
			birth: '1643-01-04',
			death: '1727-03-31',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Crab_Nebula.jpg/330px-Crab_Nebula.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Crab_Nebula.jpg/330px-Crab_Nebula.jpg',
			credit: 'Hawky.diddiz',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'rousseau-jean-jacques',
		name: 'Jean-Jacques Rousseau',
		profession: ['Philosopher', 'Writer', 'Composer'],
		biography: {
			short: 'Genfer Schriftsteller, Philosoph, Pädagoge und Komponist der Aufklärung.',
		},
		lifespan: {
			birth: '1712-06-28',
			death: '1778-07-02',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Allan_Ramsay_-_Jean-Jacques_Rousseau_%281712_-_1778%29_-_Google_Art_Project.jpg/330px-Allan_Ramsay_-_Jean-Jacques_Rousseau_%281712_-_1778%29_-_Google_Art_Project.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Allan_Ramsay_-_Jean-Jacques_Rousseau_%281712_-_1778%29_-_Google_Art_Project.jpg/330px-Allan_Ramsay_-_Jean-Jacques_Rousseau_%281712_-_1778%29_-_Google_Art_Project.jpg',
			credit: '0m9Ep',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'demokrit',
		name: 'Demokrit',
		profession: ['Philosopher'],
		biography: {
			short: 'Griechischer Philosoph und Vorsokratiker, Mitbegründer des Atomismus.',
		},
		lifespan: {
			birth: '-460',
			death: '-370',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Charles-Antoine_Coypel_-_The_Cheerful_Democritus.jpg/330px-Charles-Antoine_Coypel_-_The_Cheerful_Democritus.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Charles-Antoine_Coypel_-_The_Cheerful_Democritus.jpg/330px-Charles-Antoine_Coypel_-_The_Cheerful_Democritus.jpg',
			credit: 'Fouquiher',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'shedd-john',
		name: 'John A. Shedd',
		profession: ['Writer', 'Professor'],
		biography: {
			short: 'Amerikanischer Autor und Professor, bekannt für inspirierende Zitate.',
		},
		lifespan: {
			birth: '1859',
			death: '1928',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Acuario_Shedd%2C_Chicago%2C_Illinois%2C_Estados_Unidos%2C_2012-10-21%2C_DD_05.jpg/330px-Acuario_Shedd%2C_Chicago%2C_Illinois%2C_Estados_Unidos%2C_2012-10-21%2C_DD_05.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Acuario_Shedd%2C_Chicago%2C_Illinois%2C_Estados_Unidos%2C_2012-10-21%2C_DD_05.jpg/330px-Acuario_Shedd%2C_Chicago%2C_Illinois%2C_Estados_Unidos%2C_2012-10-21%2C_DD_05.jpg',
			credit: 'Poco a poco',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'ford-henry',
		name: 'Henry Ford',
		profession: ['Industrialist', 'Inventor', 'Entrepreneur'],
		biography: {
			short:
				'Amerikanischer Großindustrieller und Gründer des Automobilherstellers Ford Motor Company.',
		},
		lifespan: {
			birth: '1863-07-30',
			death: '1947-04-07',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/1909_Ford_Advance_Catalog_-_Model_T_Transmission.png/330px-1909_Ford_Advance_Catalog_-_Model_T_Transmission.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/1909_Ford_Advance_Catalog_-_Model_T_Transmission.png/330px-1909_Ford_Advance_Catalog_-_Model_T_Transmission.png',
			credit: 'Colin Douglas Howell',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'lasorda-tommy',
		name: 'Tommy Lasorda',
		profession: ['Baseball Manager', 'Coach'],
		biography: {
			short:
				'Amerikanischer Baseball-Manager und Spieler, bekannt als Manager der Los Angeles Dodgers.',
		},
		lifespan: {
			birth: '1927-09-22',
			death: '2021-01-07',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Exquisite-microphone.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Exquisite-microphone.png',
			credit: 'TomTheHand',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'aurelius-marcus',
		name: 'Marcus Aurelius',
		profession: ['Emperor', 'Philosopher'],
		biography: {
			short: 'Römischer Kaiser und Philosoph, letzter bedeutender Vertreter der Stoa.',
			sections: {
				reign: {
					title: 'Kaiser des Römischen Reiches (161-180)',
					content:
						'Bestieg 161 n.Chr. den Thron und führte das Reich durch turbulente Zeiten. Kämpfte gegen Germanen und Sarmaten, unterdrückte Rebellionen und bewältigte die Antoninische Pest. Trotz militärischer Pflichten blieb er der Philosophie treu.',
				},
				philosopher: {
					title: 'Der Philosoph auf dem Thron',
					content:
						"Verfasste seine berühmten 'Selbstbetrachtungen' während seiner Feldzüge. Diese privaten Notizen wurden zu einem der wichtigsten Werke der stoischen Philosophie. Lehrte Selbstbeherrschung, Pflichtbewusstsein und Akzeptanz des Schicksals.",
				},
				stoicism: {
					title: 'Stoische Lehren',
					content:
						'Verkörperte die stoischen Ideale von Tugend, Weisheit und innerem Frieden. Betonte die Vergänglichkeit aller Dinge und die Wichtigkeit, im Einklang mit der Natur zu leben. Seine Lehren beeinflussten das westliche Denken nachhaltig.',
				},
				legacy: {
					title: 'Vermächtnis',
					content:
						"Gilt als der letzte der 'Fünf Guten Kaiser' und als Philosoph-Kaiser schlechthin. Seine Werke inspirieren bis heute Führungskräfte, Philosophen und Menschen auf der Suche nach innerem Frieden. Symbol für die Vereinbarkeit von Macht und Weisheit.",
				},
			},
			keyAchievements: [
				'Erfolgreiche Verteidigung der Reichsgrenzen',
				"Verfassung der 'Selbstbetrachtungen'",
				'Verkörperung des Philosoph-Kaisers',
				'Förderung von Recht und Gerechtigkeit',
			],
			famousQuote:
				'Du hast Macht über deinen Geist - nicht über äußere Ereignisse. Erkenne dies, und du wirst Stärke finden.',
		},
		lifespan: {
			birth: '121',
			death: '180',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/0_Relief_-_Monument_honoraire_de_Marc_Aur%C3%A8le_-_La_soumission_des_germains_%281%29.JPG/330px-0_Relief_-_Monument_honoraire_de_Marc_Aur%C3%A8le_-_La_soumission_des_germains_%281%29.JPG',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/0_Relief_-_Monument_honoraire_de_Marc_Aur%C3%A8le_-_La_soumission_des_germains_%281%29.JPG/330px-0_Relief_-_Monument_honoraire_de_Marc_Aur%C3%A8le_-_La_soumission_des_germains_%281%29.JPG',
			credit: 'Jean-Pol GRANDMONT',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'hillary-edmund',
		name: 'Edmund Hillary',
		profession: ['Mountaineer', 'Explorer'],
		biography: {
			short:
				'Neuseeländischer Bergsteiger, Erstbesteiger des Mount Everest zusammen mit Tenzing Norgay.',
		},
		lifespan: {
			birth: '1919-07-20',
			death: '2008-01-11',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Edmund-Hillary.web.jpg/330px-Edmund-Hillary.web.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Edmund-Hillary.web.jpg/330px-Edmund-Hillary.web.jpg',
			credit: 'EEng',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'jobs-steve',
		name: 'Steve Jobs',
		profession: ['Entrepreneur', 'Inventor', 'CEO'],
		biography: {
			short: 'Mitbegründer von Apple Inc., visionärer Unternehmer und Innovator.',
			sections: {
				dropout: {
					title: 'Reed College und Dropout (1972-1976)',
					content:
						'Studierte am Reed College, brach aber ab. Blieb als Gasthörer und besuchte Kurse wie Kalligrafie - später entscheidend für Apples Typografie. Reiste nach Indien, suchte spirituelle Erleuchtung.',
				},
				apple: {
					title: 'Apple-Gründung (1976-1985)',
					content:
						'Gründete 1976 mit Steve Wozniak Apple in der Garage. Der Apple II wurde zum Kassenschlager. 1984 stellte er den Macintosh vor - den ersten massentauglichen Computer mit grafischer Benutzeroberfläche.',
				},
				wilderness: {
					title: 'Wildnis-Jahre bei NeXT (1985-1997)',
					content:
						"Nach Machtkampf bei Apple 1985 entlassen. Gründete NeXT und kaufte Pixar von George Lucas. Pixar revolutionierte mit 'Toy Story' die Filmbranche. NeXT entwickelte das Betriebssystem für Apples Comeback.",
				},
				return: {
					title: 'Triumphale Rückkehr (1997-2011)',
					content:
						'Kehrte 1997 zu Apple zurück, rettete das Unternehmen vor dem Bankrott. Revolutionierte mit iMac, iPod, iPhone und iPad ganze Industrien. Machte Apple zum wertvollsten Unternehmen der Welt, starb 2011 an Krebs.',
				},
			},
			keyAchievements: [
				'Mitbegründer von Apple Inc.',
				'Revolution der Computerindustrie mit dem Macintosh',
				'iPod, iPhone und iPad als Game Changer',
				'Aufbau von Pixar als Filmstudio',
				"Design-Philosophie 'Think Different'",
			],
			famousQuote: 'Innovation unterscheidet zwischen einem Anführer und einem Nachahmer.',
		},
		lifespan: {
			birth: '1955-02-24',
			death: '2011-10-05',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/A_Bug%27s_Life_crew_in_Oval_Office_1998.jpg/330px-A_Bug%27s_Life_crew_in_Oval_Office_1998.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/A_Bug%27s_Life_crew_in_Oval_Office_1998.jpg/330px-A_Bug%27s_Life_crew_in_Oval_Office_1998.jpg',
			credit: 'EmiliaITČA',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'edison-thomas',
		name: 'Thomas Alva Edison',
		profession: ['Inventor', 'Businessman'],
		biography: {
			short:
				'Amerikanischer Erfinder und Unternehmer mit über 1000 Patenten, erfand die Glühlampe.',
			sections: {
				telegrapher: {
					title: 'Wandertelegrafist (1863-1868)',
					content:
						'Arbeitete als reisender Telegrafist, perfektionierte seine technischen Fähigkeiten. Erfand erste Verbesserungen für Telegrafengeräte. Diese Jahre der praktischen Erfahrung legten den Grundstein für spätere Erfindungen.',
				},
				menlo: {
					title: 'Menlo Park - Das Erfinderlabor (1876-1882)',
					content:
						"Eröffnete das erste industrielle Forschungslabor der Welt in Menlo Park. Versprach 'eine kleine Erfindung alle zehn Tage, eine große alle sechs Monate'. Erfand Phonograph (1877) und perfektionierte die Glühlampe (1879).",
				},
				electricity: {
					title: 'Stromkrieg und Elektrifizierung (1882-1892)',
					content:
						"Baute das erste Stromversorgungssystem in New York auf. 'Stromkrieg' mit Nikola Tesla und Westinghouse um AC vs. DC. Obwohl Tesla gewann, revolutionierte Edison die Welt durch Elektrifizierung.",
				},
				motion: {
					title: 'Kino und späte Erfindungen (1892-1931)',
					content:
						'Erfand das Kinetoskop - Vorläufer des Kinos. Mit 1093 Patenten produktivster Erfinder der Geschichte. Gründete General Electric mit. Arbeitete bis ins hohe Alter, suchte Gummi-Alternativen für die USA.',
				},
			},
			keyAchievements: [
				'1093 US-Patente - Weltrekord',
				'Erfindung der praktischen Glühlampe',
				'Phonograph - erste Tonaufzeichnung',
				'Kinetoskop - Grundlage des Kinos',
				'Erstes industrielles Forschungslabor',
			],
			famousQuote: 'Genie ist ein Prozent Inspiration und neunundneunzig Prozent Transpiration.',
		},
		lifespan: {
			birth: '1847-02-11',
			death: '1931-10-18',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/19101002_%22No_Immortality_of_the_Soul%22_Says_Thomas_A._Edison_-_The_New_York_Times.jpg/330px-19101002_%22No_Immortality_of_the_Soul%22_Says_Thomas_A._Edison_-_The_New_York_Times.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/19101002_%22No_Immortality_of_the_Soul%22_Says_Thomas_A._Edison_-_The_New_York_Times.jpg/330px-19101002_%22No_Immortality_of_the_Soul%22_Says_Thomas_A._Edison_-_The_New_York_Times.jpg',
			credit: 'RCraig09',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'fischer-thomas',
		name: 'Thomas Fischer',
		profession: ['Judge', 'Author'],
		biography: {
			short: 'Deutscher Jurist und ehemaliger Vorsitzender Richter am Bundesgerichtshof.',
		},
		lifespan: {
			birth: '1953',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Disambig_gray.svg/300px-Disambig_gray.svg.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Disambig_gray.svg/300px-Disambig_gray.svg.png',
			credit: 'Ladsgroup',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'aristoteles',
		name: 'Aristoteles',
		profession: ['Philosopher', 'Scientist'],
		biography: {
			short:
				'Griechischer Philosoph und Naturforscher, Schüler Platons und Lehrer Alexanders des Großen.',
			sections: {
				academy: {
					title: 'Bei Platon in der Akademie (367-347 v.Chr.)',
					content:
						'20 Jahre lang Schüler und später Lehrer in Platons Akademie in Athen. Entwickelte seine eigene Philosophie, die sich zunehmend von Platons Ideenlehre unterschied. Begann seine ersten systematischen Schriften.',
				},
				tutor: {
					title: 'Lehrer Alexanders des Großen (343-335 v.Chr.)',
					content:
						'Von König Philipp II. von Makedonien berufen, den 13-jährigen Alexander zu unterrichten. Vermittelte ihm nicht nur Wissen, sondern auch ethische Werte und politische Weisheit. Diese Zeit prägte beide nachhaltig.',
				},
				lyceum: {
					title: 'Das Lykeion und wissenschaftliche Blüte (335-323 v.Chr.)',
					content:
						'Gründete in Athen das Lykeion, seine eigene Schule. Hier entstanden seine Hauptwerke zur Logik, Ethik, Politik, Biologie und Metaphysik. Entwickelte die erste systematische Wissenschaftsmethodik der westlichen Welt.',
				},
				exile: {
					title: 'Flucht und Tod (323-322 v.Chr.)',
					content:
						"Nach Alexanders Tod musste er wegen anti-makedonischer Stimmung aus Athen fliehen. Starb auf der Insel Euböa mit den Worten: 'Die Athener sollen sich nicht ein zweites Mal gegen die Philosophie versündigen.'",
				},
			},
			keyAchievements: [
				'Begründung der formalen Logik',
				'Systematisierung der Naturwissenschaften',
				'Entwicklung der Tugendethik',
				'Gründung der Politikwissenschaft',
				'Klassifizierung der Lebewesen',
			],
			famousQuote:
				'Wir sind das, was wir wiederholt tun. Vorzüglichkeit ist daher keine Handlung, sondern eine Gewohnheit.',
		},
		lifespan: {
			birth: '-384',
			death: '-322',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/%28Venice%29_Aristotele_by_Francesco_Hayez_in_gallerie_Accademia_Venice.jpg/330px-%28Venice%29_Aristotele_by_Francesco_Hayez_in_gallerie_Accademia_Venice.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/%28Venice%29_Aristotele_by_Francesco_Hayez_in_gallerie_Accademia_Venice.jpg/330px-%28Venice%29_Aristotele_by_Francesco_Hayez_in_gallerie_Accademia_Venice.jpg',
			credit: 'Archaeodontosaurus',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'hill-napoleon',
		name: 'Napoleon Hill',
		profession: ['Author', 'Speaker'],
		biography: {
			short: 'Amerikanischer Schriftsteller im Bereich der persönlichen Erfolgs-Literatur.',
			sections: {
				journalism: {
					title: 'Journalist und erste Erfolge (1900-1908)',
					content:
						'Begann als Journalist für kleine Zeitungen und entwickelte seine Fähigkeiten als Interviewer. Diese Zeit lehrte ihn, Menschen zu verstehen und ihre Erfolgsgeheimnisse zu ergründen - eine Fähigkeit, die sein Leben prägen sollte.',
				},
				carnegie: {
					title: 'Treffen mit Andrew Carnegie (1908-1928)',
					content:
						'Das schicksalhafte Interview mit Stahlmagnaten Andrew Carnegie änderte sein Leben. Carnegie beauftragte ihn, die Erfolgsgeheimnisse der reichsten und mächtigsten Menschen Amerikas zu studieren - eine Aufgabe, die 20 Jahre dauern sollte.',
				},
				research: {
					title: 'Forschung und Entwicklung (1928-1937)',
					content:
						'Interviewte über 500 erfolgreiche Persönlichkeiten wie Henry Ford, Thomas Edison und Theodore Roosevelt. Entwickelte dabei seine 13 Erfolgsprinzipien und die Philosophie des positiven Denkens.',
				},
				masterwork: {
					title: "'Think and Grow Rich' und Weltruhm (1937-1970)",
					content:
						"Veröffentlichte sein Hauptwerk 'Think and Grow Rich', das sofort zum Bestseller wurde. Das Buch verkaufte sich über 70 Millionen Mal und begründete die moderne Selbsthilfe-Industrie. Hielt Vorträge weltweit und inspirierte Generationen.",
				},
			},
			keyAchievements: [
				"Autor des Bestsellers 'Think and Grow Rich'",
				'Begründer der modernen Erfolgsliteratur',
				'Entwicklung der 13 Erfolgsprinzipien',
				'Über 70 Millionen verkaufte Bücher',
				'Mentor für Millionen von Menschen weltweit',
			],
			famousQuote:
				'Was der Geist des Menschen erdenken und glauben kann, das kann er auch erreichen.',
		},
		lifespan: {
			birth: '1883-10-26',
			death: '1970-11-08',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/c/c2/Books-aj.svg_aj_ashton_01.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Books-aj.svg_aj_ashton_01.png',
			credit: 'Niki K',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'epiktet',
		name: 'Epiktet',
		profession: ['Philosopher'],
		biography: {
			short:
				'Griechischer Philosoph der Stoa, lehrte die Kontrolle über das, was in unserer Macht steht.',
			sections: {
				education: {
					title: 'Philosophische Ausbildung (ca. 70-85 n.Chr.)',
					content:
						'Durfte bei dem Stoiker Musonius Rufus studieren. Hier lernte er die Grundlagen der stoischen Philosophie und entwickelte seine eigene Interpretation. Die paradoxe Situation - ein Sklave, der über Freiheit philosophiert - prägte sein Denken nachhaltig.',
				},
				freedom: {
					title: 'Freiheit und eigene Schule (ca. 85-95 n.Chr.)',
					content:
						'Nach seiner Freilassung eröffnete er eine philosophische Schule in Rom. Lehrte, dass wahre Freiheit im Geist liegt, nicht in äußeren Umständen. Seine eigene Erfahrung als Sklave verlieh seinen Lehren ungewöhnliche Authentizität und Kraft.',
				},
				exile: {
					title: 'Verbannung nach Nikopolis (95-138 n.Chr.)',
					content:
						"Kaiser Domitian verbannte alle Philosophen aus Rom. Epiktet gründete in Nikopolis (Griechenland) seine berühmte Schule. Hier entstanden seine Lehrgespräche ('Diatribai'), die sein Schüler Arrian aufzeichnete. Lehrte bis zu seinem Tod einfache, aber tiefgreifende Lebenswisheiten.",
				},
			},
			keyAchievements: [
				'Entwicklung der praktischen Stoischen Ethik',
				'Lehre der Dichotomie der Kontrolle',
				'Gründung der Schule von Nikopolis',
				'Einfluss auf Mark Aurel und spätere Denker',
				'Überwindung der Sklaverei durch geistige Kraft',
			],
			famousQuote:
				'Es sind nicht die Dinge, die uns beunruhigen, sondern die Meinungen, die wir von den Dingen haben.',
		},
		lifespan: {
			birth: '50',
			death: '138',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Epicteti_Enchiridion_Latinis_versibus_adumbratum_%28Oxford_1715%29_frontispiece.jpg/330px-Epicteti_Enchiridion_Latinis_versibus_adumbratum_%28Oxford_1715%29_frontispiece.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Epicteti_Enchiridion_Latinis_versibus_adumbratum_%28Oxford_1715%29_frontispiece.jpg/330px-Epicteti_Enchiridion_Latinis_versibus_adumbratum_%28Oxford_1715%29_frontispiece.jpg',
			credit: 'Aristeas',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'zuckerberg-mark',
		name: 'Mark Zuckerberg',
		profession: ['Entrepreneur', 'CEO', 'Programmer'],
		biography: {
			short: 'Gründer und CEO von Meta (Facebook), einer der jüngsten Selfmade-Milliardäre.',
			sections: {
				harvard: {
					title: 'Harvard und die Geburt von Facebook (2002-2004)',
					content:
						"Studierte Informatik und Psychologie in Harvard. Entwickelte verschiedene Programme wie CourseMatch und Facemash. Am 4. Februar 2004 startete er 'TheFacebook' von seinem Studentenwohnheim aus - zunächst nur für Harvard-Studenten.",
				},
				expansion: {
					title: 'Expansion und Durchbruch (2004-2012)',
					content:
						'Brach das Studium ab und zog nach Palo Alto. Erweiterte Facebook auf andere Universitäten und schließlich weltweit. 2012 ging Facebook an die Börse - einer der größten Tech-IPOs aller Zeiten. Zuckerberg wurde mit 28 Jahren zum jüngsten Milliardär der Geschichte.',
				},
				challenges: {
					title: 'Herausforderungen und Wandel (2012-heute)',
					content:
						"Führte Facebook durch verschiedene Krisen wie Datenschutz-Skandale und Fake-News-Problematiken. 2021 benannte er das Unternehmen in 'Meta' um und fokussiert sich auf das Metaverse. Setzt sich für Philanthropie ein und hat mit seiner Frau die Chan Zuckerberg Initiative gegründet.",
				},
			},
			keyAchievements: [
				'Gründung von Facebook mit 19 Jahren',
				'Aufbau eines Unternehmens mit über 3 Milliarden Nutzern',
				'Jüngster Selfmade-Milliardär der Geschichte',
				'Umbenennung zu Meta und Metaverse-Vision',
				'Chan Zuckerberg Initiative für Philanthropie',
			],
			famousQuote:
				'Der größte Risiko ist es, keine Risiken zu nehmen. In einer Welt, die sich schnell verändert, ist die einzige Strategie, die garantiert scheitert, keine Risiken zu nehmen.',
		},
		lifespan: {
			birth: '1984-05-14',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Cristina_Kirchner_and_Mark_Zuckerberg.jpg/330px-Cristina_Kirchner_and_Mark_Zuckerberg.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Cristina_Kirchner_and_Mark_Zuckerberg.jpg/330px-Cristina_Kirchner_and_Mark_Zuckerberg.jpg',
			credit: 'Cacen Gymraeg',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'franz-von-assisi',
		name: 'Franz von Assisi',
		profession: ['Mystic', 'Monk', 'Founder'],
		biography: {
			short: 'Italienischer Mystiker und Gründer des Franziskanerordens.',
			sections: {
				conversion: {
					title: 'Bekehrung und Berufung (1202-1208)',
					content:
						"Nach Gefangenschaft im Krieg gegen Perugia und schwerer Krankheit begann seine spirituelle Wandlung. 1205 hörte er in der verfallenen Kirche San Damiano eine Stimme: 'Geh und baue meine Kirche wieder auf!' Er verkaufte Waren seines Vaters, um Kirchen zu restaurieren, was zum Bruch mit der Familie führte.",
				},
				founding: {
					title: 'Gründung des Franziskanerordens (1208-1219)',
					content:
						'1208 verstand er seine wahre Berufung: ein Leben in völliger Armut nach dem Vorbild Jesu. Erste Brüder schlossen sich ihm an. 1209 erhielt er von Papst Innozenz III. die mündliche Bestätigung seiner Regel. Der Orden wuchs rasant und verbreitete sich in ganz Europa.',
				},
				later: {
					title: 'Mystik und Stigmata (1219-1226)',
					content:
						"Reiste ins Heilige Land und traf Sultan al-Kamil. 1224 empfing er auf dem Berg La Verna die Stigmata - die Wundmale Christi. Seine letzten Jahre waren geprägt von mystischen Erfahrungen und dem 'Sonnengesang', einem der ersten Gedichte in italienischer Sprache. Starb am 3. Oktober 1226.",
				},
			},
			keyAchievements: [
				'Gründung des Franziskanerordens',
				'Erster bekannter Träger der Stigmata',
				"Verfasser des 'Sonnengesangs'",
				'Patron des Umweltschutzes',
				'Heiligsprechung bereits 1228',
			],
			famousQuote:
				'Herr, mach mich zu einem Werkzeug deines Friedens. Wo Hass ist, lass mich Liebe säen.',
		},
		lifespan: {
			birth: '1181',
			death: '1226-10-03',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Franz_of_Assisi_church.jpg/330px-Franz_of_Assisi_church.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Franz_of_Assisi_church.jpg/330px-Franz_of_Assisi_church.jpg',
			credit: 'Der Schmitzi',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'ruskin-john',
		name: 'John Ruskin',
		profession: ['Art Critic', 'Social Thinker', 'Writer'],
		biography: {
			short:
				'Britischer Kunstkritiker, Sozialphilosoph und Schriftsteller der viktorianischen Ära.',
			sections: {
				artCritic: {
					title: 'Durchbruch als Kunstkritiker (1843-1860)',
					content:
						"1843 erschien der erste Band von 'Modern Painters', der Turner und die Landschaftsmalerei verteidigte. 1849 folgte 'The Seven Lamps of Architecture', 1851-1853 'The Stones of Venice'. Diese Werke revolutionierten die Kunstkritik und machten ihn zum führenden Theoretiker der Gotik.",
				},
				socialReform: {
					title: 'Soziale Reformbewegung (1860-1885)',
					content:
						"Wandte sich zunehmend sozialen Fragen zu. 1860 erschien 'Unto This Last', eine Kritik der politischen Ökonomie. Entwickelte Ideen über faire Löhne und die Würde der Arbeit. Gründete das Guild of St George, eine utopische Gemeinschaft zur Sozialreform.",
				},
				legacy: {
					title: 'Professor und späte Jahre (1869-1900)',
					content:
						"1869-1879 und 1883-1884 Slade Professor für Kunst in Oxford. Seine Vorlesungen wurden zu gesellschaftlichen Ereignissen. Litt unter psychischen Problemen, schrieb aber weiter über Kunst und Gesellschaft. Seine Autobiografie 'Praeterita' erschien ab 1885. Starb 1900 als einer der einflussreichsten Denker seiner Zeit.",
				},
			},
			keyAchievements: [
				'Revolutionierung der Kunstkritik',
				'Wiederbelebung der Gotik-Begeisterung',
				'Begründung moderner Sozialreform-Ideen',
				'Einfluss auf Arts and Crafts Movement',
				'Inspiration für Gandhi und andere Reformer',
			],
			famousQuote:
				'Es gibt kaum etwas auf der Welt, was nicht jemand ein wenig schlechter machen könnte und etwas billiger verkaufen würde.',
		},
		lifespan: {
			birth: '1819-02-08',
			death: '1900-01-20',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Euphemia_%28%27Effie%27%29_Chalmers_%28n%C3%A9e_Gray%29%2C_Lady_Millais_by_Thomas_Richmond.jpg/330px-Euphemia_%28%27Effie%27%29_Chalmers_%28n%C3%A9e_Gray%29%2C_Lady_Millais_by_Thomas_Richmond.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Euphemia_%28%27Effie%27%29_Chalmers_%28n%C3%A9e_Gray%29%2C_Lady_Millais_by_Thomas_Richmond.jpg/330px-Euphemia_%28%27Effie%27%29_Chalmers_%28n%C3%A9e_Gray%29%2C_Lady_Millais_by_Thomas_Richmond.jpg',
			credit: 'Dcoetzee',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'lloyd-george-david',
		name: 'David Lloyd George',
		profession: ['Prime Minister', 'Statesman'],
		biography: {
			short: 'Britischer Premierminister während des Ersten Weltkriegs.',
		},
		lifespan: {
			birth: '1863-01-17',
			death: '1945-03-26',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/2211-lloyd-george.jpg/330px-2211-lloyd-george.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/2211-lloyd-george.jpg/330px-2211-lloyd-george.jpg',
			credit: 'MARKELLOS',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'hesse-hermann',
		name: 'Hermann Hesse',
		profession: ['Writer', 'Poet', 'Painter'],
		biography: {
			short:
				'Deutsch-schweizerischer Schriftsteller, Dichter und Maler, Literaturnobelpreisträger 1946.',
			sections: {
				apprentice: {
					title: 'Buchhändlerlehre und erste Werke (1895-1904)',
					content:
						"Absolvierte eine Buchhändlerlehre in Tübingen. 1899 erschien sein erster Gedichtband 'Romantische Lieder', 1904 der erste Roman 'Peter Camenzind', der ihn schlagartig berühmt machte. Heiratete Maria Bernoulli und zog nach Gaienhofen am Bodensee.",
				},
				breakthrough: {
					title: 'Literarischer Durchbruch (1904-1919)',
					content:
						"Schrieb in Gaienhofen 'Unterm Rad' (1906) und 'Gertrud' (1910). Der Erste Weltkrieg erschütterte ihn tief - er wurde zum Pazifisten. 1919 erschien 'Demian', das eine ganze Generation beeinflusste. Übersiedelte in die Schweiz und nahm später die Schweizer Staatsbürgerschaft an.",
				},
				masterworks: {
					title: 'Meisterwerke und Weltgeltung (1919-1962)',
					content:
						"In Montagnola entstanden seine Hauptwerke: 'Siddhartha' (1922), 'Der Steppenwolf' (1927), 'Narziss und Goldmund' (1930) und 'Das Glasperlenspiel' (1943). 1946 erhielt er den Nobelpreis für Literatur. Wurde in den 1960ern von der Hippie-Bewegung wiederentdeckt.",
				},
			},
			keyAchievements: [
				'Literaturnobelpreis 1946',
				'Über 145 Millionen verkaufte Bücher weltweit',
				'Kultureller Einfluss auf mehrere Generationen',
				'Meister des Bildungsromans',
				'Brücke zwischen östlicher und westlicher Philosophie',
			],
			famousQuote: 'Man muss das Unmögliche versuchen, um das Mögliche zu erreichen.',
		},
		lifespan: {
			birth: '1877-07-02',
			death: '1962-08-09',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Demian_Erstausgabe.jpg/330px-Demian_Erstausgabe.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Demian_Erstausgabe.jpg/330px-Demian_Erstausgabe.jpg',
			credit: 'Aleister26',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'gibran-khalil',
		name: 'Khalil Gibran',
		profession: ['Poet', 'Writer', 'Painter'],
		biography: {
			short: "Libanesisch-amerikanischer Maler, Philosoph und Dichter, bekannt für 'Der Prophet'.",
			sections: {
				immigration: {
					title: 'Einwanderung nach Amerika (1895-1902)',
					content:
						'1895 wanderte die Familie nach Boston aus. Gibran besuchte eine öffentliche Schule und lernte Englisch. Ein Lehrer entdeckte sein künstlerisches Talent und brachte ihn mit dem Fotografen Fred Holland Day zusammen, der sein Mentor wurde. 1898 kehrte er für vier Jahre in den Libanon zurück, um am College zu studieren.',
				},
				artistic: {
					title: 'Künstlerische Entwicklung (1902-1918)',
					content:
						'Zurück in Boston verlor er seine Schwester, seinen Bruder und seine Mutter binnen kurzer Zeit. Diese Tragödien vertieften seine spirituelle Suche. 1904 hatte er seine erste Kunstausstellung. Lernte Mary Haskell kennen, die seine Förderin wurde. 1912 zog er nach New York und wurde Teil der arabisch-amerikanischen Künstlerszene.',
				},
				prophet: {
					title: "'Der Prophet' und Weltruhm (1918-1931)",
					content:
						"1918 erschien 'Der Verrückte' auf Englisch, sein erster englischsprachiger Erfolg. 1923 veröffentlichte er 'Der Prophet', sein Meisterwerk, das zunächst mäßig erfolgreich war. Erst nach seinem Tod 1931 wurde es zu einem Welterfolg. Das Buch wurde in über 100 Sprachen übersetzt und verkaufte sich über 120 Millionen Mal.",
				},
			},
			keyAchievements: [
				"'Der Prophet' - eines der meistverkauften Bücher aller Zeiten",
				'Brücke zwischen östlicher und westlicher Kultur',
				'Begründer der modernen arabischen Literatur',
				'Über 120 Millionen verkaufte Bücher',
				'Einfluss auf Generationen spiritueller Sucher',
			],
			famousQuote:
				'Eure Kinder sind nicht eure Kinder. Es sind die Söhne und Töchter der Sehnsucht des Lebens nach sich selber.',
		},
		lifespan: {
			birth: '1883-01-06',
			death: '1931-04-10',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/-F._Holland_Day-_MET_DP264342.jpg/330px--F._Holland_Day-_MET_DP264342.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/-F._Holland_Day-_MET_DP264342.jpg/330px--F._Holland_Day-_MET_DP264342.jpg',
			credit: 'Pharos',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'roosevelt-eleanor',
		name: 'Eleanor Roosevelt',
		profession: ['First Lady', 'Diplomat', 'Activist'],
		biography: {
			short: 'US-amerikanische Menschenrechtsaktivistin, Diplomatin und First Lady.',
			sections: {
				marriage: {
					title: 'Heirat und politische Anfänge (1905-1933)',
					content:
						'Heiratete 1905 ihren entfernten Vetter Franklin D. Roosevelt. Bekam sechs Kinder und führte zunächst ein konventionelles Leben der Oberschicht. Als Franklin 1921 an Polio erkrankte, wurde sie zu seiner politischen Partnerin und entwickelte ihre eigenen sozialen Aktivitäten.',
				},
				firstLady: {
					title: 'Revolutionäre First Lady (1933-1945)',
					content:
						'Als First Lady revolutionierte sie die Rolle: Hielt eigene Pressekonferenzen, schrieb eine tägliche Kolumne, reiste durch das Land. Kämpfte für Bürgerrechte, Frauenrechte und soziale Gerechtigkeit. Wurde zur Stimme der Benachteiligten und politisch Einflussreichsten First Lady der Geschichte.',
				},
				unitedNations: {
					title: 'UN-Botschafterin und Menschenrechte (1945-1962)',
					content:
						"Nach Franklins Tod 1945 ernannte sie Präsident Truman zur UN-Delegierten. Leitete die Kommission für Menschenrechte und war Hauptautorin der Allgemeinen Erklärung der Menschenrechte (1948). Wurde als 'First Lady of the World' geehrt. Blieb bis zu ihrem Tod 1962 eine moralische Autorität.",
				},
			},
			keyAchievements: [
				'Hauptautorin der Allgemeinen Erklärung der Menschenrechte',
				'Revolutionierung der Rolle der First Lady',
				'Vorsitzende der UN-Menschenrechtskommission',
				'Kämpferin für Bürgerrechte und soziale Gerechtigkeit',
				"'First Lady of the World'",
			],
			famousQuote:
				'Niemand kann dich ohne deine Einwilligung das Gefühl geben, minderwertig zu sein.',
		},
		lifespan: {
			birth: '1884-10-11',
			death: '1962-11-07',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/%28Mary_McLeod_Bethune%29%2C_%22Mrs._Eleanor_Roosevelt_and_others_at_the_opening_of_Midway_Hall%2C_one_of_two_residence_halls_buil_-_NARA_-_533032.jpg/330px-%28Mary_McLeod_Bethune%29%2C_%22Mrs._Eleanor_Roosevelt_and_others_at_the_opening_of_Midway_Hall%2C_one_of_two_residence_halls_buil_-_NARA_-_533032.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/%28Mary_McLeod_Bethune%29%2C_%22Mrs._Eleanor_Roosevelt_and_others_at_the_opening_of_Midway_Hall%2C_one_of_two_residence_halls_buil_-_NARA_-_533032.jpg/330px-%28Mary_McLeod_Bethune%29%2C_%22Mrs._Eleanor_Roosevelt_and_others_at_the_opening_of_Midway_Hall%2C_one_of_two_residence_halls_buil_-_NARA_-_533032.jpg',
			credit: 'US National Archives bot',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'jung-carl',
		name: 'Carl Gustav Jung',
		profession: ['Psychiatrist', 'Psychoanalyst', 'Psychologist'],
		biography: {
			short: 'Schweizer Psychiater und Begründer der analytischen Psychologie.',
			sections: {
				medical: {
					title: 'Medizinstudium und psychiatrische Anfänge (1895-1907)',
					content:
						'Studierte Medizin in Basel und spezialisierte sich auf Psychiatrie. 1900 begann er am Burghölzli-Krankenhaus in Zürich unter Eugen Bleuler. Entwickelte den Assoziationstest und machte sich einen Namen in der frühen experimentellen Psychologie. 1903 heiratete er Emma Rauschenbach.',
				},
				freud: {
					title: 'Zusammenarbeit und Bruch mit Freud (1907-1913)',
					content:
						"1907 traf er Sigmund Freud und wurde zu seinem wichtigsten Mitarbeiter und 'Kronprinzen' der Psychoanalyse. Doch philosophische Differenzen - Jung betonte Spiritualität und kollektive Aspekte, Freud die Sexualität - führten 1913 zum dramatischen Bruch. Jung durchlebte eine persönliche Krise, die er 'Auseinandersetzung mit dem Unbewussten' nannte.",
				},
				analytical: {
					title: 'Entwicklung der Analytischen Psychologie (1913-1961)',
					content:
						'Aus seiner Krise heraus entwickelte er seine eigene Psychologie: Archetypen, kollektives Unbewusstes, Anima/Animus, Individuation. Gründete die Analytische Psychologie als eigenständige Richtung. Reiste zu indigenen Völkern, studierte Religionen und Mythologien. Wurde zu einem der einflussreichsten Psychologen des 20. Jahrhunderts.',
				},
			},
			keyAchievements: [
				'Begründer der Analytischen Psychologie',
				'Entwicklung der Archetypentheorie',
				'Konzept des kollektiven Unbewussten',
				'Myers-Briggs-Persönlichkeitstypen',
				'Einfluss auf Literatur und Kulturwissenschaften',
			],
			famousQuote: 'Wer nach außen schaut, träumt. Wer nach innen schaut, erwacht.',
		},
		lifespan: {
			birth: '1875-07-26',
			death: '1961-06-06',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/11-11-24-basel-by-ralfr-035.jpg/330px-11-11-24-basel-by-ralfr-035.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/11-11-24-basel-by-ralfr-035.jpg/330px-11-11-24-basel-by-ralfr-035.jpg',
			credit: 'Ralf Roletschek',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'lee-bruce',
		name: 'Bruce Lee',
		profession: ['Martial Artist', 'Actor', 'Philosopher'],
		biography: {
			short: 'Sino-amerikanischer Kampfkünstler, Kampfkunst-Ausbilder und Schauspieler.',
			sections: {
				america: {
					title: 'Amerika und Philosophiestudium (1959-1964)',
					content:
						'1959 ging er in die USA und studierte Philosophie an der University of Washington in Seattle. Hier entwickelte er seine eigene Kampfkunstphilosophie und begann, Kampfkunst zu unterrichten. Eröffnete seine erste Schule und heiratete 1964 Linda Emery. Begann, traditionelle Kampfkunstgrenzen zu hinterfragen.',
				},
				hollywood: {
					title: "Hollywood und 'Green Hornet' (1964-1971)",
					content:
						"Zog nach Los Angeles und wurde als Kato in der TV-Serie 'The Green Hornet' berühmt. Seine explosiven Kampfszenen machten ihn bekannt, aber Hollywood war noch nicht bereit für einen asiatischen Hauptdarsteller. Entwickelte währenddessen sein Jeet Kune Do - 'die Kunst, keine Kunst zu haben'.",
				},
				legend: {
					title: 'Hong Kong-Filme und Legende (1971-1973)',
					content:
						"Kehrte nach Hong Kong zurück und drehte legendäre Filme wie 'The Big Boss', 'Fist of Fury' und 'Way of the Dragon'. 1973, kurz vor der Premiere seines Meisterwerks 'Enter the Dragon', starb er überraschend mit nur 32 Jahren. Wurde posthum zur größten Kampfkunst-Ikone der Welt.",
				},
			},
			keyAchievements: [
				'Begründer des Jeet Kune Do',
				'Erste asiatische Hollywood-Ikone',
				'Revolution der Kampfkunstphilosophie',
				'Globale Verbreitung der Martial Arts',
				'Kulturelle Brücke zwischen Ost und West',
			],
			famousQuote:
				'Sei wie Wasser, mein Freund - Wasser hat keine Form, aber es passt sich an jeden Behälter an.',
		},
		lifespan: {
			birth: '1940-11-27',
			death: '1973-07-20',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Avenue_of_Stars_Bruce_Lee.jpg/330px-Avenue_of_Stars_Bruce_Lee.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Avenue_of_Stars_Bruce_Lee.jpg/330px-Avenue_of_Stars_Bruce_Lee.jpg',
			credit: 'Hohum',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'katharina-von-siena',
		name: 'Katharina von Siena',
		profession: ['Mystic', 'Saint', 'Doctor of the Church'],
		biography: {
			short: 'Italienische Mystikerin, Kirchenlehrerin und Heilige.',
			sections: {
				mystical: {
					title: 'Mystische Erfahrungen und Stigmata (1363-1374)',
					content:
						"Lebte drei Jahre in völliger Zurückgezogenheit in einer Kammer ihres Elternhauses. Erlebte intensive mystische Visionen und eine 'mystische Vermählung' mit Christus. 1374 empfing sie die Stigmata, die nur sie selbst sehen konnte. Begann, Anhänger um sich zu sammeln und als spirituelle Lehrerin zu wirken.",
				},
				politics: {
					title: 'Politische Tätigkeit und Papst-Konflikt (1374-1377)',
					content:
						"Verließ ihre Zurückgezogenheit und wurde politisch aktiv. Vermittelte in Konflikten zwischen italienischen Stadtstaaten. Ihr größter Erfolg: Sie überzeugte Papst Gregor XI., von Avignon nach Rom zurückzukehren und so das 'Babylonische Exil' der Päpste zu beenden. Reiste nach Avignon und führte intensive Gespräche mit dem Papst.",
				},
				writings: {
					title: 'Schriften und früher Tod (1377-1380)',
					content:
						"Obwohl Analphabetin, diktierte sie über 380 Briefe und ihr Hauptwerk 'Der Dialog' - eines der großen mystischen Werke der Weltliteratur. Starb mit nur 33 Jahren in Rom, erschöpft von ihren Anstrengungen für die Kirche. 1461 heiliggesprochen, 1970 zur Kirchenlehrerin ernannt, 1999 zur Schutzpatronin Europas.",
				},
			},
			keyAchievements: [
				"Beendigung des 'Babylonischen Exils' der Päpste",
				'Erste Kirchenlehrerin der Geschichte',
				"Autorin des mystischen Werks 'Der Dialog'",
				'Schutzpatronin Europas und Italiens',
				'Politische Vermittlerin und Friedensstifterin',
			],
			famousQuote: 'Nichts Großes wird je ohne große Liebe erreicht.',
		},
		lifespan: {
			birth: '1347-03-25',
			death: '1380-04-29',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Michelangelo_Buonarroti_-_The_Torment_of_Saint_Anthony_-_Google_Art_Project.jpg/330px-Michelangelo_Buonarroti_-_The_Torment_of_Saint_Anthony_-_Google_Art_Project.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Michelangelo_Buonarroti_-_The_Torment_of_Saint_Anthony_-_Google_Art_Project.jpg/330px-Michelangelo_Buonarroti_-_The_Torment_of_Saint_Anthony_-_Google_Art_Project.jpg',
			credit: 'DcoetzeeBot',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'james-william',
		name: 'William James',
		profession: ['Psychologist', 'Philosopher'],
		biography: {
			short: 'Amerikanischer Psychologe und Philosoph, Begründer der amerikanischen Psychologie.',
			sections: {
				medicine: {
					title: 'Medizinstudium und Harvard-Anfänge (1869-1878)',
					content:
						"Studierte Medizin in Harvard, praktizierte aber nie als Arzt. 1875 begann er, Psychologie und Philosophie zu unterrichten. Richtete eines der ersten experimentellen Psychologie-Laboratorien in Amerika ein. Begann mit der Arbeit an seinem monumentalen Werk 'The Principles of Psychology'.",
				},
				psychology: {
					title: 'Durchbruch in der Psychologie (1878-1890)',
					content:
						"1890 veröffentlichte er 'The Principles of Psychology', das 12 Jahre Arbeit kostete und sofort zum Standardwerk wurde. Entwickelte die Bewusstseinsströmung-Theorie und revolutionierte das Verständnis von Emotionen, Gewohnheiten und dem Selbst. Begründete den Funktionalismus in der Psychologie.",
				},
				pragmatism: {
					title: 'Philosophischer Pragmatismus (1890-1910)',
					content:
						"Wandte sich zunehmend der Philosophie zu und wurde zum führenden Vertreter des Pragmatismus. 1902 erschien 'The Varieties of Religious Experience', eine bahnbrechende Studie über Spiritualität und Mystik. Lehrte, dass die Wahrheit einer Idee an ihren praktischen Konsequenzen gemessen werden sollte.",
				},
			},
			keyAchievements: [
				'Begründer der amerikanischen Psychologie',
				'Entwicklung der Bewusstseinsströmung-Theorie',
				'Hauptvertreter des philosophischen Pragmatismus',
				"Autor von 'The Principles of Psychology'",
				'Pionier der Religionspsychologie',
			],
			famousQuote:
				'Die größte Entdeckung meiner Generation ist, dass Menschen ihr Leben ändern können, indem sie ihre Geisteshaltung ändern.',
		},
		lifespan: {
			birth: '1842-01-11',
			death: '1910-08-26',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Houghton_MS_Am_1092_%281185%29_-_William_James.jpg/330px-Houghton_MS_Am_1092_%281185%29_-_William_James.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Houghton_MS_Am_1092_%281185%29_-_William_James.jpg/330px-Houghton_MS_Am_1092_%281185%29_-_William_James.jpg',
			credit: 'Rob at Houghton',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'nin-anais',
		name: 'Anaïs Nin',
		profession: ['Writer', 'Diarist'],
		biography: {
			short: 'Französisch-amerikanische Schriftstellerin, bekannt für ihre Tagebücher.',
			sections: {
				marriage: {
					title: 'Ehe und Paris (1920-1939)',
					content:
						'1923 heiratete sie den Bankier Hugh Parker Guiler und lebte in Paris. Dort bewegte sie sich in Künstlerkreisen und hatte Affären mit Henry Miller und anderen Schriftstellern. Begann eine Psychoanalyse bei Otto Rank und wurde selbst zur Analytikerin. Ihre Tagebücher wurden zu detaillierten Studien weiblicher Sexualität und Psyche.',
				},
				america: {
					title: 'Rückkehr nach Amerika (1939-1960)',
					content:
						'Kehrte wegen des Zweiten Weltkriegs nach Amerika zurück und lebte ein Doppelleben zwischen Ost- und Westküste. Hatte eine Bigamie-Beziehung mit dem Schauspieler Rupert Pole. Veröffentlichte ihre ersten Romane, die zunächst wenig Beachtung fanden. Ihre erotischen Geschichten entstanden als Auftragsarbeit.',
				},
				recognition: {
					title: 'Späte Anerkennung und Feminismus (1960-1977)',
					content:
						'In den 1960ern wurde sie von der Frauenbewegung und der Hippie-Generation entdeckt. Ihre Tagebücher, die ab 1966 veröffentlicht wurden, machten sie berühmt. Sie wurde zur Ikone des Feminismus und der sexuellen Befreiung. Starb 1977 in Los Angeles als anerkannte Pionierin der weiblichen Literatur.',
				},
			},
			keyAchievements: [
				'Pionierin der weiblichen Erotik-Literatur',
				'Über 60 Jahre kontinuierliche Tagebuchführung',
				'Ikone der Frauenbewegung',
				'Erste offen bisexuelle Autorin der Moderne',
				'Vorreiterin der literarischen Selbstreflexion',
			],
			famousQuote: 'Wir sehen die Dinge nicht, wie sie sind. Wir sehen sie, wie wir sind.',
		},
		lifespan: {
			birth: '1903-02-21',
			death: '1977-01-14',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Anais_Nin.jpg/330px-Anais_Nin.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Anais_Nin.jpg/330px-Anais_Nin.jpg',
			credit: 'Trev M',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'kabat-zinn-jon',
		name: 'Jon Kabat-Zinn',
		profession: ['Scientist', 'Meditation Teacher', 'Writer'],
		biography: {
			short:
				'Amerikanischer Medizinprofessor und Gründer der Achtsamkeitsbasierten Stressreduktion (MBSR).',
		},
		lifespan: {
			birth: '1944-06-05',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Ardha-Chandrasana_Yoga-Asana_Nina-Mel.jpg/330px-Ardha-Chandrasana_Yoga-Asana_Nina-Mel.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Ardha-Chandrasana_Yoga-Asana_Nina-Mel.jpg/330px-Ardha-Chandrasana_Yoga-Asana_Nina-Mel.jpg',
			credit: 'Chiswick Chap',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'kaestner-erich',
		name: 'Erich Kästner',
		profession: ['Writer', 'Poet', 'Screenwriter'],
		biography: {
			short: 'Deutscher Schriftsteller, Publizist, Drehbuchautor und Kabarettdichter.',
		},
		lifespan: {
			birth: '1899-02-23',
			death: '1974-07-29',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/ErichK%C3%A4stner1968.jpg/330px-ErichK%C3%A4stner1968.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/ErichK%C3%A4stner1968.jpg/330px-ErichK%C3%A4stner1968.jpg',
			credit: 'MoSchle',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'gide-andre',
		name: 'André Gide',
		profession: ['Writer', 'Nobel Laureate'],
		biography: {
			short: 'Französischer Schriftsteller und Literaturnobelpreisträger 1947.',
		},
		lifespan: {
			birth: '1869-11-22',
			death: '1951-02-19',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Andr%C3%A9_Gide.jpg/330px-Andr%C3%A9_Gide.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Andr%C3%A9_Gide.jpg/330px-Andr%C3%A9_Gide.jpg',
			credit: 'Materialscientist',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'claudius-matthias',
		name: 'Matthias Claudius',
		profession: ['Poet', 'Journalist'],
		biography: {
			short: "Deutscher Dichter und Journalist, bekannt als 'Wandsbecker Bote'.",
		},
		lifespan: {
			birth: '1740-08-15',
			death: '1815-01-21',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Portrait_claudius.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Portrait_claudius.jpg',
			credit: 'GeorgHH',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'swindoll-charles',
		name: 'Charles R. Swindoll',
		profession: ['Pastor', 'Author', 'Educator'],
		biography: {
			short: 'Amerikanischer evangelischer Pastor, Autor und Radioprediger.',
		},
		lifespan: {
			birth: '1934-10-18',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Ambox_important.svg/300px-Ambox_important.svg.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Ambox_important.svg/300px-Ambox_important.svg.png',
			credit: 'Penubag',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'machado-antonio',
		name: 'Antonio Machado',
		profession: ['Poet', 'Writer'],
		biography: {
			short: 'Spanischer Lyriker und einer der bedeutendsten Vertreter der Generación del 98.',
		},
		lifespan: {
			birth: '1875-07-26',
			death: '1939-02-22',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/2015-08-09-12h15_jmt-myc_collioure-tumba-machado-con-libro-marc-y-carmen_842x1122px-300ppi-PRINT-h95mm-1.2Mb.jpg/330px-2015-08-09-12h15_jmt-myc_collioure-tumba-machado-con-libro-marc-y-carmen_842x1122px-300ppi-PRINT-h95mm-1.2Mb.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/2015-08-09-12h15_jmt-myc_collioure-tumba-machado-con-libro-marc-y-carmen_842x1122px-300ppi-PRINT-h95mm-1.2Mb.jpg/330px-2015-08-09-12h15_jmt-myc_collioure-tumba-machado-con-libro-marc-y-carmen_842x1122px-300ppi-PRINT-h95mm-1.2Mb.jpg',
			credit: 'Marc.M',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'angelou-maya',
		name: 'Maya Angelou',
		profession: ['Poet', 'Civil Rights Activist', 'Writer'],
		biography: {
			short: 'Amerikanische Schriftstellerin, Dichterin und Bürgerrechtsaktivistin.',
			sections: {
				youngAdult: {
					title: 'Frühe Erwachsenenzeit (1944-1960)',
					content:
						'Wurde als Teenager Mutter, arbeitete als Straßenbahnschaffnerin, Tänzerin und Sängerin. Heiratete mehrmals und lebte zeitweise in Ghana. Diese vielfältigen Erfahrungen prägten ihre späteren Werke.',
				},
				activism: {
					title: 'Bürgerrechtsbewegung (1960-1968)',
					content:
						'Engagierte sich aktiv in der Bürgerrechtsbewegung, arbeitete mit Martin Luther King Jr. und Malcolm X zusammen. Lebte mehrere Jahre in Afrika und erlebte die Unabhängigkeitsbewegungen mit.',
				},
				literarySuccess: {
					title: 'Literarischer Durchbruch (1969-1990)',
					content:
						"1969 erschien 'I Know Why the Caged Bird Sings', das erste Buch ihrer siebenteiligen Autobiografie-Reihe. Das Werk wurde zu einem Klassiker der amerikanischen Literatur und machte sie international bekannt.",
				},
				laterYears: {
					title: 'Späte Jahre und Anerkennung (1990-2014)',
					content:
						"Erhielt zahlreiche Ehrendoktorwürden und Auszeichnungen. 1993 trug sie bei Bill Clintons Amtseinführung ihr Gedicht 'On the Pulse of Morning' vor. Lehrte als Professorin und inspirierte Generationen von Lesern.",
				},
			},
			keyAchievements: [
				"Autorin von 'I Know Why the Caged Bird Sings'",
				'Erste afroamerikanische Straßenbahnschaffnerin',
				'Bürgerrechtsaktivistin mit MLK und Malcolm X',
				'Über 50 Ehrendoktorwürden',
				'Presidential Medal of Freedom (2011)',
			],
			famousQuote:
				'Es gibt keinen größeren Ansporn in der Welt als die Begegnung mit Menschen, die an dich glauben.',
		},
		lifespan: {
			birth: '1928-04-04',
			death: '2014-05-28',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Angelou_Obama.jpg/330px-Angelou_Obama.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Angelou_Obama.jpg/330px-Angelou_Obama.jpg',
			credit: 'Ich',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'rand-ayn',
		name: 'Ayn Rand',
		profession: ['Philosopher', 'Novelist'],
		biography: {
			short: 'Russisch-amerikanische Schriftstellerin und Philosophin des Objektivismus.',
		},
		lifespan: {
			birth: '1905-02-02',
			death: '1982-03-06',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Aristotle_Altemps_Inv8575.jpg/330px-Aristotle_Altemps_Inv8575.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Aristotle_Altemps_Inv8575.jpg/330px-Aristotle_Altemps_Inv8575.jpg',
			credit: 'Jastrow',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'cicero',
		name: 'Marcus Tullius Cicero',
		profession: ['Statesman', 'Lawyer', 'Scholar', 'Rhetorician'],
		biography: {
			short: 'Römischer Politiker, Anwalt, Gelehrter und Redner.',
		},
		lifespan: {
			birth: '-106',
			death: '-43',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Assassinat_de_Cic%C3%A9ron.jpg/330px-Assassinat_de_Cic%C3%A9ron.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Assassinat_de_Cic%C3%A9ron.jpg/330px-Assassinat_de_Cic%C3%A9ron.jpg',
			credit: 'Racconish',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'sinatra-frank',
		name: 'Frank Sinatra',
		profession: ['Singer', 'Actor', 'Producer'],
		biography: {
			short: 'Amerikanischer Sänger, Schauspieler und Entertainer.',
		},
		lifespan: {
			birth: '1915-12-12',
			death: '1998-05-14',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/%28Portrait_of_Frank_Sinatra_and_Axel_Stordahl%2C_Liederkrantz_Hall%2C_New_York%2C_N.Y.%2C_ca._1947%29_%28LOC%29_%284843758568%29.jpg/330px-%28Portrait_of_Frank_Sinatra_and_Axel_Stordahl%2C_Liederkrantz_Hall%2C_New_York%2C_N.Y.%2C_ca._1947%29_%28LOC%29_%284843758568%29.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/%28Portrait_of_Frank_Sinatra_and_Axel_Stordahl%2C_Liederkrantz_Hall%2C_New_York%2C_N.Y.%2C_ca._1947%29_%28LOC%29_%284843758568%29.jpg/330px-%28Portrait_of_Frank_Sinatra_and_Axel_Stordahl%2C_Liederkrantz_Hall%2C_New_York%2C_N.Y.%2C_ca._1947%29_%28LOC%29_%284843758568%29.jpg',
			credit: 'Tholme',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'yeats-william',
		name: 'William Butler Yeats',
		profession: ['Poet', 'Dramatist', 'Writer'],
		biography: {
			short: 'Irischer Dichter und Dramatiker, Literaturnobelpreisträger 1923.',
		},
		lifespan: {
			birth: '1865-06-13',
			death: '1939-01-28',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Maudgonne.jpg/300px-Maudgonne.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Maudgonne.jpg/300px-Maudgonne.jpg',
			credit: 'File Upload Bot (Magnus Manske)',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'picasso-pablo',
		name: 'Pablo Picasso',
		profession: ['Artist', 'Painter', 'Sculptor'],
		biography: {
			short: 'Spanischer Maler, Grafiker und Bildhauer, Mitbegründer des Kubismus.',
		},
		lifespan: {
			birth: '1881-10-25',
			death: '1973-04-08',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/2004-09-07_1800x2400_chicago_picasso.jpg/330px-2004-09-07_1800x2400_chicago_picasso.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/2004-09-07_1800x2400_chicago_picasso.jpg/330px-2004-09-07_1800x2400_chicago_picasso.jpg',
			credit: 'Jcrocker',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'tracy-brian',
		name: 'Brian Tracy',
		profession: ['Motivational Speaker', 'Author', 'Business Coach'],
		biography: {
			short: 'Kanadisch-amerikanischer Motivationstrainer und Autor.',
		},
		lifespan: {
			birth: '1944-01-05',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/9/9a/Brian_Tracy_%284005302419%29_%28cropped%29.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Brian_Tracy_%284005302419%29_%28cropped%29.jpg',
			credit: 'TaurusEmerald',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'eliot-george',
		name: 'George Eliot',
		profession: ['Novelist', 'Poet', 'Journalist'],
		biography: {
			short: 'Englische Schriftstellerin des viktorianischen Zeitalters.',
		},
		lifespan: {
			birth: '1819-11-22',
			death: '1880-12-22',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/George_Eliot%2C_por_Fran%C3%A7ois_D%27Albert_Durade.jpg/330px-George_Eliot%2C_por_Fran%C3%A7ois_D%27Albert_Durade.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/George_Eliot%2C_por_Fran%C3%A7ois_D%27Albert_Durade.jpg/330px-George_Eliot%2C_por_Fran%C3%A7ois_D%27Albert_Durade.jpg',
			credit: 'Alonso de Mendoza',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'okakura-kakuzo',
		name: 'Okakura Kakuzō',
		profession: ['Scholar', 'Art Curator', 'Writer'],
		biography: {
			short: "Japanischer Gelehrter, Kunsthistoriker und Autor von 'Das Buch vom Tee'.",
		},
		lifespan: {
			birth: '1863-02-14',
			death: '1913-09-02',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/1965_La_Libro_de_Teo_1.jpeg/330px-1965_La_Libro_de_Teo_1.jpeg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/1965_La_Libro_de_Teo_1.jpeg/330px-1965_La_Libro_de_Teo_1.jpeg',
			credit: 'Forstbirdo',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'ali-muhammad',
		name: 'Muhammad Ali',
		profession: ['Boxer', 'Activist'],
		biography: {
			short:
				'Amerikanischer Boxer und Bürgerrechtsaktivist, dreifacher Schwergewichts-Weltmeister.',
		},
		lifespan: {
			birth: '1942-01-17',
			death: '2016-06-03',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/c/ce/0522_ma_big_%28cropped1%29.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/0522_ma_big_%28cropped1%29.jpg',
			credit: 'SecretName101',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'kafka-franz',
		name: 'Franz Kafka',
		profession: ['Writer', 'Lawyer'],
		biography: {
			short:
				'Deutschsprachiger Schriftsteller und einer der bedeutendsten Autoren des 20. Jahrhunderts.',
		},
		lifespan: {
			birth: '1883-07-03',
			death: '1924-06-03',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Czech-2013-Prague-Plaque_%28birthplace_of_Franz_Kafka%29.jpg/330px-Czech-2013-Prague-Plaque_%28birthplace_of_Franz_Kafka%29.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Czech-2013-Prague-Plaque_%28birthplace_of_Franz_Kafka%29.jpg/330px-Czech-2013-Prague-Plaque_%28birthplace_of_Franz_Kafka%29.jpg',
			credit: 'Godot13',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'buffett-jimmy',
		name: 'Jimmy Buffett',
		profession: ['Musician', 'Singer-songwriter', 'Author'],
		biography: {
			short: 'Amerikanischer Musiker, Sänger und Autor, bekannt für seinen tropischen Rock-Stil.',
		},
		lifespan: {
			birth: '1946-12-25',
			death: '2023-09-01',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Jimmy_Buffett_%281980_Promo_Photo%29.jpg/330px-Jimmy_Buffett_%281980_Promo_Photo%29.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Jimmy_Buffett_%281980_Promo_Photo%29.jpg/330px-Jimmy_Buffett_%281980_Promo_Photo%29.jpg',
			credit: 'PascalHD',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'coelho-paulo',
		name: 'Paulo Coelho',
		profession: ['Novelist', 'Lyricist'],
		biography: {
			short: "Brasilianischer Schriftsteller, bekannt für 'Der Alchimist'.",
		},
		lifespan: {
			birth: '1947-08-24',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Olivenkranz.png/330px-Olivenkranz.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Olivenkranz.png/330px-Olivenkranz.png',
			credit: 'Gabor~commonswiki',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'sallust',
		name: 'Gaius Sallustius Crispus',
		profession: ['Historian', 'Politician'],
		biography: {
			short: 'Römischer Geschichtsschreiber und Politiker der späten Republik.',
		},
		lifespan: {
			birth: '-86',
			death: '-35',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Houghton_MS_Richardson_17_-_Sallust_manuscript%2C_ca._1490%2C_f51.jpg/330px-Houghton_MS_Richardson_17_-_Sallust_manuscript%2C_ca._1490%2C_f51.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Houghton_MS_Richardson_17_-_Sallust_manuscript%2C_ca._1490%2C_f51.jpg/330px-Houghton_MS_Richardson_17_-_Sallust_manuscript%2C_ca._1490%2C_f51.jpg',
			credit: 'Rob at Houghton',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'ben-gurion-david',
		name: 'David Ben-Gurion',
		profession: ['Statesman', 'Prime Minister', 'Politician'],
		biography: {
			short: 'Israelischer Staatsmann und erster Ministerpräsident Israels.',
		},
		lifespan: {
			birth: '1886-10-16',
			death: '1973-12-01',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/1918_Private_BenGurion_volunteer_in_Jewish_Legion.jpg/330px-1918_Private_BenGurion_volunteer_in_Jewish_Legion.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/1918_Private_BenGurion_volunteer_in_Jewish_Legion.jpg/330px-1918_Private_BenGurion_volunteer_in_Jewish_Legion.jpg',
			credit: 'Andrew J.Kurbiko',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'rowling-jk',
		name: 'J.K. Rowling',
		profession: ['Author', 'Philanthropist'],
		biography: {
			short: 'Britische Schriftstellerin, bekannt für die Harry-Potter-Buchreihe.',
		},
		lifespan: {
			birth: '1965-07-31',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/c/c2/Books-aj.svg_aj_ashton_01.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Books-aj.svg_aj_ashton_01.png',
			credit: 'Niki K',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'pasteur-louis',
		name: 'Louis Pasteur',
		profession: ['Chemist', 'Microbiologist'],
		biography: {
			short: 'Französischer Chemiker und Mikrobiologe, Pionier der Keimtheorie und Impfung.',
		},
		lifespan: {
			birth: '1822-12-27',
			death: '1895-09-28',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Albert_Edelfelt_-_Louis_Pasteur_-_1885.jpg/330px-Albert_Edelfelt_-_Louis_Pasteur_-_1885.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Albert_Edelfelt_-_Louis_Pasteur_-_1885.jpg/330px-Albert_Edelfelt_-_Louis_Pasteur_-_1885.jpg',
			credit: 'Trycatch',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'garland-judy',
		name: 'Judy Garland',
		profession: ['Actress', 'Singer'],
		biography: {
			short:
				"Amerikanische Schauspielerin und Sängerin, bekannt für ihre Rolle in 'Der Zauberer von Oz'.",
		},
		lifespan: {
			birth: '1922-06-10',
			death: '1969-06-22',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Backstage_with_Judy_Garland_and_her_kids.png/330px-Backstage_with_Judy_Garland_and_her_kids.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Backstage_with_Judy_Garland_and_her_kids.png/330px-Backstage_with_Judy_Garland_and_her_kids.png',
			credit: 'Jorge Lobo Dos Santos',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'kneipp-sebastian',
		name: 'Sebastian Kneipp',
		profession: ['Priest', 'Hydrotherapist', 'Naturopath'],
		biography: {
			short: 'Deutscher Priester und Naturheilkundler, Begründer der Kneipp-Medizin.',
		},
		lifespan: {
			birth: '1821-05-17',
			death: '1897-06-17',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Bad_W%C3%B6rishofen_-_Kneippbrunnen_am_Kurpark_%282013-08-28_1669%29.JPG/330px-Bad_W%C3%B6rishofen_-_Kneippbrunnen_am_Kurpark_%282013-08-28_1669%29.JPG',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Bad_W%C3%B6rishofen_-_Kneippbrunnen_am_Kurpark_%282013-08-28_1669%29.JPG/330px-Bad_W%C3%B6rishofen_-_Kneippbrunnen_am_Kurpark_%282013-08-28_1669%29.JPG',
			credit: 'Spurzem',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'platon',
		name: 'Platon',
		profession: ['Philosopher', 'Mathematician'],
		biography: {
			short: 'Griechischer Philosoph und Schüler des Sokrates, Begründer der Akademie.',
		},
		lifespan: {
			birth: '-428',
			death: '-348',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/WPanthroponymy.svg/300px-WPanthroponymy.svg.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/WPanthroponymy.svg/300px-WPanthroponymy.svg.png',
			credit: 'Palosirkka',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'bergman-ingmar',
		name: 'Ingmar Bergman',
		profession: ['Film Director', 'Screenwriter', 'Theatre Director'],
		biography: {
			short:
				'Schwedischer Regisseur und Drehbuchautor, einer der bedeutendsten Filmemacher des 20. Jahrhunderts.',
		},
		lifespan: {
			birth: '1918-07-14',
			death: '2007-07-30',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Bergman_Sjostrom_1957.jpg/330px-Bergman_Sjostrom_1957.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Bergman_Sjostrom_1957.jpg/330px-Bergman_Sjostrom_1957.jpg',
			credit: 'Kaiketsu',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'johannes-paul-ii',
		name: 'Johannes Paul II.',
		profession: ['Pope', 'Philosopher', 'Theologian'],
		biography: {
			short: 'Polnischer Papst und Oberhaupt der katholischen Kirche von 1978 bis 2005.',
		},
		lifespan: {
			birth: '1920-05-18',
			death: '2005-04-02',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/046CupolaSPietro.jpg/330px-046CupolaSPietro.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/046CupolaSPietro.jpg/330px-046CupolaSPietro.jpg',
			credit: 'MarkusMark',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'milne-aa',
		name: 'A.A. Milne',
		profession: ['Author', 'Playwright', 'Poet'],
		biography: {
			short: 'Britischer Schriftsteller, bekannt für die Winnie-the-Pooh-Geschichten.',
			sections: {
				journalism: {
					title: 'Journalist und Dramatiker (1903-1914)',
					content:
						"Wurde Redakteur der Satirezeitschrift 'Punch' und schrieb erfolgreiche Theaterstücke. Heiratete Dorothy de Sélincourt und etablierte sich als respektierter Autor. Seine humorvolle Art fand großen Anklang.",
				},
				warTime: {
					title: 'Weltkrieg und Wandel (1914-1920)',
					content:
						'Diente im Ersten Weltkrieg als Offizier und wurde durch die Kriegserfahrungen zum Pazifisten. Die Geburt seines Sohnes Christopher Robin 1920 veränderte sein Leben und Schreiben grundlegend.',
				},
				poohCreation: {
					title: 'Winnie-the-Pooh wird geboren (1920-1928)',
					content:
						"Inspiriert von seinem Sohn und dessen Spielzeugtieren schrieb er 'Winnie-the-Pooh' (1926) und 'The House at Pooh Corner' (1928). Diese Bücher machten ihn weltberühmt, überschatteten aber auch sein restliches Werk.",
				},
				laterYears: {
					title: 'Späte Jahre und Vermächtnis (1928-1956)',
					content:
						'Schrieb weiterhin Theaterstücke und Romane, konnte aber nie wieder den Erfolg von Pooh erreichen. Sein Sohn hatte zeitweise ein schwieriges Verhältnis zu seinem berühmten literarischen Alter Ego.',
				},
			},
			keyAchievements: [
				'Schöpfer von Winnie-the-Pooh',
				'Erfolgreicher Dramatiker und Journalist',
				"Herausgeber der Satirezeitschrift 'Punch'",
				'Autor zeitloser Kindergedichte',
				'Pazifist und Friedensaktivist',
			],
			famousQuote:
				'Manche Menschen sprechen mit Tieren. Nicht viele hören zu. Das ist das Problem.',
		},
		lifespan: {
			birth: '1882-01-18',
			death: '1956-01-31',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/A._A._Milne_plaque.jpg/330px-A._A._Milne_plaque.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/A._A._Milne_plaque.jpg/330px-A._A._Milne_plaque.jpg',
			credit: 'Megalit',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'schweitzer-albert',
		name: 'Albert Schweitzer',
		profession: ['Theologian', 'Physician', 'Philosopher', 'Organist'],
		biography: {
			short: 'Deutsch-französischer Arzt, Theologe, Philosoph und Friedensnobelpreisträger.',
			sections: {
				calling: {
					title: 'Berufung nach Afrika (1905-1913)',
					content:
						'Inspiriert von einem Artikel über medizinische Not in Äquatorialafrika, beschloss er Medizin zu studieren. Gegen alle Widerstände absolvierte er das Medizinstudium und bereitete sich auf seine Mission in Afrika vor.',
				},
				lambarene: {
					title: 'Lambaréné - Das Urwaldhospital (1913-1965)',
					content:
						'Gründete 1913 mit seiner Frau Helene ein Hospital in Lambaréné, Gabun. Trotz Internierung im 1. Weltkrieg kehrte er immer wieder zurück und baute das Hospital zu einem medizinischen Zentrum aus. Behandelte zehntausende Patienten.',
				},
				philosophy: {
					title: 'Ehrfurcht vor dem Leben',
					content:
						"Entwickelte seine Ethik der 'Ehrfurcht vor dem Leben' während einer Bootsfahrt auf dem Ogowe-Fluss 1915. Diese Philosophie wurde zur Grundlage seines Handelns und beeinflusste die moderne Bioethik und Umweltbewegung.",
				},
				recognition: {
					title: 'Weltweite Anerkennung (1950-1965)',
					content:
						'Erhielt 1952 den Friedensnobelpreis für sein humanitäres Werk. Setzte sich gegen Atomwaffentests ein und warnte vor den Gefahren der Kernenergie. Starb 1965 in Lambaréné, wo er 52 Jahre seines Lebens verbracht hatte.',
				},
			},
			keyAchievements: [
				'Gründung des Urwaldhospitals Lambaréné',
				"Entwicklung der Ethik 'Ehrfurcht vor dem Leben'",
				'Friedensnobelpreis 1952',
				'Bach-Forscher und Orgelexperte',
				'Atomwaffen-Kritiker und Friedensaktivist',
			],
			famousQuote: 'Ethik ist nichts anderes als Ehrfurcht vor dem Leben.',
		},
		lifespan: {
			birth: '1875-01-14',
			death: '1965-09-04',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Albert-Schweitzer-Haus.jpg/330px-Albert-Schweitzer-Haus.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Albert-Schweitzer-Haus.jpg/330px-Albert-Schweitzer-Haus.jpg',
			credit: 'Pb 2001~commonswiki',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'laozi',
		name: 'Laozi',
		profession: ['Philosopher', 'Writer'],
		biography: {
			short: 'Chinesischer Philosoph und Begründer des Daoismus.',
		},
		lifespan: {
			birth: '-604',
			death: '-531',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Confucius_and_Laozi%2C_fresco_from_a_Western_Han_tomb_of_Dongping_County%2C_Shandong_province%2C_China.jpg/330px-Confucius_and_Laozi%2C_fresco_from_a_Western_Han_tomb_of_Dongping_County%2C_Shandong_province%2C_China.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Confucius_and_Laozi%2C_fresco_from_a_Western_Han_tomb_of_Dongping_County%2C_Shandong_province%2C_China.jpg/330px-Confucius_and_Laozi%2C_fresco_from_a_Western_Han_tomb_of_Dongping_County%2C_Shandong_province%2C_China.jpg',
			credit: 'PericlesofAthens',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'gump-forrest',
		name: 'Forrest Gump',
		profession: ['Fictional Character'],
		biography: {
			short: 'Fiktiver Charakter aus dem gleichnamigen Film von 1994.',
		},
		lifespan: {
			birth: 'fictional',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/ForrestGump-Jenny-Boat-2055.jpg/330px-ForrestGump-Jenny-Boat-2055.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/ForrestGump-Jenny-Boat-2055.jpg/330px-ForrestGump-Jenny-Boat-2055.jpg',
			credit: 'Alonso de Mendoza',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'liebknecht-karl',
		name: 'Karl Liebknecht',
		profession: ['Politician', 'Lawyer', 'Revolutionary'],
		biography: {
			short: 'Deutscher Politiker, Mitbegründer der KPD und Kämpfer gegen den Ersten Weltkrieg.',
		},
		lifespan: {
			birth: '1871-08-13',
			death: '1919-01-15',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Berlin_sockel_liebknecht-denkmal.jpg/330px-Berlin_sockel_liebknecht-denkmal.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Berlin_sockel_liebknecht-denkmal.jpg/330px-Berlin_sockel_liebknecht-denkmal.jpg',
			credit: 'BLueFiSH.as',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'adler-alfred',
		name: 'Alfred Adler',
		profession: ['Psychologist', 'Psychiatrist', 'Psychotherapist'],
		biography: {
			short: 'Österreichischer Arzt und Psychotherapeut, Begründer der Individualpsychologie.',
		},
		lifespan: {
			birth: '1870-02-07',
			death: '1937-05-28',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Alfred_Adler1.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Alfred_Adler1.png',
			credit: 'Calliopejen',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'german-proverb',
		name: 'Deutsches Sprichwort',
		profession: ['Traditional Saying'],
		biography: {
			short: 'Traditionelle deutsche Volksweisheit.',
		},
		lifespan: {
			birth: 'traditional',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Coat_of_arms_of_Germany.svg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Coat_of_arms_of_Germany.svg',
			credit: 'Wikipedia',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'covey-stephen',
		name: 'Stephen Covey',
		profession: ['Author', 'Educator', 'Businessman'],
		biography: {
			short:
				"Amerikanischer Autor und Unternehmensberater, bekannt für 'Die 7 Wege zur Effektivität'.",
		},
		lifespan: {
			birth: '1932-10-24',
			death: '2012-07-16',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Stephen_Covey_174-CD-L05-03-02A-002_%28cropped%29.jpg/330px-Stephen_Covey_174-CD-L05-03-02A-002_%28cropped%29.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Stephen_Covey_174-CD-L05-03-02A-002_%28cropped%29.jpg/330px-Stephen_Covey_174-CD-L05-03-02A-002_%28cropped%29.jpg',
			credit: 'TaurusEmerald',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'lincoln-abraham',
		name: 'Abraham Lincoln',
		profession: ['President', 'Lawyer', 'Statesman'],
		biography: {
			short:
				'16. Präsident der Vereinigten Staaten, führte das Land durch den Bürgerkrieg und schaffte die Sklaverei ab.',
		},
		lifespan: {
			birth: '1809-02-12',
			death: '1865-04-15',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/18610304_Affairs_of_the_Nation_-_Abraham_Lincoln_inauguration_-_The_New_York_Times.jpg/330px-18610304_Affairs_of_the_Nation_-_Abraham_Lincoln_inauguration_-_The_New_York_Times.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/18610304_Affairs_of_the_Nation_-_Abraham_Lincoln_inauguration_-_The_New_York_Times.jpg/330px-18610304_Affairs_of_the_Nation_-_Abraham_Lincoln_inauguration_-_The_New_York_Times.jpg',
			credit: 'RCraig09',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'king-bb',
		name: 'B.B. King',
		profession: ['Musician', 'Singer', 'Guitarist'],
		biography: {
			short:
				'Amerikanischer Blues-Musiker und Gitarrist, einer der einflussreichsten Blues-Künstler aller Zeiten.',
		},
		lifespan: {
			birth: '1925-09-16',
			death: '2015-05-14',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/B.B._King_Hamburg_1971.jpg/330px-B.B._King_Hamburg_1971.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/B.B._King_Hamburg_1971.jpg/330px-B.B._King_Hamburg_1971.jpg',
			credit: 'Waterborough',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'matisse-henri',
		name: 'Henri Matisse',
		profession: ['Artist', 'Painter', 'Sculptor'],
		biography: {
			short: 'Französischer Maler, Grafiker und Bildhauer, einer der Hauptvertreter des Fauvismus.',
		},
		lifespan: {
			birth: '1869-12-31',
			death: '1954-11-03',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Atelier_rouge_matisse_1.jpg/330px-Atelier_rouge_matisse_1.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Atelier_rouge_matisse_1.jpg/330px-Atelier_rouge_matisse_1.jpg',
			credit: 'Braaark',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'chinese-proverb',
		name: 'Chinesisches Sprichwort',
		profession: ['Traditional Saying'],
		biography: {
			short: 'Traditionelle chinesische Volksweisheit.',
		},
		lifespan: {
			birth: 'traditional',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/2/24/Chinese_dragon_asset_heraldry.svg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Chinese_dragon_asset_heraldry.svg',
			credit: 'Wikipedia',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'buddha',
		name: 'Buddha',
		profession: ['Spiritual Teacher', 'Philosopher'],
		biography: {
			short: 'Begründer des Buddhismus und spiritueller Lehrer.',
		},
		lifespan: {
			birth: '-563',
			death: '-483',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/023_Vairocana_Buddha%2C_9c%2C_Srivijaya_%2835212721926%29.jpg/330px-023_Vairocana_Buddha%2C_9c%2C_Srivijaya_%2835212721926%29.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/023_Vairocana_Buddha%2C_9c%2C_Srivijaya_%2835212721926%29.jpg/330px-023_Vairocana_Buddha%2C_9c%2C_Srivijaya_%2835212721926%29.jpg',
			credit: 'Anandajoti',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'shaw-bernard',
		name: 'George Bernard Shaw',
		profession: ['Playwright', 'Critic', 'Political Activist'],
		biography: {
			short:
				'Irischer Dramatiker und Literaturnobelpreisträger, bekannt für seinen Witz und soziale Kritik.',
		},
		lifespan: {
			birth: '1856-07-26',
			death: '1950-11-02',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/en/3/30/Bernard-Shaw-ILN-1911-original.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/en/3/30/Bernard-Shaw-ILN-1911-original.jpg',
			credit: 'Wikipedia',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'beuys-joseph',
		name: 'Joseph Beuys',
		profession: ['Artist', 'Sculptor', 'Performance Artist'],
		biography: {
			short:
				'Deutscher Aktionskünstler, Bildhauer und Zeichner, bekannt für seine erweiterte Definition von Kunst.',
		},
		lifespan: {
			birth: '1921-05-12',
			death: '1986-01-23',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/7/78/7thousand_oaks.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/7/78/7thousand_oaks.jpg',
			credit: 'Mdd',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'rousseau-jean',
		name: 'Jean-Jacques Rousseau',
		profession: ['Philosopher', 'Writer', 'Composer'],
		biography: {
			short:
				'Genfer Philosoph und Schriftsteller der Aufklärung, Wegbereiter der Französischen Revolution.',
		},
		lifespan: {
			birth: '1712-06-28',
			death: '1778-07-02',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Allan_Ramsay_-_Jean-Jacques_Rousseau_%281712_-_1778%29_-_Google_Art_Project.jpg/330px-Allan_Ramsay_-_Jean-Jacques_Rousseau_%281712_-_1778%29_-_Google_Art_Project.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Allan_Ramsay_-_Jean-Jacques_Rousseau_%281712_-_1778%29_-_Google_Art_Project.jpg/330px-Allan_Ramsay_-_Jean-Jacques_Rousseau_%281712_-_1778%29_-_Google_Art_Project.jpg',
			credit: '0m9Ep',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'moliere',
		name: 'Molière',
		profession: ['Playwright', 'Actor'],
		biography: {
			short:
				'Französischer Dramatiker und Schauspieler, einer der größten Komödiendichter der Weltliteratur.',
		},
		lifespan: {
			birth: '1622-01-15',
			death: '1673-02-17',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Jean-L%C3%A9on_G%C3%A9r%C3%B4me_-_Louis_XIV_and_Moliere.jpg/330px-Jean-L%C3%A9on_G%C3%A9r%C3%B4me_-_Louis_XIV_and_Moliere.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Jean-L%C3%A9on_G%C3%A9r%C3%B4me_-_Louis_XIV_and_Moliere.jpg/330px-Jean-L%C3%A9on_G%C3%A9r%C3%B4me_-_Louis_XIV_and_Moliere.jpg',
			credit: 'Ctac',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'kay-alan',
		name: 'Alan Kay',
		profession: ['Computer Scientist', 'Educator'],
		biography: {
			short:
				'Amerikanischer Informatiker, Pionier der objektorientierten Programmierung und Visionär der Personal Computer.',
			sections: {
				xeroxParc: {
					title: 'Revolution bei Xerox PARC (1970-1981)',
					content:
						'Am Xerox Palo Alto Research Center entwickelte Kay das Dynabook-Konzept - eine Vision eines tragbaren Computers für Kinder. Mit seinem Team schuf er Smalltalk, die erste rein objektorientierte Programmiersprache, und entwickelte die grafische Benutzeroberfläche mit Fenstern, Icons und Maussteuerung, die später Apple und Microsoft inspirierten.',
				},
				philosophy: {
					title: 'Philosophie und Vision',
					content:
						"Kay prägte den Satz 'The best way to predict the future is to invent it'. Seine Vision vom Computer als 'Verstärker des menschlichen Intellekts' und sein Fokus auf intuitive, kinderfreundliche Interfaces revolutionierten die Mensch-Computer-Interaktion. Er sieht Computer nicht als Werkzeuge, sondern als neue Medien für kreatives Denken.",
				},
				laterCareer: {
					title: 'Spätere Karriere',
					content:
						'Nach Xerox arbeitete Kay bei Atari, Apple, Disney Imagineering und HP Labs. Er setzte sich kontinuierlich für bessere Bildungstechnologie ein und entwickelte Squeak und Etoys für den Unterricht. Als Fellow bei Viewpoints Research Institute arbeitet er weiterhin an revolutionären Ideen für die Zukunft des Computing.',
				},
			},
			keyAchievements: [
				'Miterfinder der objektorientierten Programmierung',
				'Schöpfer der Programmiersprache Smalltalk',
				'Pionier der grafischen Benutzeroberfläche',
				'Dynabook-Konzept als Vorläufer des Laptops',
				'Turing Award (2003) für bahnbrechende Arbeiten',
			],
			famousQuote: 'The best way to predict the future is to invent it.',
		},
		lifespan: {
			birth: '1940-05-17',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Alan_Kay_-_Receiving_the_Kyoto_Prize.jpg/330px-Alan_Kay_-_Receiving_the_Kyoto_Prize.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Alan_Kay_-_Receiving_the_Kyoto_Prize.jpg/330px-Alan_Kay_-_Receiving_the_Kyoto_Prize.jpg',
			credit: 'Rythojo',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'saunders-cicely',
		name: 'Cicely Saunders',
		profession: ['Nurse', 'Physician', 'Social Worker'],
		biography: {
			short: 'Britische Ärztin und Begründerin der modernen Hospizbewegung und Palliativmedizin.',
		},
		lifespan: {
			birth: '1918-06-22',
			death: '2005-07-14',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/EWS21.13.jpg/330px-EWS21.13.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/EWS21.13.jpg/330px-EWS21.13.jpg',
			credit: 'Pigsonthewing',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'augustinus',
		name: 'Aurelius Augustinus',
		profession: ['Theologian', 'Philosopher', 'Bishop'],
		biography: {
			short:
				'Römischer Kirchenlehrer und einer der bedeutendsten christlichen Theologen und Philosophen.',
			sections: {
				conversion: {
					title: 'Bekehrung und Taufe (386-391)',
					content:
						"Nach einer tiefen spirituellen Krise bekehrte er sich 386 zum Christentum. Die berühmte Szene im Garten mit der Kinderstimme 'Tolle, lege' (Nimm und lies) markierte den Wendepunkt. 387 ließ er sich von Bischof Ambrosius taufen.",
				},
				priest: {
					title: 'Priester und Bischof (391-430)',
					content:
						'391 zum Priester geweiht, wurde er 396 Bischof von Hippo Regius. Führte die Diözese mit großer Energie, predigte täglich, kümmerte sich um die Armen und verteidigte den christlichen Glauben gegen verschiedene Häresien.',
				},
				theologian: {
					title: 'Theologische Hauptwerke',
					content:
						"Verfasste über 100 Bücher und 500 Predigten. Seine 'Confessiones' gelten als erste Autobiografie der Weltliteratur. 'De civitate Dei' (Der Gottesstaat) entwickelte eine christliche Geschichtstheologie und beeinflusste das mittelalterliche Denken grundlegend.",
				},
				legacy: {
					title: 'Vermächtnis',
					content:
						'Seine Lehre von der Erbsünde, der Gnadenlehre und der Prädestination prägte das westliche Christentum. Sowohl die katholische als auch die protestantische Theologie berufen sich auf ihn. Gilt als Brückenbauer zwischen Antike und Mittelalter.',
				},
			},
			keyAchievements: [
				"Verfassung der 'Confessiones'",
				"Hauptwerk 'De civitate Dei'",
				'Entwicklung der Gnadenlehre',
				'Bekämpfung des Manichäismus und Donatismus',
				'Einfluss auf mittelalterliche Scholastik',
			],
			famousQuote:
				'Du hast uns zu dir hin geschaffen, und unruhig ist unser Herz, bis es Ruhe findet in dir.',
		},
		lifespan: {
			birth: '354-11-13',
			death: '430-08-28',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/046CupolaSPietro.jpg/330px-046CupolaSPietro.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/046CupolaSPietro.jpg/330px-046CupolaSPietro.jpg',
			credit: 'MarkusMark',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'bach-richard',
		name: 'Richard Bach',
		profession: ['Writer', 'Pilot'],
		biography: {
			short: "Amerikanischer Schriftsteller und Pilot, bekannt für 'Die Möwe Jonathan'.",
		},
		lifespan: {
			birth: '1936-06-23',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Dick_Bach_take_off_in_Lynn_Garrison%27s_Fokker_D-V11.png/330px-Dick_Bach_take_off_in_Lynn_Garrison%27s_Fokker_D-V11.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Dick_Bach_take_off_in_Lynn_Garrison%27s_Fokker_D-V11.png/330px-Dick_Bach_take_off_in_Lynn_Garrison%27s_Fokker_D-V11.png',
			credit: 'LynnGarrison9281',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'chaplin-charlie',
		name: 'Charlie Chaplin',
		profession: ['Actor', 'Director', 'Composer'],
		biography: {
			short: 'Britischer Komiker, Schauspieler und Regisseur, eine Ikone der Stummfilmära.',
		},
		lifespan: {
			birth: '1889-04-16',
			death: '1977-12-25',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/9/93/Chaplin_City_Lights_still.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Chaplin_City_Lights_still.jpg',
			credit: 'Loeba',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'keller-gottfried',
		name: 'Gottfried Keller',
		profession: ['Writer', 'Poet'],
		biography: {
			short: 'Schweizer Dichter und Schriftsteller des Realismus.',
		},
		lifespan: {
			birth: '1819-07-19',
			death: '1890-07-15',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Gottfried_Keller_1860.jpeg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Gottfried_Keller_1860.jpeg',
			credit: 'Svencb',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'fromm-erich',
		name: 'Erich Fromm',
		profession: ['Psychologist', 'Philosopher', 'Social Psychologist'],
		biography: {
			short: 'Deutsch-amerikanischer Psychoanalytiker, Philosoph und Sozialpsychologe.',
		},
		lifespan: {
			birth: '1900-03-23',
			death: '1980-03-18',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/AdornoHorkheimerHabermasbyJeremyJShapiro2.png/330px-AdornoHorkheimerHabermasbyJeremyJShapiro2.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/AdornoHorkheimerHabermasbyJeremyJShapiro2.png/330px-AdornoHorkheimerHabermasbyJeremyJShapiro2.png',
			credit: 'Doug4',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'skinner-bf',
		name: 'B.F. Skinner',
		profession: ['Psychologist', 'Behaviorist', 'Author'],
		biography: {
			short: 'Amerikanischer Psychologe und Hauptvertreter des Behaviorismus.',
		},
		lifespan: {
			birth: '1904-03-20',
			death: '1990-08-18',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/B.F._Skinner_at_Harvard_circa_1950_%28cropped%29.jpg/330px-B.F._Skinner_at_Harvard_circa_1950_%28cropped%29.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/B.F._Skinner_at_Harvard_circa_1950_%28cropped%29.jpg/330px-B.F._Skinner_at_Harvard_circa_1950_%28cropped%29.jpg',
			credit: 'FMSky',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'brown-les',
		name: 'Les Brown',
		profession: ['Motivational Speaker', 'Author', 'Radio DJ'],
		biography: {
			short: 'Amerikanischer Motivationsredner und Autor.',
		},
		lifespan: {
			birth: '1945-02-17',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Disambig_gray.svg/300px-Disambig_gray.svg.png',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Disambig_gray.svg/300px-Disambig_gray.svg.png',
			credit: 'Ladsgroup',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'kästner-erich',
		name: 'Erich Kästner',
		profession: ['Writer', 'Poet', 'Screenwriter'],
		biography: {
			short:
				'Deutscher Schriftsteller, Publizist und Drehbuchautor, bekannt für seine Kinderbücher.',
		},
		lifespan: {
			birth: '1899-02-23',
			death: '1974-07-29',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/ErichK%C3%A4stner1968.jpg/330px-ErichK%C3%A4stner1968.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/ErichK%C3%A4stner1968.jpg/330px-ErichK%C3%A4stner1968.jpg',
			credit: 'MoSchle',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'lloyd-frank',
		name: 'Frank Lloyd Wright',
		profession: ['Architect', 'Designer', 'Writer'],
		biography: {
			short: 'Amerikanischer Architekt und Hauptvertreter der organischen Architektur.',
		},
		lifespan: {
			birth: '1867-06-08',
			death: '1959-04-09',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Arthur_Heurtley_House_%281902%29%2C_Oak_Park%2C_IL.JPG/330px-Arthur_Heurtley_House_%281902%29%2C_Oak_Park%2C_IL.JPG',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Arthur_Heurtley_House_%281902%29%2C_Oak_Park%2C_IL.JPG/330px-Arthur_Heurtley_House_%281902%29%2C_Oak_Park%2C_IL.JPG',
			credit: 'Steven Kevil',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'morgenstern-christian',
		name: 'Christian Morgenstern',
		profession: ['Poet', 'Writer'],
		biography: {
			short: 'Deutscher Dichter und Schriftsteller, bekannt für seine humoristische Lyrik.',
		},
		lifespan: {
			birth: '1871-05-06',
			death: '1914-03-31',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Morgenstern-h420.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Morgenstern-h420.jpg',
			credit: 'Jofi~commonswiki',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'heraclit',
		name: 'Heraklit',
		profession: ['Philosopher'],
		biography: {
			short: 'Vorsokratischer Philosoph aus Ephesos, bekannt für seine Lehre vom ewigen Wandel.',
		},
		lifespan: {
			birth: '-540',
			death: '-480',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'democrit',
		name: 'Demokrit',
		profession: ['Philosopher'],
		biography: {
			short: 'Griechischer Philosoph und Vorsokratiker, bekannt für die Atomtheorie.',
		},
		lifespan: {
			birth: '-460',
			death: '-370',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'unbekannt',
		name: 'Unbekannt',
		profession: ['Verschiedene'],
		biography: {
			short: 'Autor unbekannt oder Volksweisheit.',
		},
		verified: false,
	},
	{
		id: 'shakespeare-william',
		name: 'William Shakespeare',
		profession: ['Dramatiker', 'Dichter', 'Schauspieler'],
		biography: {
			short:
				'Englischer Dramatiker, Lyriker und Schauspieler, gilt als größter Schriftsteller der englischen Sprache.',
			long: 'William Shakespeare (1564-1616) war ein englischer Dramatiker, Lyriker und Schauspieler. Seine Komödien und Tragödien gehören zu den bedeutendsten und am häufigsten aufgeführten und verfilmten Bühnenstücken der Weltliteratur. Sein überliefertes Gesamtwerk umfasst 38 Dramen, epische Versdichtungen sowie 154 Sonette.',
			keyAchievements: [
				'Verfasste 38 Theaterstücke',
				'Schrieb 154 Sonette',
				'Prägte die englische Sprache mit über 1.700 neuen Wörtern',
				'Werke wie Hamlet, Romeo und Julia, Macbeth sind Weltliteratur',
			],
		},
		lifespan: {
			birth: '1564-04-26',
			death: '1616-04-23',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'twain-mark',
		name: 'Mark Twain',
		profession: ['Schriftsteller', 'Humorist'],
		biography: {
			short:
				'Amerikanischer Schriftsteller und Humorist, bekannt für Tom Sawyer und Huckleberry Finn.',
			long: "Mark Twain (1835-1910), eigentlich Samuel Langhorne Clemens, war ein amerikanischer Schriftsteller. Er ist vor allem als Autor der Bücher über die Abenteuer von Tom Sawyer und Huckleberry Finn bekannt. Twain gilt als einer der bedeutendsten amerikanischen Autoren und wird oft als 'der größte amerikanische Humorist seiner Zeit' bezeichnet.",
			keyAchievements: [
				'Schrieb Die Abenteuer des Tom Sawyer',
				'Verfasste Die Abenteuer des Huckleberry Finn',
				'Prägte die amerikanische Literatur',
				'Meister des literarischen Humors',
			],
		},
		lifespan: {
			birth: '1835-11-30',
			death: '1910-04-21',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'freud-sigmund',
		name: 'Sigmund Freud',
		profession: ['Neurologe', 'Tiefenpsychologe', 'Kulturtheoretiker'],
		biography: {
			short: 'Österreichischer Neurologe und Begründer der Psychoanalyse.',
			long: 'Sigmund Freud (1856-1939) war ein österreichischer Neurologe, Tiefenpsychologe, Kulturtheoretiker und Religionskritiker. Er ist der Begründer der Psychoanalyse und gilt als einer der einflussreichsten Denker des 20. Jahrhunderts. Seine Theorien und Methoden werden bis heute diskutiert und angewendet.',
			keyAchievements: [
				'Begründete die Psychoanalyse',
				'Entwickelte das Strukturmodell der Psyche (Es, Ich, Über-Ich)',
				'Schrieb Die Traumdeutung',
				'Revolutionierte das Verständnis des Unbewussten',
			],
		},
		lifespan: {
			birth: '1856-05-06',
			death: '1939-09-23',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'heraklit',
		name: 'Heraklit',
		profession: ['Philosoph'],
		biography: {
			short: 'Griechischer vorsokratischer Philosoph, bekannt für die Lehre vom ewigen Wandel.',
			long: "Heraklit von Ephesos (um 520–460 v. Chr.) war ein vorsokratischer Philosoph aus dem ionischen Ephesos. Er gehört zu den bedeutendsten Philosophen der Antike. Heraklit ist vor allem für seinen Ausspruch 'Alles fließt' (panta rhei) bekannt, obwohl dieser wörtlich nicht überliefert ist.",
			keyAchievements: [
				'Lehre vom ewigen Wandel (panta rhei)',
				'Konzept des Logos als Weltvernunft',
				'Einheit der Gegensätze',
				'Beeinflusste die stoische Philosophie',
			],
		},
		lifespan: {
			birth: '-520',
			death: '-460',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'wittgenstein-ludwig',
		name: 'Ludwig Wittgenstein',
		profession: ['Philosoph', 'Logiker'],
		biography: {
			short:
				'Österreichisch-britischer Philosoph, einer der einflussreichsten Philosophen des 20. Jahrhunderts.',
			long: 'Ludwig Wittgenstein (1889-1951) war einer der bedeutendsten Philosophen des 20. Jahrhunderts. Er lieferte bedeutende Beiträge zur Philosophie der Logik, der Sprache und des Bewusstseins. Seine beiden Hauptwerke, der Tractatus Logico-Philosophicus und die Philosophischen Untersuchungen, prägten zwei unterschiedliche Phasen der analytischen Philosophie.',
			keyAchievements: [
				'Verfasste den Tractatus Logico-Philosophicus',
				'Schrieb die Philosophischen Untersuchungen',
				'Entwickelte die Sprachspieltheorie',
				'Prägte die analytische Philosophie',
			],
		},
		lifespan: {
			birth: '1889-04-26',
			death: '1951-04-29',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'sartre-jean-paul',
		name: 'Jean-Paul Sartre',
		profession: ['Philosoph', 'Schriftsteller'],
		biography: {
			short: 'Französischer Philosoph und Schriftsteller, Hauptvertreter des Existentialismus.',
			long: 'Jean-Paul Sartre (1905-1980) war ein französischer Philosoph und Schriftsteller. Er gilt als der Hauptvertreter des Existentialismus und war einer der einflussreichsten Intellektuellen des 20. Jahrhunderts. 1964 lehnte er den Nobelpreis für Literatur ab.',
			keyAchievements: [
				'Hauptwerk Das Sein und das Nichts',
				'Entwickelte den atheistischen Existentialismus',
				'Schrieb Das Theaterstück Die geschlossene Gesellschaft',
				'Lehnte 1964 den Nobelpreis für Literatur ab',
			],
		},
		lifespan: {
			birth: '1905-06-21',
			death: '1980-04-15',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'van-gogh-vincent',
		name: 'Vincent van Gogh',
		profession: ['Maler', 'Künstler'],
		biography: {
			short: 'Niederländischer Maler und Zeichner, einer der Begründer der modernen Malerei.',
			long: 'Vincent van Gogh (1853-1890) war ein niederländischer Maler und Zeichner. Er gilt als einer der Begründer der modernen Malerei. Zu Lebzeiten verkaufte er nur ein einziges Bild, heute zählen seine Werke zu den teuersten der Welt. In nur zehn Jahren schuf er fast 900 Gemälde und über 1000 Zeichnungen.',
			keyAchievements: [
				'Schuf etwa 900 Gemälde in 10 Jahren',
				'Malte Die Sternennacht',
				'Prägte den Post-Impressionismus',
				'Beeinflusste die moderne Kunst nachhaltig',
			],
		},
		lifespan: {
			birth: '1853-03-30',
			death: '1890-07-29',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'schiller-friedrich',
		name: 'Friedrich Schiller',
		profession: ['Dichter', 'Dramatiker', 'Philosoph'],
		biography: {
			short:
				'Deutscher Dichter, Philosoph und Historiker, einer der bedeutendsten deutschen Dramatiker.',
			long: 'Friedrich Schiller (1759-1805) war ein deutscher Dichter, Philosoph und Historiker. Er gilt als einer der bedeutendsten deutschen Dramatiker, Lyriker und Essayisten. Zusammen mit Goethe prägte er die Weimarer Klassik. Seine Dramen gehören noch heute zu den meistgespielten deutschen Bühnenwerken.',
			keyAchievements: [
				'Schrieb Die Räuber, Wilhelm Tell, Maria Stuart',
				'Verfasste die Ode An die Freude',
				'Prägte mit Goethe die Weimarer Klassik',
				'Professor für Geschichte in Jena',
			],
		},
		lifespan: {
			birth: '1759-11-10',
			death: '1805-05-09',
		},
		verified: true,
		featured: true,
	},
	{
		id: 'hippokrates',
		name: 'Hippokrates',
		profession: ['Arzt', 'Philosoph'],
		biography: {
			short: 'Griechischer Arzt, gilt als Begründer der Medizin als Wissenschaft.',
			long: "Hippokrates von Kos (um 460-370 v. Chr.) war ein griechischer Arzt und gilt als der berühmteste Arzt des Altertums und 'Vater der Medizin'. Er begründete die rationale Medizin und befreite sie von religiösen und magischen Vorstellungen. Der hippokratische Eid ist noch heute die Grundlage der ärztlichen Ethik.",
			keyAchievements: [
				'Begründer der wissenschaftlichen Medizin',
				'Verfasser des Corpus Hippocraticum',
				'Schuf den Hippokratischen Eid',
				'Entwickelte die Humoralpathologie',
			],
		},
		lifespan: {
			birth: '-460',
			death: '-370',
		},
		verified: true,
		featured: false,
	},
];
