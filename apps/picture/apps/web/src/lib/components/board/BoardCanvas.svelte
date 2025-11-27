<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Konva from 'konva';
	import { page } from '$app/stores';
	import { boardSettings } from '$lib/stores/boards';
	import {
		canvasItems,
		selectedItemIds,
		canvasZoom,
		canvasPan,
		canvasMode,
		showGrid,
		snapToGrid,
		gridSize,
		selectItem,
		deselectAll,
		updateCanvasItem,
		removeSelectedItems,
		undo,
		redo,
		canUndo,
		canRedo,
	} from '$lib/stores/canvas';
	import { updateBoardItem, updateBoardItems, isImageItem, isTextItem } from '$lib/api/boardItems';
	import { editingTextId, startEditingText, stopEditingText } from '$lib/stores/canvas';

	let container: HTMLDivElement;
	let stage: Konva.Stage;
	let layer: Konva.Layer;
	let backgroundLayer: Konva.Layer;
	let transformer: Konva.Transformer;
	let gridLayer: Konva.Layer;

	// Track nodes for updates
	let imageNodes = new Map<string, Konva.Image>();
	let textNodes = new Map<string, Konva.Text>();
	let isPanning = $state(false);
	let isSaving = $state(false);

	// Text editing
	let textEditingOverlay: HTMLTextAreaElement | null = null;

	const boardId = $derived($page.params.id);

	onMount(() => {
		initializeCanvas();
		setupKeyboardShortcuts();
		renderItems();

		// Subscribe to canvas items changes
		const unsubscribe = canvasItems.subscribe(() => {
			if (stage) {
				renderItems();
			}
		});

		return () => {
			unsubscribe();
		};
	});

	onDestroy(() => {
		if (stage) {
			stage.destroy();
		}
	});

	function initializeCanvas() {
		const width = container.clientWidth;
		const height = container.clientHeight;

		// Create stage
		stage = new Konva.Stage({
			container: container,
			width: width,
			height: height,
			draggable: false,
		});

		// Background layer for grid
		backgroundLayer = new Konva.Layer();
		stage.add(backgroundLayer);

		// Grid layer
		gridLayer = new Konva.Layer();
		stage.add(gridLayer);
		drawGrid();

		// Main layer for images
		layer = new Konva.Layer();
		stage.add(layer);

		// Transformer for resize/rotate
		transformer = new Konva.Transformer({
			nodes: [],
			// All 8 anchors for maximum control
			enabledAnchors: [
				'top-left',
				'top-center',
				'top-right',
				'middle-left',
				'middle-right',
				'bottom-left',
				'bottom-center',
				'bottom-right',
			],
			rotateEnabled: true,
			rotateAnchorOffset: 60, // Distance of rotation handle from image
			rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315], // Snap angles when Shift is pressed

			// Visual styling
			borderStroke: '#4A90E2',
			borderStrokeWidth: 2,
			borderDash: [4, 4], // Dashed border

			// Anchor (handle) styling
			anchorFill: '#4A90E2',
			anchorStroke: '#fff',
			anchorStrokeWidth: 2,
			anchorSize: 10,
			anchorCornerRadius: 2,

			// Rotation anchor styling
			rotateAnchorCursor: 'grab',

			// Behavior
			keepRatio: false, // Shift+Drag for aspect ratio lock
			centeredScaling: false, // Alt+Drag for centered scaling
			flipEnabled: false, // Prevent accidental flipping

			// Boundaries
			boundBoxFunc: (oldBox, newBox) => {
				// Prevent too small sizes
				if (newBox.width < 20 || newBox.height < 20) {
					return oldBox;
				}
				// Prevent too large sizes (optional)
				if (newBox.width > 5000 || newBox.height > 5000) {
					return oldBox;
				}
				return newBox;
			},
		});
		layer.add(transformer);

		// Stage click to deselect
		stage.on('click', (e) => {
			console.log('[Canvas] Stage clicked, target:', e.target.getType());
			if (e.target === stage || e.target === backgroundLayer) {
				console.log('[Canvas] Deselecting all');
				deselectAll();
				transformer.nodes([]);
				layer.batchDraw();
			}
		});

		// Mouse wheel zoom
		stage.on('wheel', (e) => {
			e.evt.preventDefault();
			handleZoom(e);
		});

		// Handle window resize
		window.addEventListener('resize', handleResize);
	}

	function drawGrid() {
		if (!gridLayer || !$showGrid) return;

		gridLayer.destroyChildren();

		const size = $gridSize;
		const width = $boardSettings.width;
		const height = $boardSettings.height;

		// Vertical lines
		for (let x = 0; x <= width; x += size) {
			const line = new Konva.Line({
				points: [x, 0, x, height],
				stroke: '#e5e7eb',
				strokeWidth: 1,
				listening: false,
			});
			gridLayer.add(line);
		}

		// Horizontal lines
		for (let y = 0; y <= height; y += size) {
			const line = new Konva.Line({
				points: [0, y, width, y],
				stroke: '#e5e7eb',
				strokeWidth: 1,
				listening: false,
			});
			gridLayer.add(line);
		}

		gridLayer.batchDraw();
	}

	function renderItems() {
		if (!layer) return;

		console.log('[Canvas] Rendering items:', $canvasItems.length);

		// Remove existing nodes, keep transformer
		imageNodes.forEach((node) => node.destroy());
		textNodes.forEach((node) => node.destroy());
		imageNodes.clear();
		textNodes.clear();

		// Render each item based on type
		$canvasItems.forEach((item) => {
			if (isImageItem(item)) {
				renderImageItem(item);
			} else if (isTextItem(item)) {
				renderTextItem(item);
			}
		});
	}

	function renderImageItem(item: any) {
		const imageObj = new Image();
		imageObj.crossOrigin = 'Anonymous';
		imageObj.onload = () => {
			const konvaImage = new Konva.Image({
				id: item.id,
				name: item.id,
				x: item.position_x,
				y: item.position_y,
				image: imageObj,
				width: item.width || imageObj.width,
				height: item.height || imageObj.height,
				scaleX: item.scale_x,
				scaleY: item.scale_y,
				rotation: item.rotation,
				draggable: true,
				opacity: item.opacity,
			});

			// Click to select
			konvaImage.on('click tap', (e) => {
				e.cancelBubble = true;
				const multiSelect = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
				selectItem(item.id, multiSelect);
				setTimeout(() => updateTransformer(), 0);
			});

			// Drag events
			konvaImage.on('dragstart', () => {
				selectItem(item.id, false);
				setTimeout(() => updateTransformer(), 0);
			});
			konvaImage.on('dragend', () => handleDragEnd(konvaImage, item.id));
			konvaImage.on('transformend', () => handleTransformEnd(konvaImage, item.id));

			layer.add(konvaImage);
			imageNodes.set(item.id, konvaImage);

			// Update transformer if selected
			if ($selectedItemIds.includes(item.id)) {
				setTimeout(() => updateTransformer(), 0);
			}

			layer.batchDraw();
		};

		imageObj.onerror = (error) => console.error('[Canvas] Failed to load image:', item.id, error);
		imageObj.src = item.image.public_url;
	}

	function renderTextItem(item: any) {
		const konvaText = new Konva.Text({
			id: item.id,
			name: item.id,
			x: item.position_x,
			y: item.position_y,
			text: item.text_content,
			fontSize: item.font_size,
			fontFamily: item.properties?.fontFamily || 'Arial',
			fontStyle: `${item.properties?.fontStyle || 'normal'} ${item.properties?.fontWeight || 'normal'}`,
			fill: item.color,
			width: item.width || 300,
			align: item.properties?.textAlign || 'left',
			rotation: item.rotation,
			scaleX: item.scale_x,
			scaleY: item.scale_y,
			opacity: item.opacity,
			draggable: true,
			lineHeight: item.properties?.lineHeight || 1.2,
		});

		// Click to select
		konvaText.on('click tap', (e) => {
			e.cancelBubble = true;
			const multiSelect = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
			selectItem(item.id, multiSelect);
			setTimeout(() => updateTransformer(), 0);
		});

		// Double-click to edit
		konvaText.on('dblclick dbltap', () => {
			showTextEditOverlay(konvaText, item);
		});

		// Drag events
		konvaText.on('dragstart', () => {
			selectItem(item.id, false);
			setTimeout(() => updateTransformer(), 0);
		});
		konvaText.on('dragend', () => handleDragEnd(konvaText, item.id));
		konvaText.on('transformend', () => handleTextTransformEnd(konvaText, item.id));

		layer.add(konvaText);
		textNodes.set(item.id, konvaText);

		// Update transformer if selected
		if ($selectedItemIds.includes(item.id)) {
			setTimeout(() => updateTransformer(), 0);
		}

		layer.batchDraw();
	}

	function updateTransformer() {
		if (!transformer || !layer) return;

		// Collect all selected nodes (images + texts)
		const selectedNodes: (Konva.Image | Konva.Text)[] = [];

		$selectedItemIds.forEach((id) => {
			const imageNode = imageNodes.get(id);
			const textNode = textNodes.get(id);

			if (imageNode) selectedNodes.push(imageNode);
			if (textNode) selectedNodes.push(textNode);
		});

		transformer.nodes(selectedNodes);

		if (selectedNodes.length > 0) {
			transformer.show();
			transformer.visible(true);
			transformer.moveToTop();
		} else {
			transformer.hide();
		}

		layer.batchDraw();
	}

	async function handleDragEnd(node: Konva.Image | Konva.Text, itemId: string) {
		let x = node.x();
		let y = node.y();

		// Snap to grid if enabled
		if ($snapToGrid) {
			const size = $gridSize;
			x = Math.round(x / size) * size;
			y = Math.round(y / size) * size;
			node.x(x);
			node.y(y);
		}

		// Update store
		updateCanvasItem(itemId, {
			position_x: x,
			position_y: y,
		});

		// Save to database
		await saveBoardItem(itemId, { position_x: x, position_y: y });
	}

	async function handleTransformEnd(node: Konva.Image, itemId: string) {
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();
		const rotation = node.rotation();

		// Update store
		updateCanvasItem(itemId, {
			scale_x: scaleX,
			scale_y: scaleY,
			rotation: rotation,
		});

		// Save to database
		await saveBoardItem(itemId, {
			scale_x: scaleX,
			scale_y: scaleY,
			rotation: rotation,
		});
	}

	async function handleTextTransformEnd(node: Konva.Text, itemId: string) {
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();
		const rotation = node.rotation();
		const width = node.width() * scaleX;

		// Reset scale and apply to width for text
		node.scaleX(1);
		node.width(width);

		// Update store
		updateCanvasItem(itemId, {
			width: Math.round(width),
			scale_x: 1,
			scale_y: scaleY,
			rotation: rotation,
		});

		// Save to database
		await saveBoardItem(itemId, {
			width: Math.round(width),
			scale_x: 1,
			scale_y: scaleY,
			rotation: rotation,
		});
	}

	function showTextEditOverlay(textNode: Konva.Text, item: any) {
		// Hide text node while editing
		textNode.hide();
		layer.batchDraw();

		// Get absolute position
		const textPosition = textNode.getAbsolutePosition();
		const stageBox = stage.container().getBoundingClientRect();

		// Create textarea
		const textarea = document.createElement('textarea');
		textarea.value = textNode.text();
		textarea.style.position = 'absolute';
		textarea.style.top = `${stageBox.top + textPosition.y}px`;
		textarea.style.left = `${stageBox.left + textPosition.x}px`;
		textarea.style.width = `${textNode.width() * textNode.scaleX()}px`;
		textarea.style.fontSize = `${textNode.fontSize()}px`;
		textarea.style.fontFamily = textNode.fontFamily();
		textarea.style.color = textNode.fill();
		textarea.style.border = '2px solid #4A90E2';
		textarea.style.padding = '4px';
		textarea.style.margin = '0px';
		textarea.style.overflow = 'hidden';
		textarea.style.background = 'white';
		textarea.style.outline = 'none';
		textarea.style.resize = 'none';
		textarea.style.lineHeight = String(textNode.lineHeight());
		textarea.style.transformOrigin = 'left top';
		textarea.style.textAlign = textNode.align();
		textarea.style.zIndex = '1000';

		const saveText = async () => {
			const newText = textarea.value;
			textNode.text(newText);
			document.body.removeChild(textarea);
			textEditingOverlay = null;
			textNode.show();
			layer.batchDraw();

			// Update store and database
			updateCanvasItem(item.id, { text_content: newText });
			await saveBoardItem(item.id, { text_content: newText });
			stopEditingText();
		};

		const cancelEdit = () => {
			document.body.removeChild(textarea);
			textEditingOverlay = null;
			textNode.show();
			layer.batchDraw();
			stopEditingText();
		};

		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				saveText();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				cancelEdit();
			}
		});

		textarea.addEventListener('blur', () => {
			saveText();
		});

		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();
		textEditingOverlay = textarea;
		startEditingText(item.id);
	}

	async function saveBoardItem(itemId: string, updates: any) {
		if (isSaving) return;

		try {
			isSaving = true;
			await updateBoardItem(itemId, updates);
		} catch (error) {
			console.error('Error saving board item:', error);
		} finally {
			isSaving = false;
		}
	}

	function handleZoom(e: Konva.KonvaEventObject<WheelEvent>) {
		const oldScale = stage.scaleX();
		const pointer = stage.getPointerPosition();

		if (!pointer) return;

		const direction = e.evt.deltaY > 0 ? -1 : 1;
		const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1;
		const clampedScale = Math.max(0.1, Math.min(5, newScale));

		canvasZoom.set(clampedScale);

		// Zoom to pointer position
		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale,
		};

		const newPos = {
			x: pointer.x - mousePointTo.x * clampedScale,
			y: pointer.y - mousePointTo.y * clampedScale,
		};

		stage.scale({ x: clampedScale, y: clampedScale });
		stage.position(newPos);
		canvasPan.set(newPos);
	}

	function setupKeyboardShortcuts() {
		function handleKeyDown(e: KeyboardEvent) {
			// Ignore if typing in input
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
				return;
			}

			switch (e.key.toLowerCase()) {
				case 'delete':
				case 'backspace':
					e.preventDefault();
					removeSelectedItems();
					transformer.nodes([]);
					break;
				case 'escape':
					deselectAll();
					transformer.nodes([]);
					break;
				case 'z':
					if (e.metaKey || e.ctrlKey) {
						e.preventDefault();
						if (e.shiftKey && $canRedo) {
							redo();
						} else if ($canUndo) {
							undo();
						}
					}
					break;
				case 'a':
					if (e.metaKey || e.ctrlKey) {
						e.preventDefault();
						// Select all
						selectedItemIds.set($canvasItems.map((item) => item.id));
						updateTransformer();
					}
					break;
				case ' ':
					e.preventDefault();
					isPanning = true;
					stage.draggable(true);
					container.style.cursor = 'grab';
					break;
			}
		}

		function handleKeyUp(e: KeyboardEvent) {
			if (e.key === ' ') {
				isPanning = false;
				stage.draggable(false);
				container.style.cursor = 'default';
			}
		}

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}

	function handleResize() {
		if (!stage || !container) return;

		const width = container.clientWidth;
		const height = container.clientHeight;

		stage.width(width);
		stage.height(height);
		stage.batchDraw();
	}

	// React to zoom/pan store changes
	$effect(() => {
		if (stage) {
			stage.scale({ x: $canvasZoom, y: $canvasZoom });
			stage.position($canvasPan);
		}
	});

	// React to grid changes
	$effect(() => {
		if ($showGrid) {
			drawGrid();
			gridLayer.show();
		} else {
			gridLayer.hide();
		}
	});

	// React to selected items changes
	$effect(() => {
		console.log('[Canvas] Selected items changed:', $selectedItemIds);
		if (transformer && layer) {
			updateTransformer();
		}
	});
</script>

<div
	bind:this={container}
	class="h-full w-full"
	style="background-color: {$boardSettings.backgroundColor}"
></div>

<style>
	:global(.konvajs-content) {
		width: 100% !important;
		height: 100% !important;
	}
</style>
