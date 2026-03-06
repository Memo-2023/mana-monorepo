// Polyfills required for matrix-js-sdk in React Native
import { Buffer } from 'buffer';
import EventEmitter from 'events';

// @ts-expect-error global polyfill
global.Buffer = Buffer;
// @ts-expect-error global polyfill
global.EventEmitter = EventEmitter;

// process stub (Expo provides process.env but not all fields)
if (typeof global.process === 'undefined') {
	// @ts-expect-error global polyfill
	global.process = { env: {}, nextTick: setImmediate };
} else if (typeof global.process.nextTick === 'undefined') {
	global.process.nextTick = setImmediate as unknown as typeof process.nextTick;
}

export {};
