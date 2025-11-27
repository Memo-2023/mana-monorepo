<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import CircleButton from './game-ui/CircleButton.svelte';
	import BlockButton from './BlockButton.svelte';
	import AuthButton from './auth/AuthButton.svelte';
	import SaveLevelModal from './level/SaveLevelModal.svelte';
	import { AuthService } from '../services/AuthService';
	import { LevelService } from '../services/LevelService';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
	import {
		BLOCK_TYPES,
		getVoxelKey,
		createSideTexture,
		createTopTexture,
		createBottomTexture,
		BlockManager,
	} from '../BlockTypes';
	import type { BlockType, BlockTypes } from '../BlockTypes';
	import { PlayerController } from '../PlayerController';
	import type { PlayerPosition, PlayerConfig } from '../PlayerController';

	// Spielstatus
	// Using const object instead of enum to avoid TypeScript compatibility issues with Svelte
	const GameState = {
		PLAYING: 'PLAYING',
		STOPPED: 'STOPPED',
		PAUSED: 'PAUSED',
		WON: 'WON',
	} as const;
	let gameState = GameState.STOPPED;
	let attempts = 0;
	let timer = 0;
	let timerRunning = false;

	// Level-Daten und Funktionen
	let currentLevelId: string | null = null;
	let currentLevelName = 'Unbenanntes Level';
	let levels: { id: string; name: string }[] = [];
	let currentLevelIndex = -1; // -1 bedeutet, dass kein gespeichertes Level geladen ist
	let isSaveLevelModalOpen = false;

	// Referenzen auf DOM-Elemente
	let containerEl: HTMLElement;
	let crosshairEl: HTMLElement;
	let controlsHelpEl: HTMLElement;
	// Steuerungspanel-Sichtbarkeit
	let controlsVisible = false;
	let deathMessageEl: HTMLElement;
	let winMessageEl: HTMLElement;
	let playModeButtonEl: any;
	let jumpButtonEl: HTMLElement;
	let respawnCounterDisplayEl: HTMLElement;
	let blockInfoDisplayEl: HTMLElement;
	let blockSelectorContainerEl: HTMLElement;
	let availableBlockTypes = Object.keys(BLOCK_TYPES);
	let currentBlockType: string = 'grass';

	// --- Globale Variablen und Konstanten ---
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let orbitControls: OrbitControls;
	let pointerLockControls: PointerLockControls;
	let raycaster: THREE.Raycaster;
	let mouse: THREE.Vector2;
	let playerRaycaster: THREE.Raycaster;
	let blockManager: BlockManager;
	let clock = new THREE.Clock();
	let animationFrameId: number;

	// Welt-Konfiguration
	const WORLD_SIZE = { width: 16, height: 10, depth: 16 };
	const VOXEL_SIZE = 1;
	const voxels = new Map<string, THREE.Mesh>();

	// Spielzustand
	let currentMode: 'editor' | 'play' = 'editor';
	let gameWon = false;
	let respawnCounter = 0;
	let simulatedJump = false;
	let spawnBlockCoordinates: { x: number; y: number; z: number } | null = null;

	// Zielverfolgung
	let goalBlocks: { x: number; y: number; z: number }[] = [];
	let reachedGoals: { x: number; y: number; z: number }[] = [];
	let goalDisplayEl: HTMLElement;

	// Timer
	let gameStartTime: number = 0;
	let elapsedTime: number = 0;
	let timerInterval: number | null = null;
	let timerDisplayEl: HTMLElement;

	// Spieler-Konfiguration
	const playerConfig = {
		height: 1.7,
		radius: 0.4,
		speed: 5.0,
		jumpVelocity: 12.0, // Erhöht von 7.5 auf 12.0 für deutlich höhere Sprünge
		gravity: 28.0,
	};
	const keyboardState: { [key: string]: boolean } = {};
	let playerController: PlayerController;
	let lastOrbitControlsState = { position: new THREE.Vector3(), target: new THREE.Vector3() };

	// Blocktypen werden aus BlockTypes.ts importiert
	// currentBlockType ist bereits oben deklariert
	let placementHelper: THREE.Mesh;

	// BlockManager für die Verwaltung der Blöcke wurde in den globalen Variablen definiert

	// --- Funktionen ---

	// Hilfsfunktionen für Voxel
	// Voxel- und Textur-Hilfsfunktionen werden aus BlockTypes.ts importiert

	// Event-Handler
	function handleKeyDown(event: KeyboardEvent): void {
		keyboardState[event.code] = true;
		if (
			pointerLockControls &&
			pointerLockControls.isLocked &&
			['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)
		) {
			event.preventDefault();
		}
		if (event.code === 'Escape' && pointerLockControls && pointerLockControls.isLocked) {
			pointerLockControls.unlock();
		}
	}

	function handleKeyUp(event: KeyboardEvent): void {
		keyboardState[event.code] = false;
	}

	// Initialisierung
	function init() {
		setupScene();
		setupLights();
		setupControls();

		lastOrbitControlsState.position.copy(camera.position);
		lastOrbitControlsState.target.copy(orbitControls.target);

		setupRaycasters();
		setupPlacementHelper();

		// Initialisiere den BlockManager
		blockManager = new BlockManager(
			scene,
			voxels,
			VOXEL_SIZE,
			goalBlocks,
			reachedGoals,
			updateGoalDisplay
		);

		// Initialisiere den PlayerController
		playerController = new PlayerController(
			playerConfig,
			camera,
			blockManager,
			VOXEL_SIZE,
			keyboardState,
			respawnPlayer,
			handleGoalReached,
			startTimerOnFirstMovement // Übergebe den Callback für die erste Bewegung
		);

		generateInitialWorld();

		// Stelle sicher, dass die DOM-Elemente existieren, bevor wir sie verwenden
		setTimeout(() => {
			// Überprüfe explizit, ob blockSelectorContainerEl existiert
			if (blockSelectorContainerEl) {
				console.log('Block selector container found, initializing UI');
				setupBlockSelectorUI();
				// Stelle sicher, dass der Container sichtbar ist
				blockSelectorContainerEl.style.display = 'flex';
			} else {
				console.error('Block selector container not found during initialization');
			}

			// Steuerung ist standardmäßig ausgeblendet
			controlsVisible = false;

			switchToEditorMode();
		}, 200); // Erhöhte Verzögerung für bessere DOM-Verfügbarkeit

		initEventListeners();
		animate();
	}

	// Animation
	function animate() {
		animationFrameId = requestAnimationFrame(animate);
		const deltaTime = Math.min(0.05, clock.getDelta());

		if (currentMode === 'editor') {
			if (orbitControls && orbitControls.enabled) orbitControls.update();
			if (placementHelper && placementHelper.visible) {
				const blockDef = BLOCK_TYPES[currentBlockType];
				if (blockDef) {
					const material = placementHelper.material as THREE.MeshBasicMaterial;
					if (blockDef.topColor !== undefined) {
						material.color.set(blockDef.topColor);
					} else if (blockDef.color !== undefined) {
						material.color.set(blockDef.color);
					}
					material.opacity = blockDef.opacity !== undefined ? blockDef.opacity * 0.7 : 0.5;
				}
			}
		} else if (currentMode === 'play') {
			updatePlayer(deltaTime);
			updateBlockInfoDisplay();
		}

		renderer.render(scene, camera);
	}

	// Setup-Funktionen
	function setupScene() {
		scene = new THREE.Scene();
		// Dunklerer Hintergrund, aber nicht zu extrem
		scene.background = new THREE.Color(0x1a2a44); // Dunkleres Blau, aber nicht zu dunkel
		scene.fog = new THREE.Fog(0x1a2a44, 40, 100); // Etwas weniger dichter Nebel

		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		// Initialisiere den PlayerController mit allen erforderlichen Parametern
		const playerConfig: PlayerConfig = {
			height: 1.8,
			radius: 0.4,
			speed: 5,
			jumpVelocity: 14, // Erhöht von 10 auf 14 für höhere Sprünge
			gravity: 20,
		};

		// Der PlayerController wird erst später vollständig initialisiert, wenn alle Abhängigkeiten verfügbar sind

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		containerEl.appendChild(renderer.domElement);
	}

	function setupLights() {
		// Stärkeres Umgebungslicht, damit die Blöcke besser sichtbar sind
		const ambientLight = new THREE.AmbientLight(0x6b7d8e, 0.5); // Helleres, blaustichiges Umgebungslicht
		scene.add(ambientLight);

		// Hauptlicht: Spotlight von oben für den Lichtkegel-Effekt, aber weniger extrem
		const spotLight = new THREE.SpotLight(0xffffff, 1.5); // Etwas weniger intensiv
		spotLight.position.set(WORLD_SIZE.width / 2, WORLD_SIZE.height * 3, WORLD_SIZE.depth / 2); // Mittig über der Welt
		spotLight.angle = Math.PI / 4; // Breiterer Lichtkegel (45 Grad)
		spotLight.penumbra = 0.3; // Weichere Kanten des Lichtkegels
		spotLight.decay = 1.0; // Weniger starker Lichtabfall
		spotLight.distance = 0; // Unbegrenzte Reichweite
		spotLight.castShadow = true;
		spotLight.shadow.mapSize.width = 2048;
		spotLight.shadow.mapSize.height = 2048;
		spotLight.shadow.bias = -0.0001; // Reduziert Shadow-Acne

		// Einstellungen für die Schatten-Kamera
		const shadowCamSize = Math.max(WORLD_SIZE.width, WORLD_SIZE.depth) * 1.5;
		spotLight.shadow.camera.near = 1;
		spotLight.shadow.camera.far = WORLD_SIZE.height * 4;
		spotLight.shadow.camera.fov = 70; // Breiterer Winkel für bessere Abdeckung

		// Füge einen Target hinzu, damit das Licht auf die Mitte der Welt zeigt
		const spotLightTarget = new THREE.Object3D();
		spotLightTarget.position.set(WORLD_SIZE.width / 2, 0, WORLD_SIZE.depth / 2); // Boden in der Mitte
		scene.add(spotLightTarget);
		spotLight.target = spotLightTarget;

		scene.add(spotLight);

		// Zusätzliches Hilfslicht von der Seite, um Details besser zu zeigen
		const fillLight = new THREE.DirectionalLight(0xd8e8ff, 0.4); // Blaustichiges Fülllicht
		fillLight.position.set(WORLD_SIZE.width * 1.5, WORLD_SIZE.height, WORLD_SIZE.depth / 2);
		fillLight.castShadow = false; // Keine Schatten vom Fülllicht
		scene.add(fillLight);

		// Zusätzliches schwaches Licht von der Lava (rötlich)
		const lavaLight = new THREE.PointLight(0xff6030, 0.6, WORLD_SIZE.height * 2);
		lavaLight.position.set(WORLD_SIZE.width / 2, 0.5, WORLD_SIZE.depth / 2); // Knapp über dem Boden
		lavaLight.castShadow = false; // Keine Schatten für bessere Performance
		scene.add(lavaLight);
	}

	function setupControls() {
		orbitControls = new OrbitControls(camera, renderer.domElement);
		orbitControls.enableDamping = true;
		orbitControls.dampingFactor = 0.05;
		orbitControls.target.set(
			(WORLD_SIZE.width / 2) * VOXEL_SIZE,
			0,
			(WORLD_SIZE.depth / 2) * VOXEL_SIZE
		);
		camera.position.set(WORLD_SIZE.width / 2, WORLD_SIZE.height / 1.2, WORLD_SIZE.depth + 10);
		orbitControls.update();

		pointerLockControls = new PointerLockControls(camera, renderer.domElement);
		pointerLockControls.addEventListener('lock', () => {
			crosshairEl.style.display = 'none';
			containerEl.classList.add('playing');
		});
		pointerLockControls.addEventListener('unlock', () => {
			crosshairEl.style.display = 'none';
			containerEl.classList.remove('playing');
			if (currentMode === 'play' && !gameWon) {
				switchToEditorMode();
			} else if (gameWon) {
				switchToEditorMode();
			}
		});

		// Wir müssen die Standard-Mausbewegungslogik nicht überschreiben, da sie von PointerLockControls bereits implementiert wird
		// Die ursprüngliche Implementierung hatte einen benutzerdefinierten onMouseMove-Handler, der in der aktuellen Version nicht mehr nötig ist
	}

	function setupRaycasters() {
		raycaster = new THREE.Raycaster();
		mouse = new THREE.Vector2();
		playerRaycaster = new THREE.Raycaster();
	}

	function setupPlacementHelper() {
		const helperMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			opacity: 0.5,
			transparent: true,
			depthTest: false,
		});
		const helperGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
		placementHelper = new THREE.Mesh(helperGeometry, helperMaterial);
		placementHelper.visible = false;
		scene.add(placementHelper);
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	// Welt-Generierung

	// Funktion zum Zurücksetzen des Levels (zerbrechliche Blöcke etc.)
	function resetLevel() {
		console.log('Level wird zurückgesetzt...');

		// Entferne alle zerbrechlichen Blöcke und andere temporäre Blöcke
		blockManager.removeBlocksByType(['fragile']);

		// Füge zerbrechliche Blöcke wieder hinzu
		addVoxel(4, 1, 4, 'fragile');
		addVoxel(4, 1, 5, 'fragile');
		addVoxel(5, 1, 4, 'fragile');

		// Erstelle einen Pfad aus zerbrechlichen Blöcken zum Ziel
		addVoxel(12, 1, 12, 'fragile');
		addVoxel(12, 1, 11, 'fragile');
		addVoxel(11, 1, 11, 'fragile');

		console.log('Level wurde zurückgesetzt.');
	}

	function generateInitialWorld() {
		// Erstelle Lava-Boden
		for (let x = 0; x < WORLD_SIZE.width; x++) {
			for (let z = 0; z < WORLD_SIZE.depth; z++) {
				addVoxel(x, 0, z, 'lava');
				addVoxel(x, -1, z, 'lava');
			}
		}

		// Berechne die Koordinaten für den Spawn-Block
		const platformStartX = 5,
			platformStartZ = 5,
			platformEndX = 10,
			platformEndZ = 10;
		const spawnX = Math.floor((platformStartX + platformEndX - 1) / 2);
		const spawnY = 1; // Auf der gleichen Ebene wie die Erde
		const spawnZ = Math.floor((platformStartZ + platformEndZ - 1) / 2);

		// Erstelle Gras-Plattform, aber lasse die Spawn-Position frei
		for (let x = platformStartX; x < platformEndX; x++) {
			for (let z = platformStartZ; z < platformEndZ; z++) {
				// Überprüfe, ob dies die Spawn-Position ist
				if (x === spawnX && z === spawnZ) {
					// Hier wird kein Gras-Block platziert
					continue;
				}
				addVoxel(x, 1, z, 'grass');
			}
		}

		// Erstelle den Spawn-Block mit dem neuen Blocktyp 'spawn'
		addVoxel(spawnX, spawnY, spawnZ, 'spawn');

		// Speichere die Koordinaten und markiere den Block als Spawn-Punkt
		spawnBlockCoordinates = { x: spawnX, y: spawnY, z: spawnZ };
		const spawnBlockMesh = blockManager.getVoxelMesh(spawnX, spawnY, spawnZ);
		if (spawnBlockMesh) {
			spawnBlockMesh.userData.isSpawnPoint = true;
			console.log('Spawn-Block erfolgreich gesetzt an:', spawnBlockCoordinates);
		} else {
			console.error('Konnte Spawn-Block nicht finden/markieren! Erstelle einen Standard-Spawn.');
			// Fallback: Erstelle einen Gras-Block als Spawn-Punkt
			addVoxel(spawnX, spawnY, spawnZ, 'grass');
			const newSpawnMesh = blockManager.getVoxelMesh(spawnX, spawnY, spawnZ);
			if (newSpawnMesh) {
				newSpawnMesh.userData.isSpawnPoint = true;
				console.log('Fallback-Spawn-Block gesetzt an:', spawnBlockCoordinates);
			}
		}

		// Füge weitere Blöcke hinzu
		addVoxel(2, 1, 2, 'ice');
		addVoxel(2, 1, 3, 'ice');
		addVoxel(3, 1, 2, 'ice');

		// Füge zerbrechliche Blöcke hinzu
		addVoxel(4, 1, 4, 'fragile');
		addVoxel(4, 1, 5, 'fragile');
		addVoxel(5, 1, 4, 'fragile');

		// Erstelle einen Pfad aus zerbrechlichen Blöcken zum Ziel
		addVoxel(12, 1, 12, 'fragile');
		addVoxel(12, 1, 11, 'fragile');
		addVoxel(11, 1, 11, 'fragile');

		addVoxel(WORLD_SIZE.width - 3, 1, WORLD_SIZE.depth - 3, 'goal');
	}

	function addVoxel(x: number, y: number, z: number, type: string = currentBlockType): void {
		// Delegiere die Funktion an den BlockManager
		blockManager.addVoxel(x, y, z, type);

		// Setze den aktuellen Blocktyp im BlockManager
		if (type === currentBlockType) {
			blockManager.setCurrentBlockType(currentBlockType);
		}

		// Wenn es ein Spawn-Block ist, setze das isSpawnPoint-Flag
		if (type === 'spawn') {
			const voxelMesh = blockManager.getVoxelMesh(x, y, z);
			if (voxelMesh) {
				voxelMesh.userData.isSpawnPoint = true;
			}
		}
	}

	// Aktualisiert die Zielanzeige
	function updateGoalDisplay(): void {
		if (!goalDisplayEl) return;

		const totalGoals = goalBlocks.length;
		const reachedGoalsCount = reachedGoals.length;

		goalDisplayEl.textContent = `Ziele: ${reachedGoalsCount}/${totalGoals}`;

		// Zeige die Zielanzeige im Spielmodus an
		if (currentMode === 'play') {
			goalDisplayEl.style.display = 'block';
		} else {
			goalDisplayEl.style.display = 'none';
		}
	}

	function removeVoxel(x: number, y: number, z: number, forceRemove: boolean = false): void {
		// Delegiere die Funktion an den BlockManager
		blockManager.removeVoxel(x, y, z, forceRemove);
	}

	// UI-Setup
	// Referenz für die BlockButton-Komponenten
	let blockButtons: any[] = [];

	// Diese Funktion wird nicht mehr benötigt, da wir vollständig auf die Svelte-Komponenten umgestellt haben
	// Die Block-Buttons werden jetzt ausschließlich über die BlockButton-Komponente im Template erstellt

	function setupBlockSelectorUI() {
		console.log('=== DEBUG: setupBlockSelectorUI() aufgerufen ===');

		if (!blockSelectorContainerEl) {
			console.error('Block selector container element not found');
			return;
		}

		// Stelle nur sicher, dass der Container sichtbar ist
		blockSelectorContainerEl.style.display = 'flex';
		blockSelectorContainerEl.style.visibility = 'visible';
		blockSelectorContainerEl.style.zIndex = '1000';

		// WICHTIG: Wir leeren den Container NICHT mehr und fügen keine manuellen DOM-Elemente hinzu
		// Die Buttons werden jetzt vollständig durch die Svelte-Komponenten in der #each-Schleife im Template erstellt

		console.log('Block-Typen geladen:', availableBlockTypes);
	}

	function initEventListeners() {
		window.addEventListener('resize', onWindowResize, false);
		containerEl.addEventListener('mousemove', onEditorMouseMove, false);
		containerEl.addEventListener('mousedown', onEditorMouseDown, false);
		containerEl.addEventListener('contextmenu', (event) => {
			if (currentMode === 'editor') event.preventDefault();
		});

		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);

		// Die Buttons werden jetzt über Svelte-Komponenten gesteuert
		// Kein addEventListener mehr notwendig für playModeButtonEl

		if (jumpButtonEl) {
			jumpButtonEl.addEventListener('click', () => {
				if (currentMode === 'play' && !gameWon) {
					simulatedJump = true;
				}
			});
		}
	}

	function onEditorMouseMove(event: MouseEvent): void {
		if (currentMode !== 'editor' || !orbitControls.enabled || !placementHelper) return;

		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		raycaster.setFromCamera(mouse, camera);

		const intersects = raycaster.intersectObjects(Array.from(voxels.values()), false);
		if (intersects.length > 0) {
			const intersect = intersects[0];
			if (intersect.face) {
				const normal = intersect.face.normal.clone();
				const clickedVoxelPos = intersect.object.position;
				placementHelper.position.copy(clickedVoxelPos).add(normal.multiplyScalar(VOXEL_SIZE));
				placementHelper.position.x =
					Math.floor(placementHelper.position.x / VOXEL_SIZE) * VOXEL_SIZE + VOXEL_SIZE / 2;
				placementHelper.position.y =
					Math.floor(placementHelper.position.y / VOXEL_SIZE) * VOXEL_SIZE + VOXEL_SIZE / 2;
				placementHelper.position.z =
					Math.floor(placementHelper.position.z / VOXEL_SIZE) * VOXEL_SIZE + VOXEL_SIZE / 2;
				placementHelper.visible = true;
			} else {
				placementHelper.visible = false;
			}
		} else {
			placementHelper.visible = false;
		}
	}

	function onEditorMouseDown(event: MouseEvent): void {
		if (currentMode !== 'editor' || !orbitControls.enabled || event.target !== renderer.domElement)
			return;

		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		raycaster.setFromCamera(mouse, camera);

		const intersects = raycaster.intersectObjects(Array.from(voxels.values()), false);
		if (intersects.length > 0) {
			const intersect = intersects[0];
			const clickedVoxelData = intersect.object.userData;

			if (event.button === 2) {
				// Rechtsklick: Block entfernen
				removeVoxel(clickedVoxelData.x, clickedVoxelData.y, clickedVoxelData.z);
			} else if (event.button === 0 && intersect.face) {
				// Linksklick: Block hinzufügen
				const normal = intersect.face.normal.clone();
				const placeX = clickedVoxelData.x + normal.x;
				const placeY = clickedVoxelData.y + normal.y;
				const placeZ = clickedVoxelData.z + normal.z;

				// Prüfe, ob ein Spawn-Block platziert werden soll
				if (currentBlockType === 'spawn') {
					// Wenn bereits ein Spawn-Block existiert, entferne ihn zuerst
					if (spawnBlockCoordinates) {
						const oldSpawnBlock = blockManager.getVoxelMesh(
							spawnBlockCoordinates.x,
							spawnBlockCoordinates.y,
							spawnBlockCoordinates.z
						);
						if (oldSpawnBlock && oldSpawnBlock.userData.isSpawnPoint) {
							console.log('Entferne alten Spawn-Block an:', spawnBlockCoordinates);
							// Verwende forceRemove=true, um den Spawn-Block zu entfernen
							removeVoxel(
								spawnBlockCoordinates.x,
								spawnBlockCoordinates.y,
								spawnBlockCoordinates.z,
								true
							);
						}
					}

					// Platziere den neuen Spawn-Block
					addVoxel(placeX, placeY, placeZ, 'spawn');

					// Aktualisiere die Spawn-Koordinaten
					spawnBlockCoordinates = { x: placeX, y: placeY, z: placeZ };

					// Markiere den Block als Spawn-Punkt
					const newSpawnBlock = blockManager.getVoxelMesh(placeX, placeY, placeZ);
					if (newSpawnBlock) {
						newSpawnBlock.userData.isSpawnPoint = true;
						console.log('Neuer Spawn-Block gesetzt an:', spawnBlockCoordinates);
					}
				} else {
					// Normaler Block (kein Spawn)

					// Prüfe, ob der Block über dem Spawn-Block platziert werden soll
					if (
						spawnBlockCoordinates &&
						placeX === spawnBlockCoordinates.x &&
						placeZ === spawnBlockCoordinates.z &&
						placeY === spawnBlockCoordinates.y + 1
					) {
						console.log('Blockieren: Versuch, einen Block über dem Spawn-Block zu platzieren');
						// Zeige visuelles Feedback an (optional)
						// Hier könnte man einen kurzen Hinweis einblenden
					} else {
						// Block kann platziert werden
						addVoxel(placeX, placeY, placeZ, currentBlockType);
					}
				}
			}
		}
	}

	// Timer-Funktionen
	let timerStarted = false; // Flag, um zu verfolgen, ob der Timer bereits gestartet wurde

	function startTimer(): void {
		// Stoppe einen eventuell laufenden Timer
		stopTimer();

		// Setze die Zeit zurück, aber starte den Timer noch nicht
		elapsedTime = 0;

		// Aktualisiere die Timer-Anzeige mit 00:00:00
		updateTimerDisplay();

		// Setze das Flag zurück
		timerStarted = false;

		console.log('Timer zurückgesetzt, wartet auf erste Spielerbewegung');
	}

	function startTimerOnFirstMovement(): void {
		// Nur starten, wenn der Timer noch nicht läuft
		if (!timerStarted) {
			console.log('Erste Bewegung erkannt, Timer startet jetzt');
			timerStarted = true;
			gameStartTime = Date.now();

			// Starte das Timer-Intervall (alle 100ms aktualisieren)
			timerInterval = window.setInterval(() => {
				elapsedTime = Date.now() - gameStartTime;
				updateTimerDisplay();
			}, 100);
		}
	}

	function stopTimer(): void {
		if (timerInterval !== null) {
			window.clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function updateTimerDisplay(): void {
		if (!timerDisplayEl) return;

		// Berechne Minuten, Sekunden und Millisekunden
		const totalSeconds = Math.floor(elapsedTime / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		const milliseconds = Math.floor((elapsedTime % 1000) / 10);

		// Formatiere die Zeit als MM:SS:ss
		const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;

		// Aktualisiere die Timer-Anzeige
		timerDisplayEl.textContent = `Zeit: ${formattedTime}`;

		// Zeige die Timer-Anzeige im Spielmodus an
		if (currentMode === 'play') {
			timerDisplayEl.style.display = 'block';
		} else {
			timerDisplayEl.style.display = 'none';
		}
	}

	// Spielmodus-Funktionen
	function switchToPlayMode() {
		currentMode = 'play';
		gameWon = false;
		winMessageEl.style.display = 'none';
		deathMessageEl.style.display = 'none';

		// Zurücksetzen der erreichten Ziele beim Start des Spiels
		reachedGoals = [];

		// Debug-Ausgabe: Anzahl der Zielblöcke
		console.log(`Spielstart: ${goalBlocks.length} Zielblöcke vorhanden`);
		goalBlocks.forEach((goal, index) => {
			console.log(`Ziel ${index + 1}: Position (${goal.x}, ${goal.y}, ${goal.z})`);
		});

		// Starte den Timer
		startTimer();

		// UI-Elemente aktualisieren
		// Der Button wird jetzt über die Svelte-Komponente gesteuert
		// Wir müssen nur den currentMode aktualisieren, die Komponente reagiert darauf
		jumpButtonEl.style.display = 'inline-flex';
		respawnCounterDisplayEl.style.display = 'block';

		// Zielanzeige aktivieren
		updateGoalDisplay();

		blockInfoDisplayEl.style.display = 'none';

		placementHelper.visible = false;
		blockSelectorContainerEl.style.display = 'none';

		lastOrbitControlsState.position.copy(camera.position);
		lastOrbitControlsState.target.copy(orbitControls.target);
		orbitControls.enabled = false;

		respawnPlayer(true);
		pointerLockControls.lock();
	}

	function switchToEditorMode() {
		currentMode = 'editor';

		// Stoppe den Timer
		stopTimer();

		// Der Button wird jetzt über die Svelte-Komponente gesteuert
		// Wir müssen nur den currentMode aktualisieren, die Komponente reagiert darauf
		jumpButtonEl.style.display = 'none';
		respawnCounterDisplayEl.style.display = 'none';
		blockInfoDisplayEl.style.display = 'none';

		pointerLockControls.unlock();
		crosshairEl.style.display = 'none';
		blockSelectorContainerEl.style.display = 'flex';
		placementHelper.visible = true;

		camera.position.copy(lastOrbitControlsState.position);
		orbitControls.target.copy(lastOrbitControlsState.target);
		orbitControls.enabled = true;
		orbitControls.update();
	}

	function togglePlayMode() {
		if (gameWon) {
			gameWon = false;
			winMessageEl.style.display = 'none';
			switchToEditorMode();
			return;
		}

		if (currentMode === 'editor') {
			switchToPlayMode();
		} else {
			switchToEditorMode();
		}
	}

	function toggleInfoDisplay() {
		// Verwende die reaktive Variable controlsVisible
		controlsVisible = !controlsVisible;
	}

	function updateBlockInfoDisplay() {
		if (pointerLockControls.isLocked && currentMode === 'play' && !gameWon) {
			playerRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
			const intersects = playerRaycaster.intersectObjects(Array.from(voxels.values()), false);

			if (intersects.length > 0 && intersects[0].distance < 5) {
				const voxelMesh = intersects[0].object;
				const blockDef = BLOCK_TYPES[voxelMesh.userData.type];
				if (blockDef) {
					blockInfoDisplayEl.textContent = `Block: ${blockDef.name}`;
					blockInfoDisplayEl.style.display = 'block';
				} else {
					blockInfoDisplayEl.style.display = 'none';
				}
			} else {
				blockInfoDisplayEl.style.display = 'none';
			}
		} else {
			blockInfoDisplayEl.style.display = 'none';
		}
	}

	// Spezielle Funktion für den Respawn nach einem Gewinn
	// Respawnt den Spieler ohne die Versuche zu erhöhen
	function respawnPlayerAfterWin() {
		console.log('Respawn nach Gewinn, Versuche bleiben unverändert:', respawnCounter);

		// Level zurücksetzen (zerbrechliche Blöcke etc.)
		resetLevel();

		// Timer wird bereits in triggerWin zurückgesetzt

		// Verwende die normale Respawn-Funktion mit dem speziellen Parameter
		respawnPlayerInternal(false, false);
	}

	// Normale Respawn-Funktion für Tod und initialen Spawn
	function respawnPlayer(isInitialSpawn = false) {
		// Zähle die Respawn-Versuche nur hoch, wenn der Spieler stirbt (nicht beim initialen Spawn)
		if (!isInitialSpawn) {
			respawnCounter++;
			console.log('Spieler ist gestorben, erhöhe Versuche auf:', respawnCounter);

			// Bei jedem Tod (nicht beim initialen Spawn):
			// 1. Timer zurücksetzen
			stopTimer();
			startTimer();

			// 2. Level zurücksetzen (zerbrechliche Blöcke etc.)
			resetLevel();
		} else {
			respawnCounter = 1;
			console.log('Initialer Spawn, setze Versuche auf:', respawnCounter);
		}
		respawnCounterDisplayEl.textContent = `Versuche: ${respawnCounter}`;

		// Verwende die interne Respawn-Funktion
		respawnPlayerInternal(isInitialSpawn, true);
	}

	// Interne Funktion für den Respawn-Prozess
	// countAsAttempt: Gibt an, ob dieser Respawn als Versuch gezählt werden soll (bei Tod ja, bei Gewinn nein)
	function respawnPlayerInternal(isInitialSpawn = false, countAsAttempt = true) {
		// Kein Text-Einblender mehr, direkt respawnen
		// Bei initialem Spawn sofort, sonst nach sehr kurzer Verzögerung (für Sinkeffekt)
		const respawnDelay = isInitialSpawn ? 0 : 400; // Reduziert auf 400ms für schnelleres Respawnen

		setTimeout(() => {
			if (!spawnBlockCoordinates) {
				console.error('Kein Spawn-Punkt definiert! Setze Spieler auf Standardposition.');
				const defaultPosition = new THREE.Vector3(
					(WORLD_SIZE.width / 2) * VOXEL_SIZE,
					(WORLD_SIZE.height / 2 + playerConfig.height / 2) * VOXEL_SIZE,
					(WORLD_SIZE.depth / 2) * VOXEL_SIZE
				);
				playerController.setPosition(defaultPosition);
			} else {
				const spawnPosition = new THREE.Vector3(
					spawnBlockCoordinates.x * VOXEL_SIZE + VOXEL_SIZE / 2,
					(spawnBlockCoordinates.y + 1) * VOXEL_SIZE + playerConfig.height / 2,
					spawnBlockCoordinates.z * VOXEL_SIZE + VOXEL_SIZE / 2
				);
				playerController.setPosition(spawnPosition);
			}
			playerController.setVelocity(new THREE.Vector3(0, 0, 0));
		}, respawnDelay);
	}

	// Wird aufgerufen, wenn der Spieler einen Zielblock erreicht
	function handleGoalReached(position: PlayerPosition): void {
		// Prüfe, ob die Position einem Zielblock entspricht
		const goalBlockIndex = goalBlocks.findIndex(
			(goal) =>
				Math.floor(position.x / VOXEL_SIZE) === goal.x &&
				Math.floor(position.y / VOXEL_SIZE) === goal.y &&
				Math.floor(position.z / VOXEL_SIZE) === goal.z
		);

		if (goalBlockIndex !== -1) {
			// Prüfe, ob das Ziel bereits erreicht wurde
			const alreadyReached = reachedGoals.some(
				(reached) =>
					reached.x === goalBlocks[goalBlockIndex].x &&
					reached.y === goalBlocks[goalBlockIndex].y &&
					reached.z === goalBlocks[goalBlockIndex].z
			);

			if (!alreadyReached) {
				// Füge das Ziel zu den erreichten Zielen hinzu
				reachedGoals.push({ ...goalBlocks[goalBlockIndex] });
				updateGoalDisplay();

				// Prüfe, ob alle Ziele erreicht wurden
				if (reachedGoals.length === goalBlocks.length) {
					triggerWin();
				}
			}
		}
	}

	// Speichere die letzte Gewinnzeit global, damit sie nicht verloren geht
	let lastWinTime = '00:00:00';

	function triggerWin() {
		if (gameWon) return;

		// Wichtig: Erfasse die aktuelle Zeit VOR dem Stoppen des Timers
		const currentElapsedTime = elapsedTime;

		// Stoppe den Timer
		stopTimer();

		// Formatiere die Endzeit basierend auf der erfassten Zeit
		const totalSeconds = Math.floor(currentElapsedTime / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		const milliseconds = Math.floor((currentElapsedTime % 1000) / 10);

		const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;

		// Speichere die aktuelle Zeit explizit, damit sie nicht verloren geht
		// Nur speichern, wenn die Zeit nicht 00:00:00 ist (d.h. wenn tatsächlich Zeit vergangen ist)
		if (currentElapsedTime > 0) {
			lastWinTime = formattedTime;
			console.log(
				'Gewinnzeit gespeichert:',
				lastWinTime,
				'(Millisekunden:',
				currentElapsedTime,
				')'
			);
		} else {
			console.log('Keine gültige Zeit zum Speichern gefunden. Aktuelle Zeit:', currentElapsedTime);
		}

		// Speichere die Gewinnzeit für die Anzeige auf dem Startblock
		// Verwende die gespeicherte Zeit, wenn verfügbar
		const displayTime =
			currentElapsedTime > 0
				? formattedTime
				: lastWinTime !== '00:00:00'
					? lastWinTime
					: formattedTime;
		const winTimeText = `Gewonnen! Zeit: ${displayTime}`;

		// Verstecke die Gewinnmeldung im UI (wird stattdessen auf dem Startblock angezeigt)
		winMessageEl.style.display = 'none';

		// Erstelle einen Text-Block auf dem Startblock mit der Gewinnzeit
		if (spawnBlockCoordinates) {
			createWinTextOnSpawnBlock(winTimeText);
		}

		// Setze die erreichten Ziele zurück, damit der Spieler erneut spielen kann
		reachedGoals = [];
		updateGoalDisplay();

		// Respawn den Spieler, aber ohne die Versuche zu erhöhen (da er gewonnen hat, nicht gestorben ist)
		// Wir verwenden einen speziellen Parameter, um anzuzeigen, dass es sich um einen Respawn nach Gewinn handelt
		respawnPlayerAfterWin();

		// Nach dem Respawn den Blick des Spielers direkt nach unten richten
		setTimeout(() => {
			// Warte auf den Respawn und richte dann den Blick steil nach unten
			if (camera) {
				// Setze die Rotation der Kamera zurück
				camera.rotation.set(0, 0, 0);

				// Dann neige die Kamera steil nach unten (fast 90 Grad)
				camera.rotation.x = -Math.PI / 2.1; // Fast 90 Grad nach unten (ca. 85 Grad)

				// Stelle sicher, dass die Kamera in Richtung des Startblocks zeigt
				if (spawnBlockCoordinates) {
					const directionToSpawn = new THREE.Vector3(
						spawnBlockCoordinates.x * VOXEL_SIZE + VOXEL_SIZE / 2 - camera.position.x,
						0, // Ignoriere Y-Komponente für die Drehung
						spawnBlockCoordinates.z * VOXEL_SIZE + VOXEL_SIZE / 2 - camera.position.z
					).normalize();

					// Berechne den Winkel zur Z-Achse
					const angle = Math.atan2(directionToSpawn.x, directionToSpawn.z);
					camera.rotation.y = angle;

					console.log('Kamera steil nach unten auf den Startblock gerichtet');
				}
			}
		}, 600); // Etwas längere Wartezeit (600ms), um sicherzustellen, dass der Respawn vollständig ist

		// Starte einen neuen Timer für die nächste Runde (wird erst bei Bewegung aktiviert)
		startTimer();

		// Setze gameWon zurück, damit der Spieler weiterspielen kann
		gameWon = false;

		// UI-Elemente normal belassen (Spielmodus bleibt aktiv)
		jumpButtonEl.style.display = 'inline-flex';
	}

	// Spieler-Bewegung
	function updatePlayer(deltaTime: number): void {
		// Delegiere die Aktualisierung an den PlayerController
		playerController.update(deltaTime, pointerLockControls.isLocked, gameWon);
	}

	// Erstellt einen Text auf dem Startblock mit der Gewinnzeit
	function createWinTextOnSpawnBlock(winText: string): void {
		if (!spawnBlockCoordinates) return;

		// Stelle sicher, dass die aktuelle Gewinnzeit verwendet wird
		// Verwende immer die gespeicherte Zeit, wenn verfügbar
		if (lastWinTime !== '00:00:00') {
			console.log('Verwende gespeicherte Gewinnzeit für Anzeige:', lastWinTime);
			winText = `Gewonnen! Zeit: ${lastWinTime}`;
		} else {
			console.log('Keine gespeicherte Zeit gefunden, verwende aktuelle Zeit');
		}

		// Entferne eventuell vorhandene alte Win-Text-Objekte
		scene.children.forEach((child) => {
			if (child.userData && child.userData.isWinText) {
				scene.remove(child);
			}
		});

		// Erstelle einen Canvas für den Text
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) return;

		canvas.width = 512;
		canvas.height = 256;

		// Setze Hintergrund transparent
		context.clearRect(0, 0, canvas.width, canvas.height);

		// Zeichne den Text
		context.fillStyle = 'white';
		context.font = 'bold 48px Arial';
		context.textAlign = 'center';
		context.textBaseline = 'middle';

		// Teile den Text in zwei Zeilen auf
		const lines = winText.split('! ');
		context.fillText(lines[0] + '!', canvas.width / 2, canvas.height / 3);
		context.fillText(lines[1], canvas.width / 2, (canvas.height * 2) / 3);

		// Erstelle eine Textur aus dem Canvas
		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;

		// Erstelle ein Material mit der Textur
		const material = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
			side: THREE.DoubleSide,
		});

		// Erstelle eine Plane für den Text
		const textPlane = new THREE.Mesh(
			new THREE.PlaneGeometry(VOXEL_SIZE * 1.5, VOXEL_SIZE * 0.75),
			material
		);

		// Positioniere die Plane über dem Startblock
		textPlane.position.set(
			spawnBlockCoordinates.x * VOXEL_SIZE + VOXEL_SIZE / 2,
			(spawnBlockCoordinates.y + 1) * VOXEL_SIZE + 0.01, // Knapp über dem Block
			spawnBlockCoordinates.z * VOXEL_SIZE + VOXEL_SIZE / 2
		);

		// Drehe die Plane horizontal
		textPlane.rotation.x = -Math.PI / 2;

		// Markiere das Objekt als Win-Text
		textPlane.userData.isWinText = true;

		// Füge die Plane zur Szene hinzu
		scene.add(textPlane);

		// Ändere die Farbe des Startblocks zu Gold
		const spawnBlock = blockManager.getVoxelMesh(
			spawnBlockCoordinates.x,
			spawnBlockCoordinates.y,
			spawnBlockCoordinates.z
		);
		if (spawnBlock && spawnBlock.material instanceof THREE.MeshStandardMaterial) {
			spawnBlock.material.color.set(0xffd700); // Gold
			spawnBlock.material.emissive.set(0x665500); // Leichtes Leuchten
			spawnBlock.material.needsUpdate = true;
		}
	}

	// Lifecycle-Hook
	onMount(() => {
		console.log('=== GameCanvas-Komponente wird gemountet ===');

		// Lade verfügbare Level
		loadAvailableLevels();

		// Stelle sicher, dass alle DOM-Referenzen korrekt gebunden sind
		setTimeout(() => {
			console.log('DOM-Referenzen nach Timeout:', {
				containerEl: !!containerEl,
				blockSelectorContainerEl: !!blockSelectorContainerEl,
				blockSelectorPath: blockSelectorContainerEl
					? blockSelectorContainerEl.outerHTML
					: 'nicht gefunden',
			});

			// Initialisiere die Spielwelt
			init();

			// Versuche erneut, den Block-Selektor zu initialisieren, falls er beim ersten Mal nicht funktioniert hat
			setTimeout(() => {
				if (blockSelectorContainerEl) {
					console.log('Zweiter Versuch, Block-Selektor zu initialisieren');
					setupBlockSelectorUI();

					// Überprüfe, ob der Container Kinder hat
					if (blockSelectorContainerEl.children.length === 0) {
						console.log(
							'Block-Selektor hat keine Kinder - Svelte-Komponenten sollten automatisch gerendert werden'
						);
						// Keine manuelle Erstellung mehr nötig, da wir auf Svelte-Komponenten umgestellt haben
					}
				}
			}, 500);
		}, 100);

		return () => {
			// Aufräumen bei Komponentenzerstörung
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}

			if (renderer) {
				renderer.dispose();
			}

			if (orbitControls) {
				orbitControls.dispose();
			}

			// Event-Listener entfernen
			window.removeEventListener('resize', onWindowResize);
			if (containerEl) {
				containerEl.removeEventListener('mousemove', onEditorMouseMove);
				containerEl.removeEventListener('mousedown', onEditorMouseDown);
			}
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('keyup', handleKeyUp);
		};
	});

	function resetGame() {
		// Spieler zurücksetzen
		resetPlayer();

		// Spielstatus zurücksetzen
		gameState = GameState.STOPPED;
		attempts = 0;
		timer = 0;
		timerRunning = false;

		// UI zurücksetzen
		deathMessageEl.style.display = 'none';
		winMessageEl.style.display = 'none';
	}

	/**
	 * Lädt alle verfügbare Level aus der Datenbank
	 */
	async function loadAvailableLevels() {
		try {
			// Prüfe, ob der Benutzer angemeldet ist
			const user = await AuthService.getCurrentUser();
			if (!user) {
				console.log('Benutzer ist nicht angemeldet, lade öffentliche Level');
			}

			// Lade Level aus der Datenbank
			const loadedLevels = user
				? await LevelService.getUserLevels() // Benutzer-Level, wenn angemeldet
				: await LevelService.getPublicLevels(); // Öffentliche Level für Gäste
			levels = loadedLevels;

			console.log(`${levels.length} Level geladen`);

			// Aktualisiere den currentLevelIndex, wenn ein Level geladen ist
			if (currentLevelId) {
				currentLevelIndex = levels.findIndex(
					(level: { id: string }) => level.id === currentLevelId
				);
			}
		} catch (error) {
			console.error('Fehler beim Laden der Level:', error);
		}
	}

	/**
	 * Lädt das vorherige Level aus der Liste der verfügbaren Level
	 */
	async function loadPreviousLevel() {
		if (levels.length === 0 || currentLevelIndex <= 0) {
			console.log('Kein vorheriges Level verfügbar');
			return;
		}

		const previousIndex = currentLevelIndex - 1;
		const previousLevel = levels[previousIndex];

		console.log(`Lade vorheriges Level: ${previousLevel.name}`);
		await loadLevel(previousLevel.id);
	}

	/**
	 * Lädt das nächste Level aus der Liste der verfügbaren Level
	 */
	async function loadNextLevel() {
		if (levels.length === 0 || currentLevelIndex >= levels.length - 1) {
			console.log('Kein nächstes Level verfügbar');
			return;
		}

		const nextIndex = currentLevelIndex + 1;
		const nextLevel = levels[nextIndex];

		console.log(`Lade nächstes Level: ${nextLevel.name}`);
		await loadLevel(nextLevel.id);
	}

	/**
	 * Erstellt ein neues leeres Level und wechselt in den Editor-Modus
	 */
	function createNewLevel() {
		console.log('Erstelle neues Level');

		// Setze Level-Informationen zurück
		currentLevelId = '';
		currentLevelName = 'Neues Level';
		currentLevelIndex = -1;

		// Lösche alle vorhandenen Blöcke
		blockManager.removeAllBlocks(false); // Auch Spawn-Punkte entfernen

		// Erstelle einen Standard-Boden
		for (let x = -5; x <= 5; x++) {
			for (let z = -5; z <= 5; z++) {
				blockManager.addVoxel(x, 0, z, 'grass');
			}
		}

		// Setze einen Spawn-Punkt
		blockManager.addVoxel(0, 1, 0, 'spawn');
		spawnBlockCoordinates = { x: 0, y: 1, z: 0 };

		// Setze den Spieler auf den Spawn-Punkt
		resetPlayer();

		// Wechsle in den Editor-Modus
		currentMode = 'editor';
		if (pointerLockControls) pointerLockControls.unlock();
		if (orbitControls) orbitControls.enabled = true;

		// Zeige den Block-Selektor an
		if (blockSelectorContainerEl) {
			blockSelectorContainerEl.style.display = 'flex';
		}

		console.log('Neues Level erstellt und Editor-Modus aktiviert');
	}

	/**
	 * Lädt ein Level aus der Datenbank
	 * @param levelId Die ID des zu ladenden Levels
	 */
	async function loadLevel(levelId: string) {
		try {
			console.log(`Lade Level mit ID: ${levelId}`);

			// Level aus der Datenbank laden mit dem LevelService
			const level = await LevelService.loadLevel(levelId);

			if (!level) {
				console.error(`Level mit ID ${levelId} nicht gefunden`);
				return;
			}

			// Setze den aktuellen Level-Namen
			currentLevelId = level.id || '';
			currentLevelName = level.name;

			// Aktualisiere den currentLevelIndex
			currentLevelIndex = levels.findIndex((l: { id: string }) => l.id === currentLevelId);

			// Lösche alle vorhandenen Blöcke
			blockManager.removeAllBlocks();

			// Füge die Blöcke aus dem Level hinzu
			if (level.blocks && level.blocks.length > 0) {
				console.log(`Füge ${level.blocks.length} Blöcke hinzu`);
				for (const block of level.blocks) {
					blockManager.addVoxel(block.x, block.y, block.z, block.type);

					// Setze den Spawn-Punkt, wenn vorhanden
					if (block.isSpawnPoint) {
						spawnBlockCoordinates = { x: block.x, y: block.y, z: block.z };
					}
				}
			} else {
				console.warn('Level enthält keine Blöcke');
			}

			// Setze den Spawn-Punkt, wenn er im Level definiert ist
			if (
				level.spawnPoint &&
				typeof level.spawnPoint === 'object' &&
				'x' in level.spawnPoint &&
				'y' in level.spawnPoint &&
				'z' in level.spawnPoint
			) {
				spawnBlockCoordinates = {
					x: Number(level.spawnPoint.x),
					y: Number(level.spawnPoint.y),
					z: Number(level.spawnPoint.z),
				};
			}

			// Setze den Spieler auf den Spawn-Punkt
			resetPlayer();

			console.log(`Level "${level.name}" geladen`);
		} catch (error) {
			console.error('Fehler beim Laden des Levels:', error);
		}
	}

	// Setze die Spielerposition auf den Spawn-Punkt
	function resetPlayer() {
		if (spawnBlockCoordinates) {
			playerController.setPosition(
				new THREE.Vector3(
					spawnBlockCoordinates.x + 0.5,
					spawnBlockCoordinates.y + 1.0, // Starte etwas über dem Block
					spawnBlockCoordinates.z + 0.5
				)
			);
		} else {
			// Fallback: Setze den Spieler auf eine Standardposition
			playerController.setPosition(new THREE.Vector3(0, 5, 0));
		}

		// Setze die Spielergeschwindigkeit zurück
		playerController.setVelocity(new THREE.Vector3(0, 0, 0));
	}
</script>

<div class="game-wrapper" style="width: 100%; height: 100%;">
	<div bind:this={containerEl} class="container"></div>
	<div bind:this={crosshairEl} class="crosshair"></div>

	<div class="controls-container">
		{#if controlsVisible}
			<div bind:this={controlsHelpEl} class="controls-help">
				<h3 class="text-lg font-semibold mb-2">Editor Modus:</h3>
				<p class="text-sm"><strong>Kamera:</strong> LMT+Ziehen, Mausrad, MMT+Ziehen</p>
				<p class="text-sm">
					<strong>Block +:</strong> Linksklick | <strong>Block -:</strong> Rechtsklick
				</p>
				<h3 class="text-lg font-semibold mt-3 mb-2">Spiel Modus:</h3>
				<p class="text-sm"><strong>Umsehen:</strong> Maus (invertiert)</p>
				<p class="text-sm"><strong>Laufen:</strong> W,A,S,D / Pfeiltasten</p>
				<p class="text-sm"><strong>Springen:</strong> Leertaste / Springen-Button</p>
				<p class="text-sm"><strong>Modus verlassen:</strong> ESC / Stopp-Button</p>
			</div>
		{/if}
		<div class="controls-button-container">
			<CircleButton
				icon="info"
				onClick={() => (controlsVisible = !controlsVisible)}
				color="#4A5568"
				tooltip={controlsVisible ? 'Steuerung ausblenden' : 'Steuerung anzeigen'}
			/>
		</div>
	</div>

	<!-- Level-Navigation oben links -->
	<div class="game-ui-top-left">
		<div class="level-navigation">
			<button class="nav-button prev-level" on:click={loadPreviousLevel}>&lt;</button>
			<div class="level-name">{currentLevelName || 'Neues Level'}</div>
			<button class="nav-button next-level" on:click={loadNextLevel}>&gt;</button>
			<button class="nav-button new-level" on:click={createNewLevel}>+</button>
		</div>
	</div>

	<div class="game-ui-top-right">
		<AuthButton buttonClass="game-auth-button" />
		<div bind:this={respawnCounterDisplayEl} class="respawn-counter-display">Versuche: 0</div>
		<div bind:this={timerDisplayEl} class="timer-display">Zeit: 00:00:00</div>
		<div bind:this={goalDisplayEl} class="goal-display">Ziele: 0/0</div>
		<button bind:this={jumpButtonEl} class="ui-button jump-button">Springen</button>
		<div bind:this={blockInfoDisplayEl} class="block-info-display"></div>

		{#if currentMode === 'editor'}
			<button class="ui-button save-button" on:click={() => (isSaveLevelModalOpen = true)}
				>Level speichern</button
			>
		{/if}
	</div>

	<div class="game-ui-bottom-left">
		<CircleButton
			icon={currentMode === 'editor' ? 'play' : 'stop'}
			onClick={() => {
				if (currentMode === 'editor') {
					switchToPlayMode();
				} else {
					switchToEditorMode();
				}
			}}
			color={currentMode === 'editor' ? '#38A169' : '#E53E3E'}
			tooltip={currentMode === 'editor' ? 'Spielen' : 'Editor'}
			bind:this={playModeButtonEl}
		/>
	</div>

	<div class="ui-bottom-center" style="z-index: 1000;">
		<div bind:this={blockSelectorContainerEl} class="block-selector">
			{#each availableBlockTypes as blockType}
				<BlockButton
					{blockType}
					blockName={BLOCK_TYPES[blockType].name}
					color={BLOCK_TYPES[blockType].color || 0xcccccc}
					emissive={BLOCK_TYPES[blockType].emissive}
					opacity={BLOCK_TYPES[blockType].opacity || 1}
					selected={blockType === currentBlockType}
					topColor={BLOCK_TYPES[blockType].topColor}
					sideColor={BLOCK_TYPES[blockType].sideColor}
					on:select={(event) => {
						if (currentMode !== 'editor') return;
						currentBlockType = event.detail.blockType;
						blockManager.setCurrentBlockType(currentBlockType);
					}}
				/>
			{/each}
		</div>
	</div>

	<!-- Level-Speicher-Modal -->
	<SaveLevelModal
		bind:isOpen={isSaveLevelModalOpen}
		blocks={blockManager ? blockManager.getSerializableBlocks() : []}
		spawnPoint={spawnBlockCoordinates}
		worldSize={WORLD_SIZE}
		{currentLevelId}
		{currentLevelName}
		on:save={({ detail }) => {
			currentLevelId = detail.levelId;
			currentLevelName = detail.levelName;
		}}
	/>
	<div bind:this={deathMessageEl} class="message-overlay death-message">
		Du bist gestorben!<br /><small>(Respawn in Kürze)</small>
	</div>
	<div bind:this={winMessageEl} class="message-overlay win-message">
		Gewonnen!<br /><small>(ESC / Stopp drücken)</small>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		overflow: hidden;
		font-family: 'Inter', sans-serif;
		background-color: #1a202c;
		color: #e2e8f0;
	}

	.container {
		width: 100%;
		height: 100%;
		display: block;
		cursor: grab;
	}

	.container.playing {
		cursor: none;
	}

	.controls-container {
		position: absolute;
		bottom: 15px;
		right: 15px;
		max-width: 320px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		z-index: 10;
	}

	.controls-button-container {
		margin-top: 10px;
	}

	.controls-help {
		background-color: rgba(42, 50, 66, 0.85);
		padding: 12px 15px;
		border-radius: 8px;
		font-size: 0.9em;
		color: white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		margin-bottom: 8px;
	}

	.controls-help h3 {
		font-size: 1.1em;
	}

	.ui-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background-color: #4a5568;
		color: white;
		border: none;
		padding: 8px 15px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9em;
		transition:
			background-color 0.2s,
			transform 0.1s;
		text-align: center;
		min-width: 110px;
		min-height: 30px;
	}

	.ui-button:hover {
		background-color: #2d3748;
		transform: translateY(-1px);
	}

	.ui-button:active {
		transform: translateY(0px);
	}

	.game-ui-top-left {
		position: absolute;
		top: 10px;
		left: 10px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		z-index: 10;
	}

	.level-navigation {
		display: flex;
		align-items: center;
		background-color: rgba(0, 0, 0, 0.5);
		padding: 5px 10px;
		border-radius: 5px;
		color: white;
		font-size: 16px;
		font-weight: bold;
		gap: 5px;
	}

	.level-name {
		margin: 0 10px;
		min-width: 150px;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nav-button {
		background-color: rgba(255, 255, 255, 0.2);
		border: none;
		color: white;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-weight: bold;
		transition: background-color 0.2s;
	}

	.nav-button:hover {
		background-color: rgba(255, 255, 255, 0.4);
	}

	.nav-button.new-level {
		background-color: rgba(76, 175, 80, 0.6); /* Grünlicher Hintergrund */
		margin-left: 5px;
	}

	.nav-button.new-level:hover {
		background-color: rgba(76, 175, 80, 0.8); /* Dunkleres Grün beim Hover */
	}

	.game-ui-top-right {
		position: absolute;
		top: 15px;
		right: 15px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10px;
		z-index: 100;
	}

	:global(.game-auth-button) {
		background-color: rgba(42, 50, 66, 0.85) !important;
		border-radius: 6px !important;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
	}
	.save-button {
		background-color: #3182ce;
	}

	.save-button:hover {
		background-color: #2b6cb0;
	}

	.game-ui-bottom-left {
		position: absolute;
		bottom: 15px;
		left: 15px;
		z-index: 100;
	}

	.jump-button {
		background-color: #3182ce;
		display: none;
	}

	.jump-button:hover {
		background-color: #2b6cb0;
	}

	.respawn-counter-display,
	.block-info-display {
		background-color: rgba(42, 50, 66, 0.85);
		color: white;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 0.9em;
		margin-bottom: 10px;
		display: none;
	}

	.goal-display,
	.timer-display {
		background-color: rgba(66, 50, 42, 0.85);
		color: white;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 0.9em;
		margin-bottom: 10px;
		display: none;
	}

	.ui-bottom-center {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 15px;
		z-index: 1000; /* Erhöhter z-index */
		pointer-events: auto; /* Stelle sicher, dass Klicks erkannt werden */
	}

	.block-selector {
		background-color: rgba(42, 50, 66, 0.95); /* Erhöhte Deckkraft */
		padding: 10px;
		border-radius: 8px;
		display: flex;
		gap: 10px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.5),
			0 0 0 2px rgba(255, 255, 255, 0.1); /* Verbesserte Sichtbarkeit */
		z-index: 1000; /* Erhöhter z-index */
		pointer-events: auto; /* Stelle sicher, dass Klicks erkannt werden */
	}

	/* Block-Button-Stile wurden in die BlockButton.svelte-Komponente verschoben */

	.crosshair {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 5px;
		height: 5px;
		background-color: rgba(255, 255, 255, 0.8);
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.5);
		transform: translate(-50%, -50%);
		display: none;
		z-index: 100;
	}

	.message-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		padding: 25px 35px;
		border-radius: 12px;
		font-size: 1.6em;
		text-align: center;
		display: none;
		z-index: 200;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
	}

	.death-message {
		background-color: rgba(200, 0, 0, 0.85);
	}
	.win-message {
		background-color: rgba(0, 150, 0, 0.85);
	}
	.message-overlay small {
		font-size: 0.7em;
		display: block;
		margin-top: 8px;
		opacity: 0.9;
	}
</style>
