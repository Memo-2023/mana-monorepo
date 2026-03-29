import { Container, Graphics } from 'pixi.js';

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	size: number;
	color: string;
	gravity: number;
}

const PARTICLE_PRESETS: Record<string, Omit<ParticleConfig, 'x' | 'y'>> = {
	sparks: {
		count: 15,
		color: '#FFD54F',
		speed: 3,
		spread: Math.PI * 2,
		life: 20,
		size: 3,
		gravity: 0.1,
	},
	fire_burst: {
		count: 25,
		color: '#FF4444',
		speed: 2,
		spread: Math.PI * 2,
		life: 30,
		size: 4,
		gravity: -0.05,
	},
	ice_shards: {
		count: 12,
		color: '#4FC3F7',
		speed: 4,
		spread: Math.PI * 0.8,
		life: 25,
		size: 3,
		gravity: 0.15,
	},
	poison_cloud: {
		count: 20,
		color: '#66BB6A',
		speed: 1,
		spread: Math.PI * 2,
		life: 40,
		size: 5,
		gravity: -0.02,
	},
	lightning_bolt: {
		count: 8,
		color: '#FFEB3B',
		speed: 6,
		spread: Math.PI * 0.3,
		life: 10,
		size: 2,
		gravity: 0,
	},
	heal_glow: {
		count: 15,
		color: '#81C784',
		speed: 1.5,
		spread: Math.PI * 2,
		life: 35,
		size: 4,
		gravity: -0.08,
	},
	shatter: {
		count: 30,
		color: '#9E9E9E',
		speed: 5,
		spread: Math.PI * 2,
		life: 25,
		size: 3,
		gravity: 0.2,
	},
};

interface ParticleConfig {
	x: number;
	y: number;
	count: number;
	color: string;
	speed: number;
	spread: number; // radians
	life: number; // frames
	size: number;
	gravity: number;
}

export class ParticleSystem {
	private _container: Container;
	private _particles: Particle[] = [];
	private _graphics: Graphics;

	constructor(worldContainer: Container) {
		this._container = new Container();
		this._graphics = new Graphics();
		this._container.addChild(this._graphics);
		worldContainer.addChild(this._container);
	}

	/** Spawn particles at a world position using a preset name */
	spawn(presetName: string, worldX: number, worldY: number) {
		const preset = PARTICLE_PRESETS[presetName];
		if (!preset) return;

		this.spawnCustom({
			x: worldX,
			y: worldY,
			...preset,
		});
	}

	/** Spawn particles with custom config */
	spawnCustom(config: ParticleConfig) {
		const { x, y, count, color, speed, spread, life, size, gravity } = config;
		const baseAngle = -Math.PI / 2; // Default: upward

		for (let i = 0; i < count; i++) {
			const angle = baseAngle + (Math.random() - 0.5) * spread;
			const v = speed * (0.5 + Math.random() * 0.5);

			this._particles.push({
				x,
				y,
				vx: Math.cos(angle) * v,
				vy: Math.sin(angle) * v,
				life,
				maxLife: life,
				size: size * (0.5 + Math.random() * 0.5),
				color,
				gravity,
			});
		}
	}

	/** Update all particles (call once per frame) */
	update() {
		this._graphics.clear();

		for (let i = this._particles.length - 1; i >= 0; i--) {
			const p = this._particles[i];
			p.x += p.vx;
			p.y += p.vy;
			p.vy += p.gravity;
			p.life--;

			if (p.life <= 0) {
				this._particles.splice(i, 1);
				continue;
			}

			const alpha = p.life / p.maxLife;
			const currentSize = p.size * alpha;

			this._graphics.circle(p.x, p.y, currentSize);
			this._graphics.fill({ color: p.color, alpha });
		}
	}

	get activeCount() {
		return this._particles.length;
	}

	destroy() {
		this._container.destroy({ children: true });
	}
}
