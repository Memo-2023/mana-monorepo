/**
 * Safe math expression evaluator.
 *
 * Supports: +, -, *, /, %, ^, parentheses, and scientific functions.
 * Does NOT use eval() — parses manually for safety.
 */

const FUNCTIONS: Record<string, (x: number) => number> = {
	sin: Math.sin,
	cos: Math.cos,
	tan: Math.tan,
	asin: Math.asin,
	acos: Math.acos,
	atan: Math.atan,
	sinh: Math.sinh,
	cosh: Math.cosh,
	tanh: Math.tanh,
	log: Math.log10,
	ln: Math.log,
	sqrt: Math.sqrt,
	cbrt: Math.cbrt,
	abs: Math.abs,
	ceil: Math.ceil,
	floor: Math.floor,
	round: Math.round,
	exp: Math.exp,
};

const CONSTANTS: Record<string, number> = {
	pi: Math.PI,
	PI: Math.PI,
	π: Math.PI,
	e: Math.E,
	E: Math.E,
	φ: 1.6180339887,
	phi: 1.6180339887,
};

type Token =
	| { type: 'number'; value: number }
	| { type: 'op'; value: string }
	| { type: 'func'; value: string }
	| { type: 'paren'; value: '(' | ')' };

function tokenize(expr: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	const s = expr.replace(/\s+/g, '');

	while (i < s.length) {
		// Numbers (including decimals)
		if (/[0-9.]/.test(s[i])) {
			let num = '';
			while (i < s.length && /[0-9.eE]/.test(s[i])) {
				num += s[i++];
				// Handle scientific notation sign
				if ((s[i] === '+' || s[i] === '-') && /[eE]/.test(s[i - 1])) {
					num += s[i++];
				}
			}
			tokens.push({ type: 'number', value: parseFloat(num) });
			continue;
		}

		// Parentheses
		if (s[i] === '(' || s[i] === ')') {
			tokens.push({ type: 'paren', value: s[i] as '(' | ')' });
			i++;
			continue;
		}

		// Operators
		if ('+-*/%^'.includes(s[i])) {
			// Handle unary minus
			if (
				s[i] === '-' &&
				(tokens.length === 0 ||
					tokens[tokens.length - 1].type === 'op' ||
					(tokens[tokens.length - 1].type === 'paren' && tokens[tokens.length - 1].value === '('))
			) {
				let num = '-';
				i++;
				while (i < s.length && /[0-9.eE]/.test(s[i])) {
					num += s[i++];
				}
				if (num.length > 1) {
					tokens.push({ type: 'number', value: parseFloat(num) });
					continue;
				}
				// It's just a minus, push as operator
				tokens.push({ type: 'op', value: '-' });
				continue;
			}
			tokens.push({ type: 'op', value: s[i] });
			i++;
			continue;
		}

		// Special characters (π, etc.)
		if (s[i] === 'π' || s[i] === 'φ') {
			tokens.push({ type: 'number', value: CONSTANTS[s[i]] });
			i++;
			continue;
		}

		// Functions and constants (letters)
		if (/[a-zA-Z_]/.test(s[i])) {
			let name = '';
			while (i < s.length && /[a-zA-Z_0-9]/.test(s[i])) {
				name += s[i++];
			}
			if (CONSTANTS[name] !== undefined) {
				tokens.push({ type: 'number', value: CONSTANTS[name] });
			} else if (FUNCTIONS[name]) {
				tokens.push({ type: 'func', value: name });
			} else {
				throw new Error(`Unknown: ${name}`);
			}
			continue;
		}

		// Factorial
		if (s[i] === '!') {
			tokens.push({ type: 'op', value: '!' });
			i++;
			continue;
		}

		throw new Error(`Unexpected character: ${s[i]}`);
	}

	return tokens;
}

function precedence(op: string): number {
	if (op === '+' || op === '-') return 1;
	if (op === '*' || op === '/' || op === '%') return 2;
	if (op === '^') return 3;
	return 0;
}

function factorial(n: number): number {
	if (n < 0 || !Number.isInteger(n)) throw new Error('Factorial of non-integer');
	if (n > 170) return Infinity;
	let result = 1;
	for (let i = 2; i <= n; i++) result *= i;
	return result;
}

function applyOp(op: string, a: number, b: number): number {
	switch (op) {
		case '+':
			return a + b;
		case '-':
			return a - b;
		case '*':
			return a * b;
		case '/':
			if (b === 0) throw new Error('Division by zero');
			return a / b;
		case '%':
			return a % b;
		case '^':
			return Math.pow(a, b);
		default:
			throw new Error(`Unknown op: ${op}`);
	}
}

/**
 * Evaluate a mathematical expression string.
 * Returns the numeric result or throws on error.
 */
export function evaluate(expression: string): number {
	const tokens = tokenize(expression);
	const output: number[] = [];
	const ops: Token[] = [];

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		if (token.type === 'number') {
			output.push(token.value);
		} else if (token.type === 'func') {
			ops.push(token);
		} else if (token.type === 'op') {
			if (token.value === '!') {
				const val = output.pop();
				if (val === undefined) throw new Error('Missing operand');
				output.push(factorial(val));
			} else {
				while (
					ops.length > 0 &&
					ops[ops.length - 1].type === 'op' &&
					precedence(ops[ops.length - 1].value as string) >= precedence(token.value)
				) {
					const op = ops.pop()!;
					const b = output.pop()!;
					const a = output.pop()!;
					output.push(applyOp(op.value as string, a, b));
				}
				ops.push(token);
			}
		} else if (token.type === 'paren' && token.value === '(') {
			ops.push(token);
		} else if (token.type === 'paren' && token.value === ')') {
			while (
				ops.length > 0 &&
				!(ops[ops.length - 1].type === 'paren' && ops[ops.length - 1].value === '(')
			) {
				const op = ops.pop()!;
				const b = output.pop()!;
				const a = output.pop()!;
				output.push(applyOp(op.value as string, a, b));
			}
			ops.pop(); // remove '('
			// If there's a function on the stack, apply it
			if (ops.length > 0 && ops[ops.length - 1].type === 'func') {
				const func = ops.pop()!;
				const val = output.pop()!;
				output.push(FUNCTIONS[func.value as string](val));
			}
		}
	}

	while (ops.length > 0) {
		const op = ops.pop()!;
		const b = output.pop()!;
		const a = output.pop()!;
		output.push(applyOp(op.value as string, a, b));
	}

	if (output.length !== 1) throw new Error('Invalid expression');
	return output[0];
}

/**
 * Format a number for display — removes trailing zeros, handles very large/small numbers.
 */
export function formatResult(value: number, precision: number = 10): string {
	if (!isFinite(value)) return value > 0 ? '∞' : '-∞';
	if (isNaN(value)) return 'NaN';

	// Use scientific notation for very large/small numbers
	if (Math.abs(value) > 1e15 || (Math.abs(value) < 1e-10 && value !== 0)) {
		return value.toExponential(precision - 1);
	}

	// Round to precision and strip trailing zeros
	const result = parseFloat(value.toPrecision(precision));
	return String(result);
}

/**
 * Convert between number bases.
 */
export function convertBase(value: string, fromBase: number, toBase: number): string {
	const decimal = parseInt(value, fromBase);
	if (isNaN(decimal)) throw new Error('Invalid number');
	return decimal.toString(toBase).toUpperCase();
}
