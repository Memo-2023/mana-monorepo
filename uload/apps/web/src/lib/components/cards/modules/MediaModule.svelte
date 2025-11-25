<script lang="ts">
	import type { MediaModuleProps } from '../types';
	import { generateQRCodeURL } from '$lib/qrcode';

	let {
		type = 'image',
		src = '',
		alt = '',
		aspectRatio = '16/9',
		objectFit = 'cover',
		qrData = '',
		qrSize = 200,
		qrColor = 'black',
		icon = '',
		iconSize = '3rem'
	}: MediaModuleProps = $props();
</script>

<div class="media-module">
	{#if type === 'image' && src}
		<img
			{src}
			{alt}
			class="w-full rounded-lg"
			style="aspect-ratio: {aspectRatio}; object-fit: {objectFit};"
		/>
	{:else if type === 'video' && src}
		<video {src} controls class="w-full rounded-lg" style="aspect-ratio: {aspectRatio};">
			<track kind="captions" />
		</video>
	{:else if type === 'qr' && qrData}
		<div class="flex justify-center">
			<img
				src={generateQRCodeURL(qrData, qrSize, qrColor, 'png')}
				alt="QR Code"
				class="rounded-lg bg-white p-2"
			/>
		</div>
	{:else if type === 'icon' && icon}
		<div class="flex justify-center">
			<span style="font-size: {iconSize};">{icon}</span>
		</div>
	{/if}
</div>
