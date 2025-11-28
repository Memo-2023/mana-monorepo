#!/usr/bin/env node

/**
 * Translation Script for quotes 31-60
 */

const fs = require('fs');
const path = require('path');

// Translations for quotes q-031 to q-060
const batch2Translations = {
	'q-031': {
		text: 'Nothing on earth is so powerful as an idea whose time has come.',
		context: "Hugo's insight about the unstoppable force of timely ideas.",
	},
	'q-032': {
		text: 'The pen is mightier than the sword.',
		context: "Bulwer-Lytton's famous assertion about the power of words over violence.",
	},
	'q-033': {
		text: 'To be, or not to be, that is the question.',
		context: "Hamlet's existential soliloquy from Shakespeare's masterpiece.",
	},
	'q-034': {
		text: "All the world's a stage, and all the men and women merely players.",
		context: 'Shakespeare\'s metaphor for life from "As You Like It".',
	},
	'q-035': {
		text: 'Knowledge is power.',
		context: "Bacon's fundamental principle about the value of learning.",
	},
	'q-036': {
		text: 'I have a dream.',
		context: "Martin Luther King Jr.'s iconic speech about civil rights and equality.",
	},
	'q-037': {
		text: 'Give me liberty, or give me death!',
		context: "Patrick Henry's passionate plea for American independence.",
	},
	'q-038': {
		text: 'The only thing we have to fear is fear itself.',
		context: "FDR's reassuring words during the Great Depression.",
	},
	'q-039': {
		text: 'Ask not what your country can do for you—ask what you can do for your country.',
		context: "JFK's inaugural call for civic duty and service.",
	},
	'q-040': {
		text: 'Darkness cannot drive out darkness; only light can do that.',
		context: "Martin Luther King Jr.'s wisdom about overcoming hatred with love.",
	},
	'q-041': {
		text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
		context: 'Chinese proverb about taking action despite missed opportunities.',
	},
	'q-042': {
		text: 'A journey of a thousand miles begins with a single step.',
		context: "Lao Tzu's wisdom about starting any great endeavor.",
	},
	'q-043': {
		text: 'When the winds of change blow, some people build walls and others build windmills.',
		context: 'Chinese proverb about adapting to change versus resisting it.',
	},
	'q-044': {
		text: 'If you want to go fast, go alone. If you want to go far, go together.',
		context: 'African proverb about the balance between speed and sustainability.',
	},
	'q-045': {
		text: 'The master has failed more times than the beginner has even tried.',
		context: 'Wisdom about how expertise comes through persistence and failure.',
	},
	'q-046': {
		text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.',
		context: "Emerson's insight about inner strength and potential.",
	},
	'q-047': {
		text: 'The only impossible journey is the one you never begin.',
		context: "Lao Tzu's encouragement to start pursuing your goals.",
	},
	'q-048': {
		text: 'In the midst of winter, I found there was, within me, an invincible summer.',
		context: "Camus' reflection on finding inner strength during dark times.",
	},
	'q-049': {
		text: 'The purpose of our lives is to be happy.',
		context: "The Dalai Lama's simple yet profound view of life's goal.",
	},
	'q-050': {
		text: 'Life is 10% what happens to you and 90% how you react to it.',
		context: "Swindoll's perspective on personal responsibility and attitude.",
	},
	'q-051': {
		text: 'The way to get started is to quit talking and begin doing.',
		context: "Walt Disney's practical advice about turning ideas into action.",
	},
	'q-052': {
		text: "If opportunity doesn't knock, build a door.",
		context: "Milton Berle's advice about creating your own chances.",
	},
	'q-053': {
		text: "You miss 100% of the shots you don't take.",
		context: "Wayne Gretzky's sports wisdom applicable to all of life.",
	},
	'q-054': {
		text: "Whether you think you can or you think you can't, you're right.",
		context: "Henry Ford's insight about the power of mindset.",
	},
	'q-055': {
		text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
		context: "Maya Angelou's wisdom about the lasting impact of emotional connections.",
	},
	'q-056': {
		text: 'The only way to do great work is to love what you do.',
		context: "Steve Jobs' philosophy about passion and professional fulfillment.",
	},
	'q-057': {
		text: 'Innovation distinguishes between a leader and a follower.',
		context: "Steve Jobs' view on the importance of creative thinking.",
	},
	'q-058': {
		text: "Your time is limited, don't waste it living someone else's life.",
		context: "Steve Jobs' advice about authenticity and personal purpose.",
	},
	'q-059': {
		text: 'The future belongs to those who believe in the beauty of their dreams.',
		context: "Eleanor Roosevelt's inspiring words about hope and ambition.",
	},
	'q-060': {
		text: 'It is never too late to be what you might have been.',
		context: "George Eliot's encouragement about personal transformation at any age.",
	},
};

async function translateBatch2() {
	console.log('📚 Starting Batch 2 Translation (q-031 to q-060)...\n');

	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');

	try {
		// Load current English quotes
		const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));

		let translatedCount = 0;

		// Apply translations
		enQuotes.quotes.forEach((quote) => {
			const translation = batch2Translations[quote.id];
			if (translation) {
				quote.text = translation.text;
				if (translation.context) quote.context = translation.context;
				if (translation.source) quote.source = translation.source;
				translatedCount++;
			}
		});

		// Save updated file
		fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');

		console.log(`✅ Batch 2 complete: ${translatedCount} quotes translated`);
		console.log(`📊 Quotes q-031 to q-060 are now fully translated!`);
	} catch (error) {
		console.error('❌ Batch 2 translation failed:', error);
	}
}

if (require.main === module) {
	translateBatch2();
}

module.exports = { translateBatch2 };
