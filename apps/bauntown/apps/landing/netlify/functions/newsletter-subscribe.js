const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const crypto = require('crypto');

// Überprüfe, ob alle erforderlichen Umgebungsvariablen vorhanden sind
const requiredEnvVars = [
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_SHEET_ID',
  'SITE_URL'
];

function checkEnvVars() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Fehlende Umgebungsvariablen: ${missing.join(', ')}`);
  }
}

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

exports.handler = async function(event, context) {
  console.log('Newsletter subscription request received');
  
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    // Überprüfe Umgebungsvariablen
    checkEnvVars();
    
    // Parse request body
    const { email } = JSON.parse(event.body);
    if (!email) {
      throw new Error('Email is required');
    }

    console.log('Processing subscription for email:', email);
    
    const timestamp = new Date().toISOString();
    const unsubscribeToken = crypto.randomUUID();

    // Füge neue Zeile zum Sheet hinzu
    console.log('Adding row to Google Sheet');
    try {
      // Prüfe zuerst, ob das Sheet existiert und hole den ersten Tab-Namen
      const sheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID
      });
      
      console.log('Sheet info:', sheetInfo.data);
      
      // Hole den Namen des ersten Tabs
      const firstSheetName = sheetInfo.data.sheets[0].properties.title;
      console.log('Using sheet name:', firstSheetName);
      
      // Füge die Zeile hinzu
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `${firstSheetName}!A:D`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[timestamp, email, 'active', unsubscribeToken]]
        }
      });
    } catch (sheetError) {
      console.error('Google Sheets error:', sheetError);
      throw new Error(`Google Sheets Fehler: ${sheetError.message}. Bitte stellen Sie sicher, dass das Sheet existiert und der Service Account Zugriff hat.`);
    }

    console.log('Subscription completed successfully');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: error.stack
      })
    };
  }
}; 