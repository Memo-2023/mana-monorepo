// Dieses Skript erstellt eine Stripe Checkout Session anstatt eines Payment Intents
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
	// CORS Headers
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
	};

	// Handle OPTIONS request (CORS preflight)
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 200,
			headers,
			body: '',
		};
	}

	try {
		// Parse request
		const data = JSON.parse(event.body || '{}');
		const { amount, isRecurring, priceId, coffeeSize } = data;

		// Debug-Ausgabe
		console.log('Request data:', { amount, isRecurring, priceId, coffeeSize });
		console.log('Stripe key available:', !!process.env.STRIPE_SECRET_KEY);

		// Fallback, wenn kein Stripe-Key verfügbar
		if (!process.env.STRIPE_SECRET_KEY) {
			console.log('WARNUNG: STRIPE_SECRET_KEY fehlt - liefere Test-Antwort');
			return {
				statusCode: 200,
				headers,
				body: JSON.stringify({
					url: `${process.env.URL || 'https://bauntown.com'}/support-success?test=true`,
					isRecurring: isRecurring || false,
					message: 'Test mode - no Stripe key available',
				}),
			};
		}

		// Betrag in Cent umrechnen für Stripe
		const amountInCents = Math.round(amount * 100);

		let sessionConfig = {
			payment_method_types: ['card'],
			line_items: [
				{
					price_data: {
						currency: 'eur',
						product_data: {
							name: `BaunTown Kaffee - ${coffeeSize || 'Mittlerer Kaffee'}`,
							description: isRecurring ? 'Monatliche Unterstützung' : 'Einmalige Unterstützung',
						},
						unit_amount: amountInCents,
						recurring: isRecurring ? { interval: 'month' } : undefined,
					},
					quantity: 1,
				},
			],
			mode: isRecurring ? 'subscription' : 'payment',
			success_url: `${process.env.URL || 'https://bauntown.com'}/support-success?amount=${amount}&type=${isRecurring ? 'recurring' : 'one-time'}&provider=stripe&coffeeSize=${encodeURIComponent(coffeeSize || 'Mittlerer Kaffee')}`,
			cancel_url: `${process.env.URL || 'https://bauntown.com'}/support-cancel`,
			metadata: {
				isRecurring: isRecurring ? 'true' : 'false',
				priceId: priceId || '',
				coffeeSize: coffeeSize || 'Mittlerer Kaffee',
			},
		};

		console.log('Creating checkout session with config:', JSON.stringify(sessionConfig));

		try {
			// Stripe Checkout Session erstellen
			const session = await stripe.checkout.sessions.create(sessionConfig);

			console.log('Session created:', session.id, 'URL:', session.url);

			return {
				statusCode: 200,
				headers,
				body: JSON.stringify({
					url: session.url, // Die Redirect-URL hat Priorität
					isRecurring: isRecurring || false,
				}),
			};
		} catch (stripeError) {
			console.error('Stripe error:', stripeError);
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({
					error: {
						message: `Stripe error: ${stripeError.message}`,
						stripeCode: stripeError.code || 'unknown',
					},
				}),
			};
		}
	} catch (error) {
		console.error('Function error:', error);

		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				error: {
					message: error.message || 'Unknown server error',
				},
			}),
		};
	}
};
