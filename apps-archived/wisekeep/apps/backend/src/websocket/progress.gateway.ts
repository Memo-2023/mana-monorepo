import {
	WebSocketGateway,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export interface JobUpdatePayload {
	status: string;
	progress?: number;
	error?: string;
	videoInfo?: {
		id: string;
		title: string;
		channel: string;
		thumbnail: string;
	};
	transcriptPath?: string;
}

@WebSocketGateway({
	cors: {
		origin: ['http://localhost:5173', 'http://localhost:4321', 'http://localhost:3000'],
		credentials: true,
	},
	namespace: '/progress',
})
export class ProgressGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(ProgressGateway.name);

	@WebSocketServer()
	server: Server;

	handleConnection(client: Socket) {
		this.logger.log(`Client connected: ${client.id}`);

		// Send heartbeat every 10 seconds
		const interval = setInterval(() => {
			client.emit('heartbeat', { timestamp: Date.now() });
		}, 10000);

		client.on('disconnect', () => {
			clearInterval(interval);
		});
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
	}

	broadcastJobUpdate(jobId: string, payload: JobUpdatePayload) {
		this.server.emit('job_update', {
			type: 'job_update',
			jobId,
			...payload,
			timestamp: Date.now(),
		});
	}

	broadcastJobComplete(jobId: string, payload: JobUpdatePayload) {
		this.server.emit('job_complete', {
			type: 'job_complete',
			jobId,
			...payload,
			timestamp: Date.now(),
		});
	}

	broadcastJobError(jobId: string, error: string) {
		this.server.emit('job_error', {
			type: 'job_error',
			jobId,
			error,
			timestamp: Date.now(),
		});
	}
}
