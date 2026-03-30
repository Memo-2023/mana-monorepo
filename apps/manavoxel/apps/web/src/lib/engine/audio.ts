/**
 * ManaVoxel Sound System — Synthesized sounds via Web Audio API
 *
 * All sounds are procedurally generated, no audio files needed.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === 'suspended') ctx.resume();
	return ctx;
}

type SoundPreset = (ac: AudioContext, time: number) => void;

const PRESETS: Record<string, SoundPreset> = {
	hit_default(ac, t) {
		// Short noise burst
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(200, t);
		osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
		gain.gain.setValueAtTime(0.3, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
		osc.connect(gain).connect(ac.destination);
		osc.start(t);
		osc.stop(t + 0.15);
	},

	hit_sword(ac, t) {
		// Metallic slash
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'square';
		osc.frequency.setValueAtTime(800, t);
		osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
		gain.gain.setValueAtTime(0.2, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
		osc.connect(gain).connect(ac.destination);
		osc.start(t);
		osc.stop(t + 0.12);
	},

	explosion(ac, t) {
		// Low rumble + noise
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(100, t);
		osc.frequency.exponentialRampToValueAtTime(20, t + 0.4);
		gain.gain.setValueAtTime(0.4, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
		osc.connect(gain).connect(ac.destination);
		osc.start(t);
		osc.stop(t + 0.5);

		// High click
		const osc2 = ac.createOscillator();
		const gain2 = ac.createGain();
		osc2.type = 'square';
		osc2.frequency.setValueAtTime(400, t);
		osc2.frequency.exponentialRampToValueAtTime(50, t + 0.1);
		gain2.gain.setValueAtTime(0.3, t);
		gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
		osc2.connect(gain2).connect(ac.destination);
		osc2.start(t);
		osc2.stop(t + 0.15);
	},

	heal(ac, t) {
		// Rising chime
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(400, t);
		osc.frequency.linearRampToValueAtTime(800, t + 0.2);
		gain.gain.setValueAtTime(0.2, t);
		gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
		osc.connect(gain).connect(ac.destination);
		osc.start(t);
		osc.stop(t + 0.4);

		// Second note
		const osc2 = ac.createOscillator();
		const gain2 = ac.createGain();
		osc2.type = 'sine';
		osc2.frequency.setValueAtTime(600, t + 0.1);
		osc2.frequency.linearRampToValueAtTime(1000, t + 0.3);
		gain2.gain.setValueAtTime(0.15, t + 0.1);
		gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
		osc2.connect(gain2).connect(ac.destination);
		osc2.start(t + 0.1);
		osc2.stop(t + 0.5);
	},

	whoosh(ac, t) {
		// Fast sweep
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(300, t);
		osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
		osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
		gain.gain.setValueAtTime(0.2, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
		osc.connect(gain).connect(ac.destination);
		osc.start(t);
		osc.stop(t + 0.2);
	},

	pickup(ac, t) {
		// Quick ascending blip
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(500, t);
		osc.frequency.linearRampToValueAtTime(1200, t + 0.08);
		gain.gain.setValueAtTime(0.2, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
		osc.connect(gain).connect(ac.destination);
		osc.start(t);
		osc.stop(t + 0.15);
	},

	break: function (ac, t) {
		// Crunch/shatter
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(300, t);
		osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);
		gain.gain.setValueAtTime(0.35, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
		osc.connect(gain).connect(ac.destination);
		osc.start(t);
		osc.stop(t + 0.25);

		const osc2 = ac.createOscillator();
		const gain2 = ac.createGain();
		osc2.type = 'square';
		osc2.frequency.setValueAtTime(150, t + 0.02);
		osc2.frequency.exponentialRampToValueAtTime(20, t + 0.15);
		gain2.gain.setValueAtTime(0.2, t + 0.02);
		gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
		osc2.connect(gain2).connect(ac.destination);
		osc2.start(t + 0.02);
		osc2.stop(t + 0.2);
	},

	magic(ac, t) {
		// Shimmer with vibrato
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		const lfo = ac.createOscillator();
		const lfoGain = ac.createGain();

		lfo.frequency.value = 12;
		lfoGain.gain.value = 30;
		lfo.connect(lfoGain).connect(osc.frequency);

		osc.type = 'sine';
		osc.frequency.setValueAtTime(600, t);
		osc.frequency.linearRampToValueAtTime(900, t + 0.3);
		gain.gain.setValueAtTime(0.2, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
		osc.connect(gain).connect(ac.destination);
		osc.start(t);
		lfo.start(t);
		osc.stop(t + 0.5);
		lfo.stop(t + 0.5);
	},
};

/** Play a sound preset by name */
export function playSound(name: string) {
	const preset = PRESETS[name];
	if (!preset) return;

	try {
		const ac = getCtx();
		preset(ac, ac.currentTime);
	} catch {
		// Audio context may fail silently (e.g., no user gesture yet)
	}
}

/** Check if a sound name is valid */
export function isValidSound(name: string): boolean {
	return name in PRESETS;
}
