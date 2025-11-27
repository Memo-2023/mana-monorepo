// Netlify Function für PayPal Order
// Erfordert PAYPAL_CLIENT_ID und PAYPAL_CLIENT_SECRET als Umgebungsvariablen

const fetch = require('node-fetch');

// PayPal OAuth Token holen
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  return data.access_token;
}

// PayPal Order erstellen
async function createPayPalOrder(accessToken, amount, isRecurring, priceId, coffeeSize) {
  const url = isRecurring 
    ? 'https://api-m.sandbox.paypal.com/v1/billing/plans' 
    : 'https://api-m.sandbox.paypal.com/v2/checkout/orders';
  
  if (isRecurring) {
    // Vereinfachtes Beispiel für ein Abonnement
    // In einer echten Anwendung sollten Sie Pläne vorab erstellen
    const planData = {
      name: `BaunTown Monthly ${coffeeSize}`,
      description: `Monthly ${coffeeSize} support for BaunTown (${amount}€)`,
      type: "FIXED",
      payment_definitions: [
        {
          name: `Monthly ${coffeeSize}`,
          type: "REGULAR",
          frequency: "MONTH",
          frequency_interval: "1",
          amount: {
            value: amount,
            currency: "EUR"
          },
          cycles: "0"
        }
      ],
      merchant_preferences: {
        return_url: `${process.env.URL || 'http://localhost:3000'}/support-success`,
        cancel_url: `${process.env.URL || 'http://localhost:3000'}/support-cancel`
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(planData)
    });
    
    return response.json();
  } else {
    // Normale einmalige Zahlung
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: amount
          },
          description: `${coffeeSize} für BaunTown (${amount}€)`,
          custom_id: priceId
        }
      ],
      application_context: {
        return_url: `${process.env.URL || 'http://localhost:3000'}/support-success?amount=${amount}&type=${isRecurring ? 'recurring' : 'one-time'}&provider=paypal&coffeeSize=${encodeURIComponent(coffeeSize)}`,
        cancel_url: `${process.env.URL || 'http://localhost:3000'}/support-cancel`
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(orderData)
    });
    
    return response.json();
  }
}

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

  try {
    // Request-Body parsen
    const data = JSON.parse(event.body);
    const { amount, isRecurring, priceId, coffeeSize } = data;
    
    // PayPal Access Token holen
    const accessToken = await getPayPalAccessToken();
    
    // Order oder Plan erstellen mit zusätzlichen Metadaten
    const paypalResponse = await createPayPalOrder(accessToken, amount, isRecurring, priceId, coffeeSize);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(paypalResponse)
    };
  } catch (error) {
    console.error('PayPal error:', error);
    
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