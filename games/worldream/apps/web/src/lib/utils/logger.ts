// Logger utility für API-Calls und Debugging

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

class Logger {
	private level: LogLevel = LogLevel.INFO;
	private prefix: string;

	constructor(prefix: string = 'Worldream') {
		this.prefix = prefix;
		// In Dev-Modus mehr loggen
		if (process.env.NODE_ENV === 'development') {
			this.level = LogLevel.DEBUG;
		}
	}

	private formatMessage(level: string, message: string, data?: any): string {
		const timestamp = new Date().toISOString();
		return `[${timestamp}] [${this.prefix}] [${level}] ${message}`;
	}

	private logWithData(level: string, message: string, data?: any) {
		const formattedMessage = this.formatMessage(level, message);

		if (data) {
			console.log(formattedMessage, data);
		} else {
			console.log(formattedMessage);
		}
	}

	debug(message: string, data?: any) {
		if (this.level <= LogLevel.DEBUG) {
			this.logWithData('DEBUG', message, data);
		}
	}

	info(message: string, data?: any) {
		if (this.level <= LogLevel.INFO) {
			this.logWithData('INFO', message, data);
		}
	}

	warn(message: string, data?: any) {
		if (this.level <= LogLevel.WARN) {
			console.warn(this.formatMessage('WARN', message), data || '');
		}
	}

	error(message: string, error?: any) {
		if (this.level <= LogLevel.ERROR) {
			console.error(this.formatMessage('ERROR', message), error || '');
		}
	}

	// Spezielle Methoden für API-Logging
	apiRequest(service: string, endpoint: string, params: any) {
		this.info(`API Request: ${service} - ${endpoint}`, {
			service,
			endpoint,
			params: this.sanitizeParams(params),
		});
	}

	apiResponse(service: string, endpoint: string, response: any, duration: number) {
		this.info(`API Response: ${service} - ${endpoint} (${duration}ms)`, {
			service,
			endpoint,
			duration,
			response: this.sanitizeResponse(response),
		});
	}

	apiError(service: string, endpoint: string, error: any, duration?: number) {
		this.error(`API Error: ${service} - ${endpoint}${duration ? ` (${duration}ms)` : ''}`, {
			service,
			endpoint,
			duration,
			error: error.message || error,
			stack: error.stack,
		});
	}

	// Entfernt sensitive Daten aus Params
	private sanitizeParams(params: any): any {
		if (!params) return params;

		const sanitized = { ...params };

		// API Keys verstecken
		if (sanitized.apiKey) {
			sanitized.apiKey = '***HIDDEN***';
		}

		// Lange Texte kürzen
		if (sanitized.messages) {
			sanitized.messages = sanitized.messages.map((msg: any) => ({
				...msg,
				content:
					msg.content?.length > 200
						? msg.content.substring(0, 200) + '...[TRUNCATED]'
						: msg.content,
			}));
		}

		if (sanitized.prompt && sanitized.prompt.length > 200) {
			sanitized.prompt = sanitized.prompt.substring(0, 200) + '...[TRUNCATED]';
		}

		return sanitized;
	}

	// Kürzt lange Responses
	private sanitizeResponse(response: any): any {
		if (!response) return response;

		if (typeof response === 'string' && response.length > 500) {
			return response.substring(0, 500) + '...[TRUNCATED]';
		}

		if (response.content && typeof response.content === 'string' && response.content.length > 500) {
			return {
				...response,
				content: response.content.substring(0, 500) + '...[TRUNCATED]',
			};
		}

		if (response.choices) {
			return {
				...response,
				choices: response.choices.map((choice: any) => ({
					...choice,
					message: choice.message
						? {
								...choice.message,
								content:
									choice.message.content?.length > 500
										? choice.message.content.substring(0, 500) + '...[TRUNCATED]'
										: choice.message.content,
							}
						: choice.message,
				})),
			};
		}

		return response;
	}

	// Timer für Performance-Messung
	startTimer(label: string): () => number {
		const start = Date.now();
		this.debug(`Timer started: ${label}`);

		return () => {
			const duration = Date.now() - start;
			this.debug(`Timer ended: ${label} - ${duration}ms`);
			return duration;
		};
	}
}

// Singleton-Instanzen für verschiedene Module
export const apiLogger = new Logger('API');
export const aiLogger = new Logger('AI');
export const dbLogger = new Logger('DB');
export const appLogger = new Logger('APP');

// Default export
export default Logger;
