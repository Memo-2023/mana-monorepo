const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

const auth = new JWT({
	email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
	key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

exports.handler = async function (event, context) {
	if (event.httpMethod !== 'GET') {
		return { statusCode: 405, body: 'Method Not Allowed' };
	}

	const { token } = event.queryStringParameters;

	if (!token) {
		return {
			statusCode: 400,
			body: JSON.stringify({ error: 'Token is required' }),
		};
	}

	try {
		// Finde die Zeile mit dem Token
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: process.env.GOOGLE_SHEET_ID,
			range: 'Sheet1!A:D',
		});

		const values = response.data.values;
		const rowIndex = values.findIndex((row) => row[3] === token);

		if (rowIndex === -1) {
			return {
				statusCode: 404,
				body: JSON.stringify({ error: 'Token not found' }),
			};
		}

		// Aktualisiere den Status auf 'unsubscribed'
		await sheets.spreadsheets.values.update({
			spreadsheetId: process.env.GOOGLE_SHEET_ID,
			range: `Sheet1!C${rowIndex + 1}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [['unsubscribed']],
			},
		});

		// Redirect zur Bestätigungsseite
		return {
			statusCode: 302,
			headers: {
				Location: `${process.env.URL}/unsubscribe-success`,
			},
		};
	} catch (error) {
		console.error('Newsletter unsubscribe error:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: error.message }),
		};
	}
};
