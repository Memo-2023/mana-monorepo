/**
 * Tests for Azure Speech config utilities.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAvailableSpeechServices, pickRandomService, BATCH_ENDPOINT_BASE } from './azure';
import type { SpeechServiceConfig } from './azure';

describe('BATCH_ENDPOINT_BASE', () => {
	it('points to swedencentral', () => {
		expect(BATCH_ENDPOINT_BASE).toBe(
			'https://swedencentral.api.cognitive.microsoft.com/speechtotext'
		);
	});
});

describe('getAvailableSpeechServices', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
		// Clear all Azure keys
		delete process.env.AZURE_SPEECH_KEY;
		delete process.env.AZURE_SPEECH_KEY_1;
		delete process.env.AZURE_SPEECH_KEY_2;
		delete process.env.AZURE_SPEECH_KEY_3;
		delete process.env.AZURE_SPEECH_KEY_4;
		delete process.env.AZURE_SPEECH_REGION;
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it('throws if no keys configured', () => {
		expect(() => getAvailableSpeechServices()).toThrow('No Azure Speech credentials configured');
	});

	it('uses single AZURE_SPEECH_KEY as fallback', () => {
		process.env.AZURE_SPEECH_KEY = 'single-key';

		const services = getAvailableSpeechServices();
		expect(services).toHaveLength(1);
		expect(services[0].key).toBe('single-key');
		expect(services[0].name).toBe('azure-speech-default');
	});

	it('uses numbered keys when available', () => {
		process.env.AZURE_SPEECH_KEY_1 = 'key-1';
		process.env.AZURE_SPEECH_KEY_2 = 'key-2';

		const services = getAvailableSpeechServices();
		expect(services).toHaveLength(2);
		expect(services[0].name).toBe('azure-speech-1');
		expect(services[1].name).toBe('azure-speech-2');
	});

	it('prefers numbered keys over single key', () => {
		process.env.AZURE_SPEECH_KEY = 'fallback-key';
		process.env.AZURE_SPEECH_KEY_1 = 'key-1';

		const services = getAvailableSpeechServices();
		expect(services).toHaveLength(1);
		expect(services[0].key).toBe('key-1');
	});

	it('uses custom region', () => {
		process.env.AZURE_SPEECH_KEY = 'key';
		process.env.AZURE_SPEECH_REGION = 'westeurope';

		const services = getAvailableSpeechServices();
		expect(services[0].region).toBe('westeurope');
		expect(services[0].endpoint).toContain('westeurope');
	});

	it('defaults to swedencentral region', () => {
		process.env.AZURE_SPEECH_KEY = 'key';

		const services = getAvailableSpeechServices();
		expect(services[0].region).toBe('swedencentral');
	});
});

describe('pickRandomService', () => {
	it('throws for empty array', () => {
		expect(() => pickRandomService([])).toThrow('No speech services available');
	});

	it('returns the only service for single-element array', () => {
		const service: SpeechServiceConfig = {
			key: 'key-1',
			endpoint: 'https://example.com',
			region: 'swedencentral',
			name: 'azure-speech-1',
		};

		expect(pickRandomService([service])).toBe(service);
	});

	it('returns a service from the array', () => {
		const services: SpeechServiceConfig[] = [
			{ key: 'key-1', endpoint: 'https://example.com', region: 'swedencentral', name: 'svc-1' },
			{ key: 'key-2', endpoint: 'https://example.com', region: 'swedencentral', name: 'svc-2' },
		];

		const result = pickRandomService(services);
		expect(services).toContainEqual(result);
	});
});
