import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';

export interface RequestContext {
  requestId: string;
  token?: string;
  maerchenzauberToken?: string;
  userId?: string;
}

@Injectable()
export class RequestContextService {
  constructor(private readonly cls: ClsService) {}

  setContext(context: Partial<RequestContext>): void {
    const existingContext = this.getContext();
    this.cls.set('context', { ...existingContext, ...context });
  }

  getContext(): RequestContext {
    return this.cls.get('context') || { requestId: uuidv4() };
  }

  getToken(): string | undefined {
    return this.getContext().token;
  }

  setToken(token: string): void {
    this.setContext({ token });
  }

  getUserId(): string | undefined {
    return this.getContext().userId;
  }

  setUserId(userId: string): void {
    this.setContext({ userId });
  }

  getRequestId(): string {
    return this.getContext().requestId;
  }

  hasContext(): boolean {
    return this.cls.getId() !== undefined;
  }

  clearContext(): void {
    this.cls.set('context', { requestId: uuidv4() });
  }
}
