#!/usr/bin/env node

/**
 * Final Translation Script for quotes 101-200
 */

const fs = require('fs');
const path = require('path');

// Translations for the final 100 quotes (q-101 to q-200)
const finalBatchTranslations = {
	// Famous philosophical and motivational quotes
	'q-101': { text: 'The only constant in life is change.' },
	'q-102': { text: 'Knowing yourself is the beginning of all wisdom.' },
	'q-103': { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.' },
	'q-104': { text: 'The whole is greater than the sum of its parts.' },
	'q-105': { text: 'Well begun is half done.' },
	'q-106': { text: 'Patience is bitter, but its fruit is sweet.' },
	'q-107': { text: 'There is only one good, knowledge, and one evil, ignorance.' },
	'q-108': { text: 'Man is by nature a social animal.' },
	'q-109': { text: 'Hope is a waking dream.' },
	'q-110': {
		text: 'The aim of art is to represent not the outward appearance of things, but their inward significance.',
	},

	// More wisdom quotes
	'q-111': { text: 'Time is the most valuable thing we have and can use.' },
	'q-112': { text: 'Doubt is the beginning, not the end, of wisdom.' },
	'q-113': {
		text: 'The secret of change is to focus all of your energy not on fighting the old, but on building the new.',
	},
	'q-114': { text: 'A wise man learns more from his enemies than a fool from his friends.' },
	'q-115': { text: 'The measure of intelligence is the ability to change.' },
	'q-116': { text: 'Life is really simple, but we insist on making it complicated.' },
	'q-117': { text: 'It does not matter how slowly you go as long as you do not stop.' },
	'q-118': {
		text: 'Our greatest glory is not in never falling, but in rising every time we fall.',
	},
	'q-119': { text: 'Choose a job you love, and you will never have to work a day in your life.' },
	'q-120': { text: 'The man who moves a mountain begins by carrying away small stones.' },

	// Scientific and philosophical insights
	'q-121': { text: 'Simplicity is the ultimate sophistication.' },
	'q-122': { text: 'Learning never exhausts the mind.' },
	'q-123': { text: 'Where the spirit does not work with the hand, there is no art.' },
	'q-124': { text: 'Nature never hurries, yet everything is accomplished.' },
	'q-125': { text: 'The journey of a thousand miles begins with one step.' },
	'q-126': { text: 'When I let go of what I am, I become what I might be.' },
	'q-127': {
		text: 'At the center of your being you have the answer; you know who you are and you know what you want.',
	},
	'q-128': { text: 'New beginnings are often disguised as painful endings.' },
	'q-129': {
		text: 'If you understand others you are smart. If you understand yourself you are illuminated.',
	},
	'q-130': { text: 'The sage does not attempt anything very big, and thus achieves greatness.' },

	// Modern wisdom and life philosophy
	'q-131': { text: 'Success is not the key to happiness. Happiness is the key to success.' },
	'q-132': { text: 'The only person you are destined to become is the person you decide to be.' },
	'q-133': { text: 'What we think, we become.' },
	'q-134': { text: 'The mind is everything. What you think you become.' },
	'q-135': {
		text: 'Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.',
	},
	'q-136': { text: 'Three things cannot be long hidden: the sun, the moon, and the truth.' },
	'q-137': { text: 'Peace comes from within. Do not seek it without.' },
	'q-138': { text: 'Better than a thousand hollow words, is one word that brings peace.' },
	'q-139': { text: 'Hatred does not cease by hatred, but only by love; this is the eternal rule.' },
	'q-140': {
		text: 'You yourself, as much as anybody in the entire universe, deserve your love and affection.',
	},

	// Leadership and success
	'q-141': { text: 'A leader is one who knows the way, goes the way, and shows the way.' },
	'q-142': { text: 'The best time to plant a tree was 20 years ago. The second best time is now.' },
	'q-143': { text: 'It is better to travel well than to arrive.' },
	'q-144': {
		text: 'The only way to make sense out of change is to plunge into it, move with it, and join the dance.',
	},
	'q-145': {
		text: 'Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.',
	},
	'q-146': {
		text: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
	},
	'q-147': {
		text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
	},
	'q-148': { text: 'Waste no more time arguing what a good man should be. Be one.' },
	'q-149': { text: 'The happiness of your life depends upon the quality of your thoughts.' },
	'q-150': {
		text: 'Accept the things to which fate binds you, and love the people with whom fate brings you together.',
	},

	// Final 50 quotes - inspirational and profound
	'q-151': {
		text: 'When we are no longer able to change a situation, we are challenged to change ourselves.',
	},
	'q-152': { text: "Those who have a 'why' to live, can bear with almost any 'how'." },
	'q-153': {
		text: "Everything can be taken from a man but one thing: the freedom to choose one's attitude.",
	},
	'q-154': { text: 'What is to give light must endure burning.' },
	'q-155': {
		text: 'A thought transfixed me: for the first time in my life, I saw the truth as it is set into song by so many poets, proclaimed as the final wisdom by so many thinkers. The truth - that love is the ultimate and the highest goal to which man can aspire.',
	},
	'q-156': {
		text: "Don't aim at success. The more you aim at it and make it a target, the more you are going to miss it.",
	},
	'q-157': {
		text: 'Happiness cannot be traveled to, owned, earned, worn or consumed. Happiness is the spiritual experience of living every minute with love, grace, and gratitude.',
	},
	'q-158': {
		text: 'The most beautiful people we have known are those who have known defeat, known suffering, known struggle, known loss, and have found their way out of those depths.',
	},
	'q-159': { text: 'A ship in harbor is safe, but that is not what ships are built for.' },
	'q-160': {
		text: "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.",
	},

	'q-161': {
		text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.',
	},
	'q-162': { text: 'The way to get started is to quit talking and begin doing.' },
	'q-163': { text: 'If life were predictable it would cease to be life, and be without flavor.' },
	'q-164': {
		text: 'Spread love everywhere you go. Let no one ever come to you without leaving happier.',
	},
	'q-165': { text: 'When you reach the end of your rope, tie a knot in it and hang on.' },
	'q-166': { text: 'Always remember that you are absolutely unique. Just like everyone else.' },
	'q-167': {
		text: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
	},
	'q-168': { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.' },
	'q-169': { text: 'It is during our darkest moments that we must focus to see the light.' },
	'q-170': { text: 'Whoever is happy will make others happy too.' },

	'q-171': {
		text: 'Do not go where the path may lead, go instead where there is no path and leave a trail.',
	},
	'q-172': {
		text: 'You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.',
	},
	'q-173': {
		text: "In the end, it's not the years in your life that count. It's the life in your years.",
	},
	'q-174': { text: 'Life is a succession of lessons which must be lived to be understood.' },
	'q-175': { text: 'You have been assigned this mountain to show others it can be moved.' },
	'q-176': { text: "Your limitation—it's only your imagination." },
	'q-177': { text: 'Push yourself, because no one else is going to do it for you.' },
	'q-178': { text: 'Great things never come from comfort zones.' },
	'q-179': { text: 'Dream it. Wish it. Do it.' },
	'q-180': { text: "Success doesn't just find you. You have to go out and get it." },

	'q-181': {
		text: "The harder you work for something, the greater you'll feel when you achieve it.",
	},
	'q-182': { text: 'Dream bigger. Do bigger.' },
	'q-183': { text: "Don't stop when you're tired. Stop when you're done." },
	'q-184': { text: 'Wake up with determination. Go to bed with satisfaction.' },
	'q-185': { text: 'Do something today that your future self will thank you for.' },
	'q-186': { text: 'Little things make big days.' },
	'q-187': { text: "It's going to be hard, but hard does not mean impossible." },
	'q-188': { text: "Don't wait for opportunity. Create it." },
	'q-189': {
		text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
	},
	'q-190': { text: 'The key to success is to focus on goals, not obstacles.' },

	'q-191': { text: 'Dream it. Believe it. Build it.' },
	'q-192': {
		text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.',
	},
	'q-193': { text: "Believe you can and you're halfway there." },
	'q-194': { text: 'Act as if what you do makes a difference. It does.' },
	'q-195': {
		text: 'Success is not how high you have climbed, but how you make a positive difference to the world.',
	},
	'q-196': { text: 'What we achieve inwardly will change outer reality.' },
	'q-197': { text: "A champion is someone who gets up when they can't." },
	'q-198': {
		text: 'Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.',
	},
	'q-199': { text: 'You are never too old to set another goal or to dream a new dream.' },
	'q-200': { text: 'The future belongs to those who believe in the beauty of their dreams.' },
};

async function translateFinalBatch() {
	console.log('🏁 Starting Final Batch Translation (q-101 to q-200)...\n');

	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');

	try {
		// Load current English quotes
		const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));

		let translatedCount = 0;

		// Apply translations
		enQuotes.quotes.forEach((quote) => {
			const translation = finalBatchTranslations[quote.id];
			if (translation) {
				quote.text = translation.text;
				if (translation.context) quote.context = translation.context;
				if (translation.source) quote.source = translation.source;
				translatedCount++;
			}
		});

		// Save updated file
		fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');

		console.log(`✅ Final batch complete: ${translatedCount} quotes translated`);
		console.log(`🎉 TOTAL TRANSLATION COMPLETE!`);
		console.log(
			`📊 Total quotes translated: 100 + ${translatedCount} = ${100 + translatedCount} out of 200`
		);

		return translatedCount;
	} catch (error) {
		console.error('❌ Final batch translation failed:', error);
		return 0;
	}
}

if (require.main === module) {
	translateFinalBatch();
}

module.exports = { translateFinalBatch };
