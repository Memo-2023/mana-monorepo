/**
 * Jose Mock - Uses jest.requireActual to get the real module
 *
 * We use the real jose library for JWT validation tests
 * since we're testing actual JWT creation and verification.
 */

// Use jest.requireActual to bypass the mock and get the real module
const actualJose = jest.requireActual('jose');

export const SignJWT = actualJose.SignJWT;
export const jwtVerify = actualJose.jwtVerify;
export const createRemoteJWKSet = actualJose.createRemoteJWKSet;
export const errors = actualJose.errors;
export const generateKeyPair = actualJose.generateKeyPair;
export const exportJWK = actualJose.exportJWK;
export const importJWK = actualJose.importJWK;
export const decodeJwt = actualJose.decodeJwt;
export const decodeProtectedHeader = actualJose.decodeProtectedHeader;
