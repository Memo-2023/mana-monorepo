import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { isOk } from '@manacore/shared-errors';
import { ConversationService } from './conversation.service';
import { type Conversation } from '../db/schema/conversations.schema';
import { type Message } from '../db/schema/messages.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
	constructor(private readonly conversationService: ConversationService) {}

	@Get()
	async getConversations(
		@CurrentUser() user: CurrentUserData,
		@Query('spaceId') spaceId?: string
	): Promise<Conversation[]> {
		const result = await this.conversationService.getConversations(user.userId, spaceId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get('archived')
	async getArchivedConversations(@CurrentUser() user: CurrentUserData): Promise<Conversation[]> {
		const result = await this.conversationService.getArchivedConversations(user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get(':id')
	async getConversation(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<Conversation> {
		const result = await this.conversationService.getConversation(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get(':id/messages')
	async getMessages(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<Message[]> {
		const result = await this.conversationService.getMessages(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Post()
	async createConversation(
		@Body()
		body: {
			modelId: string;
			title?: string;
			templateId?: string;
			conversationMode?: 'free' | 'guided' | 'template';
			documentMode?: boolean;
			spaceId?: string;
		},
		@CurrentUser() user: CurrentUserData
	): Promise<Conversation> {
		const result = await this.conversationService.createConversation(user.userId, body.modelId, {
			title: body.title,
			templateId: body.templateId,
			conversationMode: body.conversationMode,
			documentMode: body.documentMode,
			spaceId: body.spaceId,
		});

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Post(':id/messages')
	async addMessage(
		@Param('id') id: string,
		@Body() body: { sender: 'user' | 'assistant' | 'system'; messageText: string },
		@CurrentUser() user: CurrentUserData
	): Promise<Message> {
		const result = await this.conversationService.addMessage(
			id,
			user.userId,
			body.sender,
			body.messageText
		);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Patch(':id/title')
	async updateTitle(
		@Param('id') id: string,
		@Body() body: { title: string },
		@CurrentUser() user: CurrentUserData
	): Promise<Conversation> {
		const result = await this.conversationService.updateTitle(id, user.userId, body.title);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Patch(':id/archive')
	async archiveConversation(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<Conversation> {
		const result = await this.conversationService.archiveConversation(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Patch(':id/unarchive')
	async unarchiveConversation(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<Conversation> {
		const result = await this.conversationService.unarchiveConversation(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Delete(':id')
	async deleteConversation(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<{ success: boolean }> {
		const result = await this.conversationService.deleteConversation(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return { success: true };
	}
}
