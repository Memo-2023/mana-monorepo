import { type BotTranslations } from '../types';

export const en: BotTranslations = {
	common: {
		// General
		error: 'Error',
		errorOccurred: 'An error occurred. Please try again.',
		notLoggedIn: 'You are not logged in.',
		loginRequired: 'Please log in first with `!login email password`',
		loginSuccess: 'Successfully logged in as **{email}**',
		loginFailed: 'Login failed: {error}',
		logoutSuccess: 'Successfully logged out.',
		invalidCommand: 'Unknown command: {command}',
		helpHint: 'Say "help" for all commands.',

		// Credits
		credits: 'Credits',
		creditsRemaining: '{amount} remaining',
		insufficientCredits: 'Insufficient credits. Required: {required}, Available: {available}',
		buyCredits: 'Buy credits: https://mana.how/credits',

		// Credit purchasing
		creditBalance: 'Your balance: **{balance}** credits',
		creditPackagesTitle: '**Credit packages:**',
		creditPackageLine: '{num}. {name} · {credits} credits · {price}',
		creditBuyHelp: 'Purchase: `!buy {num}` or `!kaufen {num}`',
		creditPaymentLink: 'Click here to pay:',
		creditLinkValid: 'Link valid for 24 hours.',
		creditPaymentSuccess: '✓ Payment successful! **{credits}** credits have been added to your account.',
		creditNewBalance: 'New balance: **{balance}** credits',
		creditPackageNotFound: 'Package not found. Use `!packages` to view available packages.',
		creditPurchaseError: 'Error creating payment link. Please try again later.',
		creditNoPackages: 'No credit packages available.',

		// Sync
		synced: 'Synced',
		localStorage: 'Local storage',

		// Status
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Logged in as: {email}',
		notLoggedInStatus: 'Not logged in',

		// Language
		languageChanged: 'Language changed to: **{language}**',
		currentLanguage: 'Current language: **{language}**',
		availableLanguages: 'Available languages: {languages}',

		// Dates
		today: 'Today',
		tomorrow: 'Tomorrow',
		dayAfterTomorrow: 'Day after tomorrow',

		// Actions
		created: 'Created',
		deleted: 'Deleted',
		updated: 'Updated',
		completed: 'Completed',
	},

	todo: {
		// Inherit common
		error: 'Error',
		errorOccurred: 'An error occurred. Please try again.',
		notLoggedIn: 'You are not logged in.',
		loginRequired: 'Please log in first with `!login email password`',
		loginSuccess: 'Successfully logged in as **{email}**',
		loginFailed: 'Login failed: {error}',
		logoutSuccess: 'Successfully logged out.',
		invalidCommand: 'Unknown command: {command}',
		helpHint: 'Say "help" for all commands.',
		credits: 'Credits',
		creditsRemaining: '{amount} remaining',
		insufficientCredits: 'Insufficient credits. Required: {required}, Available: {available}',
		buyCredits: 'Buy credits: https://mana.how/credits',
		creditBalance: 'Your balance: **{balance}** credits',
		creditPackagesTitle: '**Credit packages:**',
		creditPackageLine: '{num}. {name} · {credits} credits · {price}',
		creditBuyHelp: 'Purchase: `!buy {num}` or `!kaufen {num}`',
		creditPaymentLink: 'Click here to pay:',
		creditLinkValid: 'Link valid for 24 hours.',
		creditPaymentSuccess: '✓ Payment successful! **{credits}** credits have been added to your account.',
		creditNewBalance: 'New balance: **{balance}** credits',
		creditPackageNotFound: 'Package not found. Use `!packages` to view available packages.',
		creditPurchaseError: 'Error creating payment link. Please try again later.',
		creditNoPackages: 'No credit packages available.',
		synced: 'Synced',
		localStorage: 'Local storage',
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Logged in as: {email}',
		notLoggedInStatus: 'Not logged in',
		languageChanged: 'Language changed to: **{language}**',
		currentLanguage: 'Current language: **{language}**',
		availableLanguages: 'Available languages: {languages}',
		today: 'Today',
		tomorrow: 'Tomorrow',
		dayAfterTomorrow: 'Day after tomorrow',
		created: 'Created',
		deleted: 'Deleted',
		updated: 'Updated',
		completed: 'Completed',

		// Tasks
		task: 'Task',
		tasks: 'Tasks',
		taskCreated: 'Task created: **{title}**',
		taskCompleted: 'Completed: ~~{title}~~',
		taskDeleted: 'Deleted: {title}',
		noTasks: 'No open tasks.',
		noTasksToday: 'No tasks for today.',
		inboxEmpty: 'Inbox is empty.',
		allTasks: 'All open tasks',
		todayTasks: 'Tasks for today',
		inbox: 'Inbox (no date)',

		// Projects
		project: 'Project',
		projects: 'Projects',
		noProjects: 'No projects.',
		projectTasks: 'Project: {name}',

		// Priorities
		priority: 'Priority',
		date: 'Date',

		// Help
		helpTitle: 'Todo Bot - Help',
		helpCommands: `**Commands:**
• \`!add [task]\` - Create new task
• \`!list\` - All open tasks
• \`!today\` - Today's tasks
• \`!inbox\` - Tasks without date
• \`!done [Nr]\` - Mark task as done
• \`!delete [Nr]\` - Delete task
• \`!projects\` - All projects
• \`!project [name]\` - Show project tasks
• \`!status\` - Bot status
• \`!language [de/en]\` - Change language`,
		helpSyntax: `**Syntax:**
\`!add Task !p1 @tomorrow #project\`
• \`!p1-4\` - Priority (1=highest)
• \`@today/@tomorrow\` - Due date
• \`#projectname\` - Project`,
		helpExamples: `**Examples:**
• \`Go shopping\`
• \`Prepare meeting !p1 @tomorrow\`
• \`Write report #work\``,

		// Actions
		markDone: 'Complete: `!done [Nr]`',
		delete: 'Delete: `!delete [Nr]`',
	},

	calendar: {
		// Inherit common
		error: 'Error',
		errorOccurred: 'An error occurred. Please try again.',
		notLoggedIn: 'You are not logged in.',
		loginRequired: 'Please log in first with `!login email password`',
		loginSuccess: 'Successfully logged in as **{email}**',
		loginFailed: 'Login failed: {error}',
		logoutSuccess: 'Successfully logged out.',
		invalidCommand: 'Unknown command: {command}',
		helpHint: 'Say "help" for all commands.',
		credits: 'Credits',
		creditsRemaining: '{amount} remaining',
		insufficientCredits: 'Insufficient credits. Required: {required}, Available: {available}',
		buyCredits: 'Buy credits: https://mana.how/credits',
		creditBalance: 'Your balance: **{balance}** credits',
		creditPackagesTitle: '**Credit packages:**',
		creditPackageLine: '{num}. {name} · {credits} credits · {price}',
		creditBuyHelp: 'Purchase: `!buy {num}` or `!kaufen {num}`',
		creditPaymentLink: 'Click here to pay:',
		creditLinkValid: 'Link valid for 24 hours.',
		creditPaymentSuccess: '✓ Payment successful! **{credits}** credits have been added to your account.',
		creditNewBalance: 'New balance: **{balance}** credits',
		creditPackageNotFound: 'Package not found. Use `!packages` to view available packages.',
		creditPurchaseError: 'Error creating payment link. Please try again later.',
		creditNoPackages: 'No credit packages available.',
		synced: 'Synced',
		localStorage: 'Local storage',
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Logged in as: {email}',
		notLoggedInStatus: 'Not logged in',
		languageChanged: 'Language changed to: **{language}**',
		currentLanguage: 'Current language: **{language}**',
		availableLanguages: 'Available languages: {languages}',
		today: 'Today',
		tomorrow: 'Tomorrow',
		dayAfterTomorrow: 'Day after tomorrow',
		created: 'Created',
		deleted: 'Deleted',
		updated: 'Updated',
		completed: 'Completed',

		// Events
		event: 'Event',
		events: 'Events',
		eventCreated: 'Event created: **{title}**',
		eventDeleted: 'Deleted: {title}',
		noEvents: 'No upcoming events.',
		noEventsToday: 'No events for today.',
		noEventsTomorrow: 'No events for tomorrow.',
		noEventsThisWeek: 'No events this week.',
		upcomingEvents: 'Upcoming events',
		todayEvents: "Today's events",
		tomorrowEvents: "Tomorrow's events",
		weekEvents: "This week's events",

		// Calendars
		calendar: 'Calendar',
		calendars: 'Calendars',
		yourCalendars: 'Your calendars',

		// Time
		time: 'Time',
		allDay: 'all day',
		location: 'Location',

		// Help
		helpTitle: 'Calendar Bot - Help',
		helpCommands: `**Commands:**
• \`!add [event]\` - Create new event
• \`!today\` - Today's events
• \`!tomorrow\` - Tomorrow's events
• \`!week\` - This week's events
• \`!events\` - Next 14 days
• \`!details [Nr]\` - Event details
• \`!delete [Nr]\` - Delete event
• \`!calendars\` - All calendars
• \`!status\` - Bot status
• \`!language [de/en]\` - Change language`,
		helpSyntax: `**Syntax:**
\`Meeting tomorrow at 2pm\`
\`Dentist on 02/15 at 10:30am\`
\`Vacation on 03/01 all day\``,
		helpExamples: `**Examples:**
• \`Team meeting tomorrow at 10am\`
• \`Doctor on 02/20 at 3:30pm\`
• \`Birthday on 03/15 all day\``,

		// Parsing errors
		couldNotParseDateTime: 'Could not parse date/time.',
		pleaseProvideTitle: 'Please provide a title for the event.',
	},

	contacts: {
		// Inherit common
		error: 'Error',
		errorOccurred: 'An error occurred. Please try again.',
		notLoggedIn: 'You are not logged in.',
		loginRequired: 'Please log in first with `!login email password`',
		loginSuccess: 'Successfully logged in as **{email}**',
		loginFailed: 'Login failed: {error}',
		logoutSuccess: 'Successfully logged out.',
		invalidCommand: 'Unknown command: {command}',
		helpHint: 'Say "help" for all commands.',
		credits: 'Credits',
		creditsRemaining: '{amount} remaining',
		insufficientCredits: 'Insufficient credits. Required: {required}, Available: {available}',
		buyCredits: 'Buy credits: https://mana.how/credits',
		creditBalance: 'Your balance: **{balance}** credits',
		creditPackagesTitle: '**Credit packages:**',
		creditPackageLine: '{num}. {name} · {credits} credits · {price}',
		creditBuyHelp: 'Purchase: `!buy {num}` or `!kaufen {num}`',
		creditPaymentLink: 'Click here to pay:',
		creditLinkValid: 'Link valid for 24 hours.',
		creditPaymentSuccess: '✓ Payment successful! **{credits}** credits have been added to your account.',
		creditNewBalance: 'New balance: **{balance}** credits',
		creditPackageNotFound: 'Package not found. Use `!packages` to view available packages.',
		creditPurchaseError: 'Error creating payment link. Please try again later.',
		creditNoPackages: 'No credit packages available.',
		synced: 'Synced',
		localStorage: 'Local storage',
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Logged in as: {email}',
		notLoggedInStatus: 'Not logged in',
		languageChanged: 'Language changed to: **{language}**',
		currentLanguage: 'Current language: **{language}**',
		availableLanguages: 'Available languages: {languages}',
		today: 'Today',
		tomorrow: 'Tomorrow',
		dayAfterTomorrow: 'Day after tomorrow',
		created: 'Created',
		deleted: 'Deleted',
		updated: 'Updated',
		completed: 'Completed',

		// Contacts
		contact: 'Contact',
		contacts: 'Contacts',
		contactCreated: 'Contact **{name}** created!',
		contactDeleted: 'Contact **{name}** deleted.',
		contactUpdated: 'Contact **{name}** updated!',
		noContacts: 'You have no contacts yet.',

		// Favorites
		favorite: 'Favorite',
		favorites: 'Favorites',
		noFavorites: 'You have no favorites yet.',
		markedAsFavorite: '**{name}** marked as favorite ★',
		removedFromFavorites: '**{name}** removed from favorites',

		// Search
		search: 'Search',
		searchResults: 'Search results for "{query}"',
		noSearchResults: 'No contacts found for: "{query}"',

		// Fields
		email: 'Email',
		phone: 'Phone',
		mobile: 'Mobile',
		company: 'Company',
		jobTitle: 'Job title',
		address: 'Address',
		website: 'Website',
		birthday: 'Birthday',
		notes: 'Notes',

		// Help
		helpTitle: 'Contacts Bot - Help',
		helpCommands: `**Commands:**
• \`!contacts\` - All contacts
• \`!search [text]\` - Search contacts
• \`!favorites\` - Show favorites
• \`!contact [Nr]\` - Contact details
• \`!add FirstName LastName\` - New contact
• \`!edit [Nr] [field] [value]\` - Edit
• \`!delete [Nr]\` - Delete contact
• \`!fav [Nr]\` - Toggle favorite
• \`!status\` - Bot status
• \`!language [de/en]\` - Change language`,
		helpFields: `**Fields:** email, phone, mobile, company, job, website, street, city, zip, country, notes, birthday`,
		helpExamples: `**Examples:**
• \`John Doe\`
• \`!edit 1 email john@example.com\`
• \`!edit 1 phone +1 123 456 7890\``,
	},

	clock: {
		// Inherit common
		error: 'Error',
		errorOccurred: 'An error occurred. Please try again.',
		notLoggedIn: 'You are not logged in.',
		loginRequired: 'Please log in first with `!login email password`',
		loginSuccess: 'Successfully logged in as **{email}**',
		loginFailed: 'Login failed: {error}',
		logoutSuccess: 'Successfully logged out.',
		invalidCommand: 'Unknown command: {command}',
		helpHint: 'Say "help" for all commands.',
		credits: 'Credits',
		creditsRemaining: '{amount} remaining',
		insufficientCredits: 'Insufficient credits. Required: {required}, Available: {available}',
		buyCredits: 'Buy credits: https://mana.how/credits',
		creditBalance: 'Your balance: **{balance}** credits',
		creditPackagesTitle: '**Credit packages:**',
		creditPackageLine: '{num}. {name} · {credits} credits · {price}',
		creditBuyHelp: 'Purchase: `!buy {num}` or `!kaufen {num}`',
		creditPaymentLink: 'Click here to pay:',
		creditLinkValid: 'Link valid for 24 hours.',
		creditPaymentSuccess: '✓ Payment successful! **{credits}** credits have been added to your account.',
		creditNewBalance: 'New balance: **{balance}** credits',
		creditPackageNotFound: 'Package not found. Use `!packages` to view available packages.',
		creditPurchaseError: 'Error creating payment link. Please try again later.',
		creditNoPackages: 'No credit packages available.',
		synced: 'Synced',
		localStorage: 'Local storage',
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Logged in as: {email}',
		notLoggedInStatus: 'Not logged in',
		languageChanged: 'Language changed to: **{language}**',
		currentLanguage: 'Current language: **{language}**',
		availableLanguages: 'Available languages: {languages}',
		today: 'Today',
		tomorrow: 'Tomorrow',
		dayAfterTomorrow: 'Day after tomorrow',
		created: 'Created',
		deleted: 'Deleted',
		updated: 'Updated',
		completed: 'Completed',

		// Timer
		timer: 'Timer',
		timerStarted: 'Timer started!',
		timerPaused: 'Timer paused',
		timerResumed: 'Timer resumed',
		timerReset: 'Timer reset.',
		timerFinished: 'Timer finished!',
		noActiveTimer: 'No active timer.',
		noPausedTimer: 'No paused timer.',
		noTimers: 'No timers.',
		remaining: 'Remaining',
		duration: 'Duration',
		label: 'Label',

		// Alarm
		alarm: 'Alarm',
		alarmSet: 'Alarm set!',
		alarmDeleted: 'Alarm deleted.',
		noAlarms: 'No alarms.',
		yourAlarms: 'Your alarms',

		// World Clock
		worldClock: 'World clock',
		worldClocks: 'World clocks',
		worldClockAdded: 'World clock added: {city}',
		noWorldClocks: 'No world clocks.',
		yourWorldClocks: 'Your world clocks',

		// Time
		currentTime: 'Current time',

		// Help
		helpTitle: 'Clock Bot - Help',
		helpCommands: `**Commands:**
• \`!timer 25m\` - Start timer
• \`!stop\` - Pause timer
• \`!resume\` - Resume timer
• \`!reset\` - Reset timer
• \`!timers\` - All timers
• \`!alarm 07:30\` - Set alarm
• \`!alarms\` - All alarms
• \`!time\` - Current time
• \`!worldclock Berlin\` - Add world clock
• \`!worldclocks\` - All world clocks
• \`!status\` - Bot status
• \`!language [de/en]\` - Change language`,
		helpExamples: `**Examples:**
• \`25\` (25 minute timer)
• \`1h30m\` (1.5 hour timer)
• \`!alarm 7:30 am\``,

		// Parsing errors
		couldNotParseDuration: 'Could not parse duration.',
		couldNotParseTime: 'Could not parse time.',
	},

	gift: {
		// Inherit common
		error: 'Error',
		errorOccurred: 'An error occurred. Please try again.',
		notLoggedIn: 'You are not logged in.',
		loginRequired: 'Please log in first with `!login email password`',
		loginSuccess: 'Successfully logged in as **{email}**',
		loginFailed: 'Login failed: {error}',
		logoutSuccess: 'Successfully logged out.',
		invalidCommand: 'Unknown command: {command}',
		helpHint: 'Say "help" for all commands.',
		credits: 'Credits',
		creditsRemaining: '{amount} remaining',
		insufficientCredits: 'Insufficient credits. Required: {required}, Available: {available}',
		buyCredits: 'Buy credits: https://mana.how/credits',
		creditBalance: 'Your balance: **{balance}** credits',
		creditPackagesTitle: '**Credit packages:**',
		creditPackageLine: '{num}. {name} · {credits} credits · {price}',
		creditBuyHelp: 'Purchase: `!buy {num}` or `!kaufen {num}`',
		creditPaymentLink: 'Click here to pay:',
		creditLinkValid: 'Link valid for 24 hours.',
		creditPaymentSuccess: '✓ Payment successful! **{credits}** credits have been added to your account.',
		creditNewBalance: 'New balance: **{balance}** credits',
		creditPackageNotFound: 'Package not found. Use `!packages` to view available packages.',
		creditPurchaseError: 'Error creating payment link. Please try again later.',
		creditNoPackages: 'No credit packages available.',
		synced: 'Synced',
		localStorage: 'Local storage',
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Logged in as: {email}',
		notLoggedInStatus: 'Not logged in',
		languageChanged: 'Language changed to: **{language}**',
		currentLanguage: 'Current language: **{language}**',
		availableLanguages: 'Available languages: {languages}',
		today: 'Today',
		tomorrow: 'Tomorrow',
		dayAfterTomorrow: 'Day after tomorrow',
		created: 'Created',
		deleted: 'Deleted',
		updated: 'Updated',
		completed: 'Completed',

		// Gift creation
		giftCreated: '🎁 **Gift created!**',
		giftCreatedCode: 'Code: `{code}`',
		giftCreatedCredits: 'Credits: {credits}',
		giftCreatedLink: 'Link: {url}',
		giftCreatedSplit: 'Credits: {credits} × {portions}',
		giftInvalidCredits: 'Please enter a valid credit amount (1-10000).',
		giftInvalidSyntax: 'Invalid syntax. Example: `!gift 50` or `!gift 100 /5`',
		giftInsufficientCredits: 'Insufficient credits. Available: {available}',

		// Gift redemption
		giftRedeemed: '🎁 **Gift redeemed!**',
		giftRedeemedCredits: '+{credits} credits',
		giftRedeemedMessage: '"{message}"',
		giftInvalidCode: 'Gift code not found.',
		giftExpired: 'This gift code has expired.',
		giftDepleted: 'This gift code has been fully claimed.',
		giftAlreadyClaimed: 'You have already claimed this gift.',
		giftWrongUser: 'This gift code is for a specific person.',
		giftWrongAnswer: 'Wrong answer. Try again.',
		giftRiddleRequired: 'Please provide the answer to the riddle.',
		giftRiddleQuestion: '❓ {question}',

		// Gift list
		giftListTitle: '🎁 **Your gifts:**',
		giftListEmpty: 'No active gifts.',
		giftListItem: '{num}. `{code}` {status} {credits} Cr · {claimed}/{total}',
		giftReceivedListTitle: '🎁 **Received gifts:**',
		giftReceivedListEmpty: 'No received gifts.',

		// Gift info
		giftInfoTitle: '🎁 **Gift info:**',
		giftInfoCredits: 'Credits: {credits}',
		giftInfoAvailable: 'Available: {remaining}/{total}',
		giftInfoFrom: 'From: {name}',

		// Gift help
		giftHelpTitle: 'Gifts - Help',
		giftHelpCommands: `**Commands:**
• \`!gift [credits]\` - Create gift code
• \`!gift [credits] /[count]\` - Split gift
• \`!gift [credits] @email\` - Personalized
• \`!gift [credits] ?="answer"\` - With riddle
• \`!redeem [code]\` - Redeem code
• \`!my-gifts\` - Show your gifts`,
		giftHelpSyntax: `**Syntax:**
\`!gift 50\` - Simple gift
\`!gift 100 /5\` - 5 portions of 20 Cr
\`!gift 50 "Happy birthday!"\` - With message`,
		giftHelpExamples: `**Examples:**
• \`!gift 50\`
• \`!gift 100 /5 Share this!\`
• \`!redeem ABC123\``,

		// Gift cancellation
		giftCancelled: 'Gift cancelled.',
		giftRefunded: '{credits} credits refunded.',
	},
};
