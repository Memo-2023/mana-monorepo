import { Author } from '../../contentLoader';

export const authorsEN: Author[] = [
	{
		id: 'einstein-albert',
		name: 'Albert Einstein',
		profession: ['Physicist', 'Philosopher'],
		biography: {
			short: 'Theoretical physicist who developed the theory of relativity.',
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
		profession: ['Writer', 'Pilot'],
		biography: {
			short: "French writer and pilot, known for 'The Little Prince'.",
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
			short: 'First Chancellor of West Germany and co-founder of the CDU.',
			sections: {
				riseToProminence: {
					title: 'Mayor of Cologne (1917-1933)',
					content:
						'Elected mayor of Cologne at just 41 years old. During his tenure, he modernized the city, re-established the University of Cologne, and expanded infrastructure. Removed from office by the Nazis in 1933.',
				},
				darkYears: {
					title: 'Nazi Era and Persecution (1933-1945)',
					content:
						'Lived in seclusion during the Nazi dictatorship and was arrested several times. After the failed July 20, 1944 assassination attempt, he was imprisoned again. This period shaped his distrust of totalitarian systems.',
				},
				chancellor: {
					title: 'Chancellor (1949-1963)',
					content:
						'Elected first chancellor at age 73. His 14-year tenure was marked by Western integration, the economic miracle, and European integration. He implemented rearmament and achieved sovereignty for the Federal Republic in 1955.',
				},
				legacy: {
					title: 'Legacy',
					content:
						"Adenauer is regarded as the architect of German democracy and pioneer of European unification. His policy of Western integration laid the foundation for Germany's role in NATO and the EU. Famous for his dry humor and foresight.",
				},
			},
			keyAchievements: [
				'Founding of the CDU (1945)',
				'Western integration of the Federal Republic',
				'German-French reconciliation',
				'Economic miracle under Ludwig Erhard',
			],
			famousQuote: "We all live under the same sky, but we don't all have the same horizon.",
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
		},
		lifespan: {
			birth: '-551',
			death: '-479',
		},
		verified: true,
		featured: false,
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
		},
		lifespan: {
			birth: '1898-02-10',
			death: '1956-08-14',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'nietzsche-friedrich',
		name: 'Friedrich Nietzsche',
		profession: ['Philosopher', 'Philologist'],
		biography: {
			short: 'German philosopher and classical philologist.',
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
		},
		lifespan: {
			birth: '1889-04-26',
			death: '1951-04-29',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'descartes-rene',
		name: 'René Descartes',
		profession: ['Philosopher', 'Mathematician', 'Scientist'],
		biography: {
			short: 'Französischer Philosoph und Mathematiker, Begründer des modernen Rationalismus.',
		},
		lifespan: {
			birth: '1596-03-31',
			death: '1650-02-11',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'goethe-johann',
		name: 'Johann Wolfgang von Goethe',
		profession: ['Poet', 'Natural Philosopher'],
		biography: {
			short:
				'German poet and natural philosopher, one of the most significant creators of German-language poetry.',
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
		},
		lifespan: {
			birth: '1788-02-22',
			death: '1860-09-21',
		},
		verified: true,
		featured: false,
	},
	{
		id: 'mandela-nelson',
		name: 'Nelson Mandela',
		profession: ['Politician', 'Activist', 'President'],
		biography: {
			short:
				'Südafrikanischer Politiker und Aktivist, erster schwarzer Präsident Südafrikas und Friedensnobelpreisträger.',
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
		},
		lifespan: {
			birth: '1913-11-07',
			death: '1960-01-04',
		},
		verified: true,
		featured: false,
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
		id: 'kennedy-john-f',
		name: 'John F. Kennedy',
		profession: ['President', 'Politician'],
		biography: {
			short: '35th President of the United States of America.',
		},
		lifespan: {
			birth: '1917-05-29',
			death: '1963-11-22',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/ARC194238-JFK-Robert-Edward.jpg/330px-ARC194238-JFK-Robert-Edward.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/ARC194238-JFK-Robert-Edward.jpg/330px-ARC194238-JFK-Robert-Edward.jpg',
			credit: 'Jatkins',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'aristotle',
		name: 'Aristotle',
		profession: ['Philosopher', 'Scientist'],
		biography: {
			short: 'Ancient Greek philosopher and scientist, one of the greatest thinkers in history.',
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
		id: 'lao-tzu',
		name: 'Lao Tzu',
		profession: ['Philosopher', 'Writer'],
		biography: {
			short: 'Ancient Chinese philosopher and writer, founder of Taoism.',
		},
		lifespan: {
			birth: '-604',
			death: '-531',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Confucius_and_Laozi%2C_fresco_from_a_Western_Han_tomb_of_Dongping_County%2C_Shandong_province%2C_China.jpg/330px-Confucius_and_Laozi%2C_fresco_from_a_Western_Han_tomb_of_Dongping_County%2C_Shandong_province%2C_China.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Confucius_and_Laozi%2C_fresco_from_a_Western_Han_tomb_of_Dongping_County%2C_Shandong_province%2C_China.jpg/330px-Confucius_and_Laozi%2C_fresco_from_a_Western_Han_tomb_of_Dongping_County%2C_Shandong_province%2C_China.jpg',
			credit: 'PericlesofAthens',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'wilde-oscar',
		name: 'Oscar Wilde',
		profession: ['Writer', 'Poet', 'Playwright'],
		biography: {
			short:
				'Irish poet and playwright, one of the most popular playwrights in London in the 1890s.',
		},
		lifespan: {
			birth: '1854-10-16',
			death: '1900-11-30',
		},
		verified: true,
		featured: true,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/A_Conversation_With_Oscar_Wilde_-_London_-_240404.jpg/330px-A_Conversation_With_Oscar_Wilde_-_London_-_240404.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/A_Conversation_With_Oscar_Wilde_-_London_-_240404.jpg/330px-A_Conversation_With_Oscar_Wilde_-_London_-_240404.jpg',
			credit: 'Ausir',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'roosevelt-theodore',
		name: 'Theodore Roosevelt',
		profession: ['President', 'Politician', 'Writer'],
		biography: {
			short: '26th President of the United States and Nobel Peace Prize winner.',
		},
		lifespan: {
			birth: '1858-10-27',
			death: '1919-01-06',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/1905_cartoon_Theodore_Roosevelt_first_and_war_first_in_peace.jpg/330px-1905_cartoon_Theodore_Roosevelt_first_and_war_first_in_peace.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/1905_cartoon_Theodore_Roosevelt_first_and_war_first_in_peace.jpg/330px-1905_cartoon_Theodore_Roosevelt_first_and_war_first_in_peace.jpg',
			credit: 'Jim Evans',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'keane-bil',
		name: 'Bil Keane',
		profession: ['Cartoonist'],
		biography: {
			short: 'American cartoonist most famous for his newspaper comic The Family Circus.',
		},
		lifespan: {
			birth: '1922-10-05',
			death: '2011-11-08',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Bil_Keane_%281990%29.jpg/330px-Bil_Keane_%281990%29.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Bil_Keane_%281990%29.jpg/330px-Bil_Keane_%281990%29.jpg',
			credit: 'CactusWriter',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'levenson-sam',
		name: 'Sam Levenson',
		profession: ['Humorist', 'Writer', 'Television Host'],
		biography: {
			short: 'American humorist, writer, teacher, television host, and journalist.',
		},
		lifespan: {
			birth: '1911-12-28',
			death: '1980-08-27',
		},
		verified: true,
		featured: false,
		image: {
			thumbnail:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Samlevenson.jpg/330px-Samlevenson.jpg',
			full: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Samlevenson.jpg/330px-Samlevenson.jpg',
			credit: 'Renamed user 995577823Xyn',
			source: 'Wikimedia Commons',
		},
	},
	{
		id: 'unbekannt',
		name: 'Unknown',
		profession: ['Various'],
		biography: {
			short: 'Author unknown or folk wisdom.',
		},
		verified: false,
	},
];
