// Polyfills required for matrix-js-sdk in React Native
import { Buffer } from 'buffer';

const g = globalThis as any;

g.Buffer = Buffer;

// process stub (Expo provides process.env but not all fields)
if (typeof g.process === 'undefined') {
	g.process = { env: {}, nextTick: setImmediate };
} else if (typeof g.process.nextTick === 'undefined') {
	g.process.nextTick = setImmediate;
}

export {};
