const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
const envPath = path.join(__dirname, '..', '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const app = express();
app.use(cors());
app.use(express.json());

const MAERCHENZAUBER_REPLICATE_API_KEY = process.env.MAERCHENZAUBER_REPLICATE_API_KEY;
console.log('Environment variables loaded:', {
	MAERCHENZAUBER_REPLICATE_API_KEY_EXISTS: !!MAERCHENZAUBER_REPLICATE_API_KEY,
	ENV_KEYS: Object.keys(process.env).filter(
		(key) => key.includes('REPLICATE') || key.includes('EXPO')
	),
});

app.post('/api/generate-image', async (req, res) => {
	try {
		const { prompt } = req.body;
		console.log('Received prompt:', prompt);

		if (!MAERCHENZAUBER_REPLICATE_API_KEY) {
			throw new Error('Replicate API key is not configured');
		}

		// Start the prediction
		const startResponse = await fetch(
			'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${MAERCHENZAUBER_REPLICATE_API_KEY}`,
					'Content-Type': 'application/json',
					Prefer: 'wait',
				},
				body: JSON.stringify({
					input: {
						prompt,
						go_fast: true,
						megapixels: '1',
						num_outputs: 1,
						aspect_ratio: '1:1',
						output_format: 'webp',
						output_quality: 80,
						num_inference_steps: 4,
					},
				}),
			}
		);

		if (!startResponse.ok) {
			const errorText = await startResponse.text();
			console.error('Replicate API error:', errorText);
			throw new Error(`Failed to start image generation: ${errorText}`);
		}

		const result = await startResponse.json();
		console.log('Generation completed:', result);

		if (result.error) {
			throw new Error(result.error);
		}

		res.json({ imageUrl: result.output[0] });
	} catch (error) {
		console.error('Error generating image:', error);
		res.status(500).json({ error: `Failed to generate image: ${error.message}` });
	}
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
