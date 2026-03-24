<script lang="ts">
	import { terrain } from '../data/colors';
	import { SCENE } from '../data/layout';
</script>

<defs>
	<!-- Meadow gradient (top = darker, bottom = lighter) -->
	<linearGradient id="meadow-gradient" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0%" stop-color={terrain.meadowDark} />
		<stop offset="40%" stop-color={terrain.meadow} />
		<stop offset="100%" stop-color={terrain.meadowLight} />
	</linearGradient>

	<!-- Shore texture pattern -->
	<pattern id="shore-dots" width="8" height="8" patternUnits="userSpaceOnUse">
		<circle cx="2" cy="2" r="0.8" fill={terrain.shoreDark} opacity="0.3" />
		<circle cx="6" cy="6" r="0.6" fill={terrain.shoreDark} opacity="0.2" />
	</pattern>
</defs>

<!-- Main terrain fill (everything below mountains) -->
<rect x="0" y="350" width={SCENE.width} height={SCENE.height - 350} fill="url(#meadow-gradient)" />

<!-- Rolling hills / terrain variation -->
<g>
	<!-- Gentle hills in the meadow -->
	<path
		d="M0,380 Q200,360 400,375 Q600,365 800,378 Q1000,362 1200,372 Q1400,365 1600,380 L1600,420 Q1400,405 1200,410 Q1000,400 800,412 Q600,402 400,408 Q200,398 0,410 Z"
		fill={terrain.meadow}
		opacity="0.5"
	/>

	<!-- Shoreline areas around the lakes (sandy patches) -->
	<ellipse cx="790" cy="485" rx="160" ry="95" fill={terrain.shore} opacity="0.3" />
	<ellipse cx="340" cy="420" rx="90" ry="55" fill={terrain.shore} opacity="0.25" />
	<ellipse cx="1275" cy="445" rx="130" ry="75" fill={terrain.shore} opacity="0.25" />
	<ellipse cx="270" cy="625" rx="130" ry="75" fill={terrain.shore} opacity="0.3" />
	<ellipse cx="760" cy="670" rx="140" ry="80" fill={terrain.shore} opacity="0.3" />
	<ellipse cx="1215" cy="635" rx="125" ry="70" fill={terrain.shore} opacity="0.3" />
</g>

<!-- Small rocks scattered around -->
<g fill={terrain.rock} opacity="0.5">
	<ellipse cx="520" cy="450" rx="8" ry="5" />
	<ellipse cx="525" cy="448" rx="5" ry="3" fill={terrain.rockLight} />
	<ellipse cx="1050" cy="520" rx="6" ry="4" />
	<ellipse cx="450" cy="650" rx="7" ry="4" />
	<ellipse cx="950" cy="710" rx="9" ry="5" />
	<ellipse cx="1400" cy="550" rx="5" ry="3" />
</g>

<!-- Grass tufts along the bottom -->
<g opacity="0.4" fill={terrain.meadowDark}>
	{#each Array(40) as _, i}
		{@const x = i * 42 + 15}
		{@const y = 820 + Math.sin(i * 2.1) * 20}
		<path d="M{x},{y} Q{x + 2},{y - 12} {x + 5},{y} Q{x + 7},{y - 10} {x + 10},{y}" />
	{/each}
</g>
