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
  console.log('Content submission request received');
  
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
    const { contentType, title, description, email } = JSON.parse(event.body);
    
    if (!contentType || !title || !description || !email) {
      throw new Error('Alle Felder müssen ausgefüllt werden');
    }

    console.log('Processing submission:', { contentType, title, email });
    
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();

    // Füge neue Zeile zum Sheet hinzu
    console.log('Adding row to Google Sheet');
    try {
      // Prüfe zuerst, ob das Sheet existiert
      const sheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID
      });
      
      // Prüfe, ob das Content-Submissions-Sheet existiert, wenn nicht, erstelle es
      let sheetExists = false;
      const sheetName = 'ContentSubmissions';
      
      for (const sheet of sheetInfo.data.sheets) {
        if (sheet.properties.title === sheetName) {
          sheetExists = true;
          break;
        }
      }
      
      if (!sheetExists) {
        // Erstelle ein neues Sheet für Content-Submissions
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                    gridProperties: {
                      rowCount: 1000,
                      columnCount: 6
                    }
                  }
                }
              }
            ]
          }
        });
        
        // Füge Überschriften hinzu
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: `${sheetName}!A1:F1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Timestamp', 'ID', 'Content Type', 'Title', 'Description', 'Email']]
          }
        });
      }
      
      // Füge die neue Zeile hinzu
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `${sheetName}!A:F`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[timestamp, id, contentType, title, description, email]]
        }
      });
      
      console.log('Content submission added to sheet');
    } catch (sheetError) {
      console.error('Google Sheets error:', sheetError);
      throw new Error(`Google Sheets Fehler: ${sheetError.message}. Bitte stellen Sie sicher, dass das Sheet existiert und der Service Account Zugriff hat.`);
    }

    console.log('Submission completed successfully');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Deine Einreichung wurde erfolgreich gespeichert.'
      })
    };
  } catch (error) {
    console.error('Content submission error:', error);
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