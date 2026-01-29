/* eslint-disable */
import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		'nestjs/index': 'src/nestjs/index.ts',
	},
	format: ['cjs', 'esm'],
	dts: true,
	clean: true,
	splitting: false,
	sourcemap: true,
	external: ['@nestjs/common', '@nestjs/core'],
});
