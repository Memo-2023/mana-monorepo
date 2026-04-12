<!--
  Plants routes layout

  Provides live-query contexts to all child routes (/plants, /plants/[id],
  /plants/add, /plants/tags). The contexts are referenced via getContext()
  in the page files; without this layout the legacy routes would crash at
  runtime with "Cannot read properties of undefined".
-->
<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import {
		toPlant,
		toPlantPhoto,
		toWateringSchedule,
		toWateringLog,
		useAllTags,
	} from '$lib/modules/plants/queries';
	import type {
		LocalPlant,
		LocalPlantPhoto,
		LocalPlantTag,
		LocalWateringSchedule,
		LocalWateringLog,
		Plant,
		PlantPhoto,
		WateringSchedule,
		WateringLog,
	} from '$lib/modules/plants/types';

	let { children }: { children: Snippet } = $props();

	const allPlants = useLiveQueryWithDefault(async () => {
		const visible = (await db.table<LocalPlant>('plants').toArray()).filter((p) => !p.deletedAt);
		const decrypted = await decryptRecords('plants', visible);
		return decrypted.map(toPlant);
	}, [] as Plant[]);

	const allPlantPhotos = useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalPlantPhoto>('plantPhotos').toArray();
		return locals.filter((p) => !p.deletedAt).map(toPlantPhoto);
	}, [] as PlantPhoto[]);

	const allWateringSchedules = useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalWateringSchedule>('wateringSchedules').toArray();
		return locals.filter((s) => !s.deletedAt).map(toWateringSchedule);
	}, [] as WateringSchedule[]);

	const allWateringLogs = useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalWateringLog>('wateringLogs').toArray();
		return locals.filter((l) => !l.deletedAt).map(toWateringLog);
	}, [] as WateringLog[]);

	const allPlantTags = useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalPlantTag>('plantTags').toArray();
		return locals.filter((t) => !t.deletedAt);
	}, [] as LocalPlantTag[]);

	// `useAllTags` from @mana/shared-stores already wraps Dexie's
	// liveQuery in `useLiveQueryWithDefault`, so it returns the same
	// `{ readonly value }` shape and can be passed straight through.
	const allTags = useAllTags();

	setContext('plants', allPlants);
	setContext('plantPhotos', allPlantPhotos);
	setContext('wateringSchedules', allWateringSchedules);
	setContext('wateringLogs', allWateringLogs);
	setContext('plantTags', allPlantTags);
	setContext('tags', allTags);
</script>

{@render children()}
