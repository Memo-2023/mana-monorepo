/**
 * Jose Mock - Re-exports the real module functions
 *
 * We use the real jose library for JWT validation tests
 * since we're testing actual JWT creation and verification.
 *
 * Note: We need to explicitly require and re-export because
 * jest module mocking doesn't handle ESM re-exports well.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jose = require('jose');

export const SignJWT = jose.SignJWT;
export const jwtVerify = jose.jwtVerify;
export const createRemoteJWKSet = jose.createRemoteJWKSet;
export const errors = jose.errors;
export const generateKeyPair = jose.generateKeyPair;
export const exportJWK = jose.exportJWK;
export const importJWK = jose.importJWK;
