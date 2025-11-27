// Netlify Function für Webhooks von Stripe und PayPal

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  // Den Webhook-Source aus URL-Parameter oder Header bestimmen
  const source = event.queryStringParameters.source || 'unknown';
  
  try {
    if (source === 'stripe') {
      // Stripe Webhook verarbeiten
      return processStripeWebhook(event, headers);
    } else if (source === 'paypal') {
      // PayPal Webhook verarbeiten
      return processPayPalWebhook(event, headers);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: {
            message: `Unknown webhook source: ${source}`
          }
        })
      };
    }
  } catch (error) {
    console.error(`Webhook error (${source}):`, error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: {
          message: error.message || 'Internal server error'
        }
      })
    };
  }
};

// Stripe Webhook verarbeiten
async function processStripeWebhook(event, headers) {
  // In einer echten Anwendung würden Sie hier die Stripe Signatur überprüfen
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const sig = event.headers['stripe-signature'];
  // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const data = JSON.parse(event.body);
    
    // Verschiedene Ereignistypen verarbeiten
    switch (data.type) {
      case 'payment_intent.succeeded':
        // Zahlung erfolgreich - hier könnte eine Datenbank aktualisiert werden
        console.log('Payment succeeded:', data.data.object.id);
        break;
        
      case 'payment_intent.payment_failed':
        // Zahlung fehlgeschlagen
        console.log('Payment failed:', data.data.object.id);
        break;
        
      // Weitere Event-Typen hier verarbeiten
      
      default:
        console.log('Unhandled Stripe event type:', data.type);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: {
          message: error.message
        }
      })
    };
  }
}

// PayPal Webhook verarbeiten
async function processPayPalWebhook(event, headers) {
  // In einer echten Anwendung würden Sie hier die PayPal-Signatur verifizieren
  
  try {
    const data = JSON.parse(event.body);
    
    // Verschiedene Ereignistypen verarbeiten
    switch (data.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Zahlung erfolgreich - hier könnte eine Datenbank aktualisiert werden
        console.log('PayPal payment completed:', data.resource.id);
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
        // Zahlung abgelehnt
        console.log('PayPal payment denied:', data.resource.id);
        break;
        
      // Weitere Event-Typen hier verarbeiten
      
      default:
        console.log('Unhandled PayPal event type:', data.event_type);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: {
          message: error.message
        }
      })
    };
  }
}