import type { LakeData, RiverData } from './types';

// Scene dimensions (SVG viewBox)
export const SCENE = {
	width: 1600,
	height: 900,
	viewBox: '0 0 1600 900',
} as const;

// Mountain layer paths (3 layers, back to front)
export const MOUNTAIN_PATHS = {
	far: 'M0,280 Q200,180 400,240 Q500,210 600,250 Q750,160 900,220 Q1050,180 1200,230 Q1350,170 1500,210 L1600,240 L1600,350 L0,350 Z',
	mid: 'M0,310 Q150,250 300,290 Q450,240 550,280 Q700,220 850,270 Q1000,230 1150,275 Q1300,240 1450,265 L1600,280 L1600,380 L0,380 Z',
	near: 'M0,340 Q100,300 250,330 Q400,290 500,320 Q650,280 800,315 Q950,285 1100,320 Q1250,295 1400,310 L1600,320 L1600,400 L0,400 Z',
} as const;

// Lake definitions with organic SVG paths
export const LAKES: LakeData[] = [
	{
		id: 'auth',
		name: 'auth',
		label: 'Zentralsee',
		path: 'M680,440 Q720,410 790,415 Q860,420 890,445 Q910,470 900,500 Q885,535 850,550 Q800,565 750,558 Q700,550 680,525 Q660,500 665,470 Q668,450 680,440 Z',
		color: '#4BA3B5',
		colorDeep: '#2A7A8C',
		clarity: 1,
		level: 0.8,
		position: { x: 790, y: 485 },
	},
	{
		id: 'redis',
		name: 'redis',
		label: 'Bergsee',
		path: 'M280,390 Q310,370 350,375 Q390,380 405,400 Q415,420 405,440 Q390,455 355,460 Q320,462 295,450 Q275,435 270,415 Q268,398 280,390 Z',
		color: '#7EC8D9',
		colorDeep: '#4BA3B5',
		clarity: 1,
		level: 0.9,
		position: { x: 340, y: 420 },
	},
	{
		id: 'minio',
		name: 'minio',
		label: 'Stausee',
		path: 'M1180,400 Q1220,375 1280,380 Q1340,385 1370,410 Q1390,435 1380,465 Q1360,490 1320,500 Q1270,510 1220,502 Q1185,492 1170,468 Q1158,445 1165,420 Q1170,405 1180,400 Z',
		color: '#5BB5C5',
		colorDeep: '#3A8A9A',
		clarity: 0.9,
		level: 0.7,
		position: { x: 1275, y: 440 },
	},
	{
		id: 'db-left',
		name: 'postgres-left',
		label: 'Waldsee West',
		path: 'M180,580 Q220,555 280,560 Q340,565 365,590 Q380,615 370,640 Q355,665 310,675 Q260,682 215,670 Q180,658 165,635 Q155,612 165,595 Q170,582 180,580 Z',
		color: '#3A8A9A',
		colorDeep: '#1A5666',
		clarity: 0.85,
		level: 0.75,
		position: { x: 270, y: 620 },
	},
	{
		id: 'db-center',
		name: 'postgres-center',
		label: 'Waldsee Mitte',
		path: 'M650,620 Q700,595 770,600 Q840,605 870,635 Q890,660 878,690 Q862,718 810,730 Q760,738 710,730 Q660,720 640,695 Q625,670 632,645 Q638,628 650,620 Z',
		color: '#3A8A9A',
		colorDeep: '#1A5666',
		clarity: 0.9,
		level: 0.8,
		position: { x: 760, y: 665 },
	},
	{
		id: 'db-right',
		name: 'postgres-right',
		label: 'Waldsee Ost',
		path: 'M1120,590 Q1160,568 1220,572 Q1280,578 1305,600 Q1322,625 1315,652 Q1300,678 1255,690 Q1210,698 1165,688 Q1130,678 1115,655 Q1102,632 1108,610 Q1112,595 1120,590 Z',
		color: '#3A8A9A',
		colorDeep: '#1A5666',
		clarity: 0.85,
		level: 0.75,
		position: { x: 1215, y: 630 },
	},
];

// Rivers connecting the lakes
export const RIVERS: RiverData[] = [
	{
		id: 'redis-to-auth',
		from: 'redis',
		to: 'auth',
		path: 'M405,430 Q480,435 540,440 Q600,445 665,460',
		flowSpeed: 0.8,
		width: 8,
	},
	{
		id: 'minio-to-auth',
		from: 'minio',
		to: 'auth',
		path: 'M1170,450 Q1100,455 1020,460 Q940,465 900,475',
		flowSpeed: 0.6,
		width: 8,
	},
	{
		id: 'auth-to-db-left',
		from: 'auth',
		to: 'db-left',
		path: 'M710,555 Q620,570 520,580 Q420,590 365,595',
		flowSpeed: 0.7,
		width: 10,
	},
	{
		id: 'auth-to-db-center',
		from: 'auth',
		to: 'db-center',
		path: 'M790,560 Q785,580 778,600 Q770,610 765,620',
		flowSpeed: 0.7,
		width: 10,
	},
	{
		id: 'auth-to-db-right',
		from: 'auth',
		to: 'db-right',
		path: 'M870,548 Q960,565 1040,575 Q1080,582 1115,592',
		flowSpeed: 0.7,
		width: 10,
	},
	{
		id: 'inlet',
		from: 'source',
		to: 'auth',
		path: 'M790,350 Q792,370 790,390 Q788,410 790,420',
		flowSpeed: 0.9,
		width: 6,
	},
];

// App positions around the lakes
export const APP_POSITIONS: Record<string, { x: number; y: number; lakeId: string }> = {
	// Around Zentralsee (auth) - core/mature apps
	mana: { x: 730, y: 410, lakeId: 'auth' },
	chat: { x: 860, y: 420, lakeId: 'auth' },
	picture: { x: 910, y: 480, lakeId: 'auth' },
	presi: { x: 660, y: 490, lakeId: 'auth' },

	// Around Waldsee West (db-left)
	calendar: { x: 170, y: 560, lakeId: 'db-left' },
	todo: { x: 330, y: 555, lakeId: 'db-left' },
	contacts: { x: 370, y: 630, lakeId: 'db-left' },
	storage: { x: 160, y: 650, lakeId: 'db-left' },

	// Around Waldsee Mitte (db-center)
	zitare: { x: 640, y: 600, lakeId: 'db-center' },
	music: { x: 850, y: 610, lakeId: 'db-center' },
	clock: { x: 880, y: 680, lakeId: 'db-center' },
	food: { x: 650, y: 720, lakeId: 'db-center' },

	// Around Waldsee Ost (db-right)
	photos: { x: 1110, y: 575, lakeId: 'db-right' },
	skilltree: { x: 1310, y: 590, lakeId: 'db-right' },
	context: { x: 1320, y: 660, lakeId: 'db-right' },
	plants: { x: 1115, y: 675, lakeId: 'db-right' },

	// Around Bergsee (redis) - lightweight/cache
	traces: { x: 400, y: 385, lakeId: 'redis' },

	// Around Stausee (minio) - storage-heavy
	cards: { x: 1180, y: 385, lakeId: 'minio' },
	questions: { x: 1370, y: 400, lakeId: 'minio' },
};
