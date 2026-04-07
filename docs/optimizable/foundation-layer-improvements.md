# Foundation Layer - Verbesserungsvorschläge

> **Stand:** Dezember 2024
> **Betrifft:** Contacts, Todo, Calendar (Foundation Services)

## Aktuelle Architektur (Gut!)

Die drei Foundation Services sind korrekt als **separate Services mit eigenen Datenbanken** aufgesetzt:

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Contacts   │   │    Todo     │   │  Calendar   │
│   :3010     │   │   :3011     │   │   :3012     │
│             │   │             │   │             │
│ contacts DB │   │   todo DB   │   │ calendar DB │
└─────────────┘   └─────────────┘   └─────────────┘
```

**Warum das richtig ist:**
- Unabhängige Deployments
- Failure Isolation
- Unabhängige Skalierung
- Keine Schema-Konflikte zwischen Teams

---

## Verbesserungsvorschläge

### 1. Foundation Clients Package

**Aufwand:** Mittel | **Priorität:** Hoch

Einheitlicher API-Client für alle Consumer Apps (Chat, Picture, Clock, etc.).

**Neues Package:** `packages/foundation-clients/`

```typescript
// packages/foundation-clients/src/index.ts
export class FoundationClients {
  contacts: ContactsClient;
  todo: TodoClient;
  calendar: CalendarClient;

  constructor(config: FoundationConfig) {
    this.contacts = new ContactsClient(config);
    this.todo = new TodoClient(config);
    this.calendar = new CalendarClient(config);
  }
}

// packages/foundation-clients/src/contacts.client.ts
export class ContactsClient {
  private baseUrl: string;
  private cache: Map<string, CachedContact> = new Map();

  async get(id: string): Promise<Contact | null> {
    // Mit Caching
    const cached = this.cache.get(id);
    if (cached && !this.isStale(cached)) {
      return cached.data;
    }

    const response = await fetch(`${this.baseUrl}/contacts/${id}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });

    if (!response.ok) return null;
    const contact = await response.json();
    this.cache.set(id, { data: contact, fetchedAt: Date.now() });
    return contact;
  }

  async search(query: string): Promise<ContactSummary[]> {
    // Für Autocomplete in anderen Apps
  }

  async getBulk(ids: string[]): Promise<Contact[]> {
    // Effizient für Listen
  }
}
```

**Nutzung in Consumer Apps:**

```typescript
// apps/chat/apps/backend/src/chat.service.ts
import { FoundationClients } from '@mana/foundation-clients';

@Injectable()
export class ChatService {
  private foundation: FoundationClients;

  constructor(configService: ConfigService) {
    this.foundation = new FoundationClients({
      contactsUrl: configService.get('CONTACTS_API_URL'),
      todoUrl: configService.get('TODO_API_URL'),
      calendarUrl: configService.get('CALENDAR_API_URL'),
    });
  }

  async getMessageWithContact(messageId: string) {
    const message = await this.getMessage(messageId);
    const sender = await this.foundation.contacts.get(message.senderId);
    return { ...message, sender };
  }
}
```

---

### 2. Event Bus (Redis Pub/Sub)

**Aufwand:** Mittel | **Priorität:** Mittel

Ermöglicht reaktive Updates zwischen Services ohne Polling.

**Events definieren:**

```typescript
// packages/foundation-events/src/index.ts
export const FoundationEvents = {
  // Contacts
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
  CONTACT_DELETED: 'contact.deleted',

  // Todo
  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',

  // Calendar
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_DELETED: 'event.deleted',
} as const;

export interface TaskCompletedEvent {
  taskId: string;
  userId: string;
  completedAt: string;
  linkedCalendarEventId?: string;
}
```

**Publisher (Todo Service):**

```typescript
// apps/todo/apps/backend/src/task/task.service.ts
import { RedisService } from '@mana/shared-redis';
import { FoundationEvents } from '@mana/foundation-events';

@Injectable()
export class TaskService {
  constructor(private redis: RedisService) {}

  async completeTask(taskId: string, userId: string) {
    const task = await this.markCompleted(taskId);

    // Event publizieren
    await this.redis.publish(FoundationEvents.TASK_COMPLETED, {
      taskId: task.id,
      userId,
      completedAt: new Date().toISOString(),
      linkedCalendarEventId: task.metadata?.linkedCalendarEventId,
    });

    return task;
  }
}
```

**Subscriber (Calendar Service):**

```typescript
// apps/calendar/apps/backend/src/calendar.module.ts
import { FoundationEvents } from '@mana/foundation-events';

@Injectable()
export class CalendarEventSubscriber implements OnModuleInit {
  constructor(
    private redis: RedisService,
    private eventService: EventService
  ) {}

  onModuleInit() {
    this.redis.subscribe(FoundationEvents.TASK_COMPLETED, async (data) => {
      if (data.linkedCalendarEventId) {
        await this.eventService.markLinkedTaskCompleted(
          data.linkedCalendarEventId
        );
      }
    });
  }
}
```

**Use Cases:**

| Event | Reaktion |
|-------|----------|
| `task.completed` | Calendar markiert verknüpftes Event |
| `contact.updated` | Chat aktualisiert Sender-Anzeige |
| `event.deleted` | Todo entfernt `linkedCalendarEventId` |
| `contact.deleted` | Alle Apps entfernen Kontakt-Referenzen |

---

### 3. Bulk-Endpoints

**Aufwand:** Klein | **Priorität:** Hoch

Reduziert N+1 API-Calls bei Listen-Ansichten.

**Contacts Service:**

```typescript
// apps/contacts/apps/backend/src/contact/contact.controller.ts
@Controller('contacts')
export class ContactController {
  @Post('bulk')
  async getBulk(@Body() body: { ids: string[] }): Promise<Contact[]> {
    return this.contactService.findByIds(body.ids);
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('limit') limit = 10
  ): Promise<ContactSummary[]> {
    return this.contactService.search(query, limit);
  }
}
```

**Todo Service:**

```typescript
// apps/todo/apps/backend/src/task/task.controller.ts
@Controller('tasks')
export class TaskController {
  @Post('bulk')
  async getBulk(@Body() body: { ids: string[] }): Promise<Task[]> {
    return this.taskService.findByIds(body.ids);
  }

  @Get('by-contact/:contactId')
  async getByContact(@Param('contactId') contactId: string): Promise<Task[]> {
    // Tasks die mit einem Kontakt verknüpft sind
    return this.taskService.findByLinkedContact(contactId);
  }
}
```

**Calendar Service:**

```typescript
// apps/calendar/apps/backend/src/event/event.controller.ts
@Controller('events')
export class EventController {
  @Post('bulk')
  async getBulk(@Body() body: { ids: string[] }): Promise<Event[]> {
    return this.eventService.findByIds(body.ids);
  }

  @Get('by-attendee')
  async getByAttendee(@Query('email') email: string): Promise<Event[]> {
    return this.eventService.findByAttendeeEmail(email);
  }
}
```

---

### 4. Caching-Layer

**Aufwand:** Klein | **Priorität:** Mittel

Kontakte ändern sich selten - perfekt für Caching.

**In Foundation Clients (Client-Side Cache):**

```typescript
// packages/foundation-clients/src/cache.ts
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; expiresAt: number }>();
  private ttlMs: number;

  constructor(ttlSeconds = 300) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}
```

**Redis Cache (Server-Side):**

```typescript
// apps/contacts/apps/backend/src/contact/contact.service.ts
@Injectable()
export class ContactService {
  private readonly CACHE_TTL = 300; // 5 Minuten

  async findById(id: string): Promise<Contact | null> {
    // 1. Redis Cache prüfen
    const cached = await this.redis.get(`contact:${id}`);
    if (cached) return JSON.parse(cached);

    // 2. DB Query
    const contact = await this.db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);

    if (contact[0]) {
      // 3. In Cache speichern
      await this.redis.setex(
        `contact:${id}`,
        this.CACHE_TTL,
        JSON.stringify(contact[0])
      );
    }

    return contact[0] || null;
  }

  async update(id: string, data: UpdateContactDto): Promise<Contact> {
    const updated = await this.db
      .update(contacts)
      .set(data)
      .where(eq(contacts.id, id))
      .returning();

    // Cache invalidieren
    await this.redis.del(`contact:${id}`);

    return updated[0];
  }
}
```

---

## Implementierungs-Reihenfolge

| Phase | Task | Abhängigkeiten |
|-------|------|----------------|
| **1** | Bulk-Endpoints hinzufügen | Keine |
| **2** | Foundation Clients Package erstellen | Bulk-Endpoints |
| **3** | Client-Side Caching in Foundation Clients | Foundation Clients |
| **4** | Redis Cache in Services | Redis Setup |
| **5** | Event Bus Setup | Redis Setup |
| **6** | Event Publisher/Subscriber | Event Bus |

---

## Neue Package-Struktur

```
packages/
├── foundation-clients/           # NEU: API Clients
│   ├── src/
│   │   ├── contacts.client.ts
│   │   ├── todo.client.ts
│   │   ├── calendar.client.ts
│   │   ├── cache.ts
│   │   └── index.ts
│   └── package.json
│
├── foundation-events/            # NEU: Event Definitions
│   ├── src/
│   │   ├── contact.events.ts
│   │   ├── task.events.ts
│   │   ├── calendar.events.ts
│   │   └── index.ts
│   └── package.json
│
├── shared-types/                 # Existiert bereits
│   └── src/
│       ├── contact.ts            # ContactReference, ContactSummary
│       └── ...
│
└── shared-redis/                 # NEU oder erweitern
    └── src/
        ├── redis.service.ts
        ├── pub-sub.ts
        └── index.ts
```

---

## Offene Fragen

- [ ] Welche Consumer Apps werden als erste integriert?
- [ ] Redis bereits im Stack oder neu einführen?
- [ ] Cache TTL pro Entity-Typ oder einheitlich?
- [ ] Event Bus: Redis Pub/Sub vs. dediziertes System (Bull, etc.)?
