import { describe, it, expect, vi } from 'vitest';
import { ByokBackend, type ByokKeyResolver } from './byok';
import type { ByokProvider, ByokProviderId } from './byok-providers/types';
import type { GenerateResult } from '../types';

function makeProvider(id: ByokProviderId, call?: ByokProvider['call']): ByokProvider {
	return {
		id,
		displayName: id,
		defaultModel: `${id}-default`,
		availableModels: [`${id}-default`, `${id}-big`],
		call:
			call ??
			(async () => ({
				content: `response from ${id}`,
				usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
				latencyMs: 0,
			})),
	};
}

describe('ByokBackend', () => {
	it('has tier === "byok"', () => {
		const backend = new ByokBackend({
			resolver: async () => null,
			providers: [makeProvider('openai')],
		});
		expect(backend.tier).toBe('byok');
	});

	it('isReady returns false when no key resolves', async () => {
		const backend = new ByokBackend({
			resolver: async () => null,
			providers: [makeProvider('openai')],
		});
		expect(await backend.isReady()).toBe(false);
	});

	it('isReady returns true when a key resolves', async () => {
		const resolver: ByokKeyResolver = async () => ({
			provider: 'openai',
			apiKey: 'sk-test',
			model: 'gpt-4o',
		});
		const backend = new ByokBackend({
			resolver,
			providers: [makeProvider('openai')],
		});
		expect(await backend.isReady()).toBe(true);
	});

	it('generate() dispatches to correct provider', async () => {
		const openaiCall = vi.fn(async () => ({
			content: 'openai hi',
			usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
			latencyMs: 0,
		}));
		const anthropicCall = vi.fn(async () => ({
			content: 'anthropic hi',
			usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
			latencyMs: 0,
		}));

		const resolver: ByokKeyResolver = async () => ({
			provider: 'anthropic',
			apiKey: 'sk-ant',
			model: 'claude-opus-4-6',
		});

		const backend = new ByokBackend({
			resolver,
			providers: [makeProvider('openai', openaiCall), makeProvider('anthropic', anthropicCall)],
		});

		const result = await backend.generate({
			taskName: 'test',
			contentClass: 'personal',
			messages: [{ role: 'user', content: 'hi' }],
		});

		expect(anthropicCall).toHaveBeenCalledOnce();
		expect(openaiCall).not.toHaveBeenCalled();
		expect(result.content).toBe('anthropic hi');
	});

	it('generate() passes apiKey, model, messages to provider', async () => {
		const call = vi.fn(async () => ({
			content: '',
			usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
			latencyMs: 0,
		}));

		const resolver: ByokKeyResolver = async () => ({
			provider: 'openai',
			apiKey: 'sk-test-key',
			model: 'gpt-4o',
		});

		const backend = new ByokBackend({
			resolver,
			providers: [makeProvider('openai', call)],
		});

		await backend.generate({
			taskName: 'test',
			contentClass: 'personal',
			messages: [{ role: 'user', content: 'hello' }],
			temperature: 0.5,
			maxTokens: 200,
		});

		expect(call).toHaveBeenCalledWith(
			expect.objectContaining({
				apiKey: 'sk-test-key',
				model: 'gpt-4o',
				temperature: 0.5,
				maxTokens: 200,
				messages: [{ role: 'user', content: 'hello' }],
			})
		);
	});

	it('generate() throws when no key configured', async () => {
		const backend = new ByokBackend({
			resolver: async () => null,
			providers: [makeProvider('openai')],
		});

		await expect(
			backend.generate({
				taskName: 'test',
				contentClass: 'personal',
				messages: [{ role: 'user', content: 'hi' }],
			})
		).rejects.toThrow(/Kein BYOK-Schluessel/);
	});

	it('generate() throws when provider not registered', async () => {
		const resolver: ByokKeyResolver = async () => ({
			provider: 'gemini' as ByokProviderId,
			apiKey: 'k',
			model: 'm',
		});
		const backend = new ByokBackend({
			resolver,
			providers: [makeProvider('openai')], // no gemini!
		});

		await expect(
			backend.generate({
				taskName: 'test',
				contentClass: 'personal',
				messages: [{ role: 'user', content: 'hi' }],
			})
		).rejects.toThrow(/Provider nicht unterstuetzt/);
	});

	it('onUsage callback fires after successful generation', async () => {
		const onUsage = vi.fn();
		const resolver: ByokKeyResolver = async () => ({
			provider: 'openai',
			apiKey: 'sk',
			model: 'gpt-4o',
		});
		const backend = new ByokBackend({
			resolver,
			providers: [makeProvider('openai')],
			onUsage,
		});

		await backend.generate({
			taskName: 'test',
			contentClass: 'personal',
			messages: [{ role: 'user', content: 'hi' }],
		});

		expect(onUsage).toHaveBeenCalledWith(
			expect.objectContaining({
				provider: 'openai',
				model: 'gpt-4o',
				promptTokens: 10,
				completionTokens: 20,
			})
		);
	});

	it('onUsage does not fire when usage is missing', async () => {
		const onUsage = vi.fn();
		const call = async (): Promise<GenerateResult> => ({
			content: 'x',
			latencyMs: 0,
			// no usage field
		});
		const resolver: ByokKeyResolver = async () => ({
			provider: 'openai',
			apiKey: 'sk',
			model: 'gpt-4o',
		});
		const backend = new ByokBackend({
			resolver,
			providers: [makeProvider('openai', call)],
			onUsage,
		});

		await backend.generate({
			taskName: 'test',
			contentClass: 'personal',
			messages: [{ role: 'user', content: 'hi' }],
		});

		expect(onUsage).not.toHaveBeenCalled();
	});

	it('invalidateAvailability resets the cached flag', async () => {
		const backend = new ByokBackend({
			resolver: async () => null,
			providers: [makeProvider('openai')],
		});

		await backend.isReady(); // sets internal flag to false
		expect(backend.isAvailable()).toBe(false);

		backend.invalidateAvailability();
		expect(backend.isAvailable()).toBe(true); // back to unknown/available
	});
});
