# Memoro Service - Detailed Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Module Deep Dive](#module-deep-dive)
5. [API Reference](#api-reference)
6. [Data Models](#data-models)
7. [Service Integrations](#service-integrations)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Performance](#performance)
11. [Security](#security)
12. [Deployment](#deployment)
13. [Monitoring & Logging](#monitoring--logging)
14. [Troubleshooting](#troubleshooting)

## Project Overview

### Purpose
Memoro Service is a specialized microservice that handles all Memoro-specific functionality in the Mana ecosystem. It serves as the primary backend for the Memoro mobile and web applications, orchestrating audio processing, AI operations, and collaborative features.

### Tech Stack
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18.x
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: npm

### Key Dependencies
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/platform-express": "^10.0.0",
  "@supabase/supabase-js": "^2.39.0",
  "axios": "^1.6.0",
  "class-validator": "^0.14.0",
  "rxjs": "^7.8.1"
}
```

## Architecture

### Service Architecture Diagram
```
┌─────────────────────────────────────────────────┐
│                Memoro Service                   │
├─────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │Auth Proxy │  │  Credits   │  │  Memoro   │  │
│  │  Module   │  │   Module   │  │  Module   │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  │
│        │              │              │         │
│  ┌─────▼──────────────▼──────────────▼─────┐  │
│  │          Common Services Layer           │  │
│  │  - Guards  - Decorators  - Filters      │  │
│  └───────────────────┬──────────────────────┘  │
│                      │                         │
│  ┌───────────────────▼──────────────────────┐  │
│  │         External Service Clients         │  │
│  │  - Mana Core  - Audio Micro  - Supabase │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Request Flow
```typescript
// Typical request flow through the service
Request → Guards → Interceptors → Controller → Service → Repository → External Services
                                      ↓
Response ← Filters ← Interceptors ← Response
```

## Installation & Setup

### Prerequisites
```bash
# Required software
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (optional, for containerized deployment)
```

### Local Development Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd memoro-service

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Run database migrations (if any)
npm run migrate

# 5. Start development server
npm run start:dev
```

### Environment Configuration
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Service URLs
MANA_SERVICE_URL=http://localhost:3000
AUDIO_MICROSERVICE_URL=https://audio-microservice.run.app

# Supabase Configuration
MEMORO_SUPABASE_URL=https://your-project.supabase.co
MEMORO_SUPABASE_ANON_KEY=your-anon-key
MEMORO_SUPABASE_SERVICE_KEY=your-service-key

# Application Configuration
MEMORO_APP_ID=973da0c1-b479-4dac-a1b0-ed09c72caca8

# Feature Flags
ENABLE_BATCH_TRANSCRIPTION=true
ENABLE_SPEAKER_DIARIZATION=true
MAX_AUDIO_DURATION_MINUTES=180

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

## Module Deep Dive

### 1. Auth Proxy Module

#### Purpose
Routes authentication requests through Memoro Service to hide backend complexity.

#### Structure
```
auth-proxy/
├── auth-proxy.controller.ts
├── auth-proxy.service.ts
├── auth-proxy.module.ts
└── dto/
    ├── signin.dto.ts
    ├── signup.dto.ts
    └── refresh.dto.ts
```

#### Implementation Details
```typescript
@Controller('auth')
export class AuthProxyController {
  constructor(
    private readonly authProxyService: AuthProxyService,
  ) {}

  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    // Adds appId automatically
    const appId = process.env.MEMORO_APP_ID;
    return this.authProxyService.forwardRequest(
      '/auth/signin',
      { ...signInDto },
      { appId }
    );
  }

  @Post('refresh')
  @UseGuards(OptionalAuthGuard)
  async refresh(
    @Body() refreshDto: RefreshDto,
    @Headers('authorization') auth?: string
  ) {
    return this.authProxyService.forwardRequest(
      '/auth/refresh',
      refreshDto,
      { appId: process.env.MEMORO_APP_ID },
      auth
    );
  }
}
```

### 2. Credits Module

#### Credit Calculation Service
```typescript
@Injectable()
export class CreditConsumptionService {
  private readonly PRICING = {
    TRANSCRIPTION_PER_MINUTE: 2,
    TRANSCRIPTION_MINIMUM: 10,
    QUESTION_PROCESSING: 5,
    MEMO_COMBINATION: 5,
    HEADLINE_GENERATION: 10,
    MEMORY_CREATION: 10,
    BLUEPRINT_PROCESSING: 5,
  };

  calculateTranscriptionCost(durationSeconds: number): number {
    const minutes = Math.ceil(durationSeconds / 60);
    const cost = minutes * this.PRICING.TRANSCRIPTION_PER_MINUTE;
    return Math.max(cost, this.PRICING.TRANSCRIPTION_MINIMUM);
  }

  async validateAndConsume(
    userId: string,
    amount: number,
    operation: string
  ): Promise<void> {
    // Check balance
    const balance = await this.creditClient.getBalance(userId);
    if (balance < amount) {
      throw new InsufficientCreditsError(amount, balance, operation);
    }

    // Consume credits
    await this.creditClient.consumeCredits(userId, amount, operation);
  }
}
```

### 3. Memoro Module

#### Audio Processing Service
```typescript
@Injectable()
export class MemoroService {
  async processUploadedAudio(
    userId: string,
    filePath: string,
    duration: number,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    // 1. Validate credits
    const cost = this.creditService.calculateTranscriptionCost(duration);
    await this.creditService.validateCredits(userId, cost);

    // 2. Create memo record
    const memo = await this.createMemoFromUploadedFile(
      userId,
      filePath,
      options.metadata
    );

    // 3. Route to appropriate processing path
    if (duration < 115 * 60) { // Less than 115 minutes
      return this.processFastTranscription(memo, filePath, options);
    } else {
      return this.processBatchTranscription(memo, filePath, options);
    }
  }

  private async processFastTranscription(
    memo: Memo,
    filePath: string,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    try {
      // Attempt fast transcription
      const result = await this.edgeFunctionClient.transcribe({
        audioPath: filePath,
        languages: options.languages,
        enableDiarization: true,
        maxSpeakers: 2
      });

      // Update memo with results
      await this.updateMemoWithTranscript(memo.id, result);
      
      return { memo, status: 'completed', route: 'fast_transcribe' };
    } catch (error) {
      if (this.isFormatError(error)) {
        // Attempt format conversion
        return this.processWithConversion(memo, filePath, options);
      }
      throw error;
    }
  }

  private async processBatchTranscription(
    memo: Memo,
    filePath: string,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    // Submit to batch processing
    const jobId = await this.audioMicroservice.submitBatchJob({
      audioPath: filePath,
      memoId: memo.id,
      languages: options.languages,
      enableDiarization: true,
      maxSpeakers: 10
    });

    // Store job ID for recovery
    await this.updateMemoMetadata(memo.id, {
      processing: {
        transcription: {
          status: 'processing',
          jobId: jobId,
          startedAt: new Date().toISOString()
        }
      }
    });

    return { memo, status: 'processing', route: 'batch_transcribe' };
  }
}
```

## API Reference

### Authentication Endpoints

#### POST /auth/signin
```typescript
// Request
{
  "email": "user@example.com",
  "password": "secure-password"
}

// Response
{
  "manaToken": "eyJhbGc...",
  "appToken": "eyJhbGc...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "credits": 1500
  }
}
```

#### POST /auth/refresh
```typescript
// Request
{
  "refreshToken": "current_refresh_token"
}

// Response
{
  "appToken": "new_app_token",
  "refreshToken": "new_refresh_token"
}
```

### Audio Processing Endpoints

#### POST /memoro/process-uploaded-audio
```typescript
// Request
{
  "filePath": "audio/2024/01/recording.m4a",
  "duration": 3600, // seconds
  "metadata": {
    "recordingStartedAt": "2024-01-15T10:00:00Z",
    "location": { "lat": 52.52, "lng": 13.405 }
  },
  "recordingLanguages": ["en-US", "de-DE"],
  "enableDiarization": true
}

// Response
{
  "memo": {
    "id": "memo-uuid",
    "title": "Processing...",
    "source": {
      "audio_path": "audio/2024/01/recording.m4a",
      "duration": 3600
    },
    "metadata": {
      "processing": {
        "transcription": { "status": "processing" }
      },
      "recordingStartedAt": "2024-01-15T10:00:00Z"
    }
  },
  "processingRoute": "batch_transcribe"
}
```

#### POST /memoro/append-transcription
```typescript
// Request
{
  "memoId": "existing-memo-id",
  "filePath": "audio/additional.m4a",
  "duration": 300,
  "recordingIndex": 0 // Optional: update specific recording
}

// Response
{
  "success": true,
  "additionalRecording": {
    "index": 0,
    "path": "audio/additional.m4a",
    "status": "processing"
  }
}
```

## Data Models

### Memo Model
```typescript
interface Memo {
  id: string;
  user_id: string;
  title?: string;
  source: {
    audio_path: string;
    duration: number;
    transcript?: string;
    primary_language?: string;
    languages?: string[];
    utterances?: Utterance[];
    speakers?: SpeakerMap;
    speakerMap?: GroupedUtterances;
    additional_recordings?: AdditionalRecording[];
  };
  metadata: {
    processing?: ProcessingStatus;
    recordingStartedAt?: string;
    location?: Location;
    stats?: MemoStats;
  };
  created_at: string;
  updated_at: string;
}

interface ProcessingStatus {
  transcription?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    jobId?: string;
    attempts?: number;
  };
  headline_and_intro?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
  };
  blueprint?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    blueprintId?: string;
  };
}
```

### Speaker Data Models
```typescript
interface Utterance {
  speaker: string;
  text: string;
  offset: number;
  duration: number;
  words?: Word[];
}

interface Word {
  text: string;
  offset: number;
  duration: number;
  confidence?: number;
}

interface SpeakerMap {
  [speakerId: string]: {
    name: string;
    label?: string;
  };
}

interface GroupedUtterances {
  [speakerId: string]: Utterance[];
}
```

## Service Integrations

### Mana Core Middleware Integration
```typescript
class ManaClientService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.MANA_SERVICE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async getUserCredits(token: string): Promise<CreditBalance> {
    const response = await this.client.get('/users/credits', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async consumeCredits(
    token: string,
    amount: number,
    description: string
  ): Promise<void> {
    await this.client.post(
      '/users/credits/consume',
      { amount, description },
      { headers: { Authorization: `Bearer ${token}` }}
    );
  }
}
```

### Audio Microservice Integration
```typescript
class AudioMicroserviceClient {
  async submitBatchTranscription(params: BatchParams): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/audio/transcribe-from-storage`,
      {
        filePath: params.filePath,
        memoId: params.memoId,
        languages: params.languages,
        diarization: {
          enabled: true,
          maxSpeakers: params.maxSpeakers || 10
        }
      }
    );
    return response.data.jobId;
  }

  async convertAndTranscribe(params: ConvertParams): Promise<TranscriptResult> {
    const response = await axios.post(
      `${this.baseUrl}/audio/convert-and-transcribe-from-storage`,
      params
    );
    return response.data;
  }
}
```

### Supabase Integration
```typescript
class SupabaseService {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.MEMORO_SUPABASE_URL,
      process.env.MEMORO_SUPABASE_SERVICE_KEY
    );
  }

  async createMemo(data: Partial<Memo>): Promise<Memo> {
    const { data: memo, error } = await this.client
      .from('memos')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return memo;
  }

  async updateMemo(id: string, updates: Partial<Memo>): Promise<Memo> {
    const { data: memo, error } = await this.client
      .from('memos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return memo;
  }

  subscribeToMemoUpdates(memoId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`memo:${memoId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'memos', filter: `id=eq.${memoId}` },
        callback
      )
      .subscribe();
  }
}
```

## Error Handling

### Custom Error Classes
```typescript
export class InsufficientCreditsError extends HttpException {
  constructor(
    public readonly required: number,
    public readonly available: number,
    public readonly operation: string
  ) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'InsufficientCredits',
        message: `Insufficient credits for ${operation}`,
        details: {
          required,
          available,
          operation
        }
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class AudioFormatError extends HttpException {
  constructor(filePath: string, format: string) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'AudioFormatError',
        message: 'Unsupported audio format',
        details: { filePath, format }
      },
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }
}
```

### Global Exception Filter
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || 'Internal server error',
      ...(exception instanceof HttpException ? exception.getResponse() as object : {})
    };

    // Log error
    Logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
      'GlobalExceptionFilter'
    );

    response.status(status).json(errorResponse);
  }
}
```

## Testing

### Unit Testing
```typescript
// memoro.service.spec.ts
describe('MemoroService', () => {
  let service: MemoroService;
  let creditService: jest.Mocked<CreditConsumptionService>;
  let supabaseService: jest.Mocked<SupabaseService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MemoroService,
        {
          provide: CreditConsumptionService,
          useValue: createMock<CreditConsumptionService>()
        },
        {
          provide: SupabaseService,
          useValue: createMock<SupabaseService>()
        }
      ]
    }).compile();

    service = module.get<MemoroService>(MemoroService);
    creditService = module.get(CreditConsumptionService);
    supabaseService = module.get(SupabaseService);
  });

  describe('processUploadedAudio', () => {
    it('should route short audio to fast transcription', async () => {
      const duration = 60 * 30; // 30 minutes
      creditService.calculateTranscriptionCost.mockReturnValue(60);
      creditService.validateCredits.mockResolvedValue(undefined);
      
      const result = await service.processUploadedAudio(
        'user-id',
        'audio/file.m4a',
        duration,
        { languages: ['en-US'] }
      );

      expect(result.processingRoute).toBe('fast_transcribe');
    });

    it('should route long audio to batch processing', async () => {
      const duration = 60 * 120; // 120 minutes
      
      const result = await service.processUploadedAudio(
        'user-id',
        'audio/file.m4a',
        duration,
        { languages: ['en-US'] }
      );

      expect(result.processingRoute).toBe('batch_transcribe');
    });
  });
});
```

### Integration Testing
```typescript
// test/integration/audio-processing.e2e-spec.ts
describe('Audio Processing E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /memoro/process-uploaded-audio', async () => {
    const response = await request(app.getHttpServer())
      .post('/memoro/process-uploaded-audio')
      .set('Authorization', 'Bearer valid-token')
      .send({
        filePath: 'test/audio.m4a',
        duration: 300,
        recordingLanguages: ['en-US']
      })
      .expect(201);

    expect(response.body).toHaveProperty('memo');
    expect(response.body.memo).toHaveProperty('id');
    expect(response.body.processingRoute).toBeDefined();
  });
});
```

### Load Testing
```javascript
// k6-load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${__ENV.TEST_TOKEN}'
    },
  };

  const payload = JSON.stringify({
    filePath: 'test/audio.m4a',
    duration: 300,
  });

  const res = http.post(
    'http://localhost:3001/memoro/process-uploaded-audio',
    payload,
    params
  );

  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Performance

### Optimization Strategies

#### 1. Connection Pooling
```typescript
// Database connection pooling
const supabaseClient = createClient(url, key, {
  db: {
    poolSize: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  }
});
```

#### 2. Caching
```typescript
@Injectable()
export class CacheService {
  private cache = new Map<string, CacheEntry>();

  async get<T>(key: string, factory: () => Promise<T>, ttl = 30000): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.value as T;
    }

    const value = await factory();
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });

    return value;
  }
}
```

#### 3. Request Batching
```typescript
class BatchProcessor {
  private queue: Request[] = [];
  private timer: NodeJS.Timeout;

  add(request: Request): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...request, resolve, reject });
      
      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), 100);
      }
    });
  }

  private async flush() {
    const batch = this.queue.splice(0);
    const results = await this.processBatch(batch);
    
    batch.forEach((req, i) => {
      req.resolve(results[i]);
    });
    
    this.timer = null;
  }
}
```

### Performance Metrics

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| API Response Time (p50) | < 100ms | 85ms | ✅ |
| API Response Time (p95) | < 500ms | 420ms | ✅ |
| API Response Time (p99) | < 1000ms | 890ms | ✅ |
| Transcription Start Time | < 5s | 3.2s | ✅ |
| Credit Check Time | < 50ms | 35ms | ✅ |
| Database Query Time | < 100ms | 75ms | ✅ |
| Memory Usage | < 1GB | 650MB | ✅ |
| CPU Usage (avg) | < 70% | 45% | ✅ |

## Security

### Authentication & Authorization

#### JWT Validation
```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.validateToken(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (!auth) return null;

    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
```

#### Service Authentication
```typescript
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const serviceKey = request.headers['x-service-key'];

    if (!serviceKey) {
      throw new UnauthorizedException('Service key required');
    }

    // Validate service key
    const validKeys = [
      process.env.MANA_SERVICE_KEY,
      process.env.AUDIO_SERVICE_KEY,
    ];

    if (!validKeys.includes(serviceKey)) {
      throw new UnauthorizedException('Invalid service key');
    }

    return true;
  }
}
```

### Input Validation
```typescript
// DTOs with validation
export class ProcessAudioDto {
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsNumber()
  @Min(1)
  @Max(10800) // 3 hours max
  duration: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  recordingLanguages: string[];

  @IsBoolean()
  @IsOptional()
  enableDiarization?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
```

### Security Headers
```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

## Deployment

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

EXPOSE 3001

CMD ["node", "dist/main"]
```

### Cloud Run Deployment
```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/memoro-service:$COMMIT_SHA', '.']

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/memoro-service:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'memoro-service'
      - '--image=gcr.io/$PROJECT_ID/memoro-service:$COMMIT_SHA'
      - '--region=europe-west3'
      - '--platform=managed'
      - '--memory=1Gi'
      - '--cpu=1'
      - '--min-instances=1'
      - '--max-instances=10'
      - '--set-env-vars-from-file=.env.prod'
```

### Environment Management
```bash
# Production deployment
gcloud run deploy memoro-service \
  --image gcr.io/PROJECT/memoro-service:latest \
  --region europe-west3 \
  --set-env-vars="NODE_ENV=production,LOG_LEVEL=info"

# Staging deployment  
gcloud run deploy memoro-service-staging \
  --image gcr.io/PROJECT/memoro-service:staging \
  --region europe-west3 \
  --set-env-vars="NODE_ENV=staging,LOG_LEVEL=debug"
```

## Monitoring & Logging

### Structured Logging
```typescript
@Injectable()
export class LoggerService {
  private logger = new Logger('MemoroService');

  log(message: string, context?: any) {
    this.logger.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...context
    });
  }

  error(message: string, error: Error, context?: any) {
    this.logger.error({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...context
    });
  }
}
```

### Metrics Collection
```typescript
@Injectable()
export class MetricsService {
  private metrics = {
    requestCount: 0,
    errorCount: 0,
    creditUsage: 0,
    processingTime: []
  };

  recordRequest(endpoint: string, duration: number, status: number) {
    this.metrics.requestCount++;
    
    if (status >= 400) {
      this.metrics.errorCount++;
    }

    this.metrics.processingTime.push({
      endpoint,
      duration,
      timestamp: Date.now()
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      avgProcessingTime: this.calculateAverage(this.metrics.processingTime),
      errorRate: this.metrics.errorCount / this.metrics.requestCount
    };
  }
}
```

### Health Checks
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.http.pingCheck('mana-core', process.env.MANA_SERVICE_URL),
      () => this.checkDiskSpace(),
      () => this.checkMemoryUsage(),
    ]);
  }

  private checkMemoryUsage() {
    const used = process.memoryUsage();
    const limit = 1024 * 1024 * 1024; // 1GB

    return {
      memory: {
        status: used.heapUsed < limit ? 'up' : 'down',
        used: Math.round(used.heapUsed / 1024 / 1024),
        limit: limit / 1024 / 1024
      }
    };
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Authentication Failures
```bash
# Check JWT token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/auth/validate

# Common causes:
- Token expired (check exp claim)
- Wrong app_id in token
- Service key not configured
```

#### 2. Credit Insufficient Errors
```typescript
// Debug credit issues
async debugCredits(userId: string) {
  const balance = await this.creditService.getBalance(userId);
  const pendingOps = await this.getPendingOperations(userId);
  
  console.log({
    currentBalance: balance,
    pendingConsumption: pendingOps.reduce((sum, op) => sum + op.cost, 0),
    availableCredits: balance - pendingConsumption
  });
}
```

#### 3. Transcription Failures
```bash
# Check audio format
ffprobe audio/file.m4a

# Common issues:
- Unsupported codec (use AAC)
- File too large (>180 minutes)
- Corrupted audio file
- Network timeout for large files
```

#### 4. Real-time Updates Not Working
```typescript
// Debug Supabase subscriptions
const channel = supabase.channel('debug')
  .on('*', (payload) => console.log('Event:', payload))
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });

// Common issues:
- JWT not passed to Supabase client
- RLS policies blocking access
- WebSocket connection issues
```

### Debug Mode
```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  app.useLogger(['debug', 'error', 'warn', 'log', 'verbose']);
  
  // Log all requests
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`, {
      headers: req.headers,
      body: req.body
    });
    next();
  });
}
```

### Performance Profiling
```typescript
// CPU profiling
import * as v8Profiler from 'v8-profiler-next';

export class ProfilingService {
  startProfiling(title: string) {
    v8Profiler.startProfiling(title, true);
  }

  stopProfiling(title: string) {
    const profile = v8Profiler.stopProfiling(title);
    profile.export((error, result) => {
      fs.writeFileSync(`${title}.cpuprofile`, result);
      profile.delete();
    });
  }
}
```

## Appendices

### A. Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Service port | 3001 | No |
| NODE_ENV | Environment | development | No |
| MANA_SERVICE_URL | Mana Core URL | - | Yes |
| AUDIO_MICROSERVICE_URL | Audio service URL | - | Yes |
| MEMORO_SUPABASE_URL | Supabase URL | - | Yes |
| MEMORO_SUPABASE_ANON_KEY | Anon key | - | Yes |
| MEMORO_SUPABASE_SERVICE_KEY | Service key | - | Yes |
| MEMORO_APP_ID | App identifier | - | Yes |
| LOG_LEVEL | Logging level | info | No |
| ENABLE_BATCH_TRANSCRIPTION | Feature flag | true | No |

### B. Error Codes Reference

| Code | Description | HTTP Status |
|------|-------------|-------------|
| AUTH001 | Invalid token | 401 |
| AUTH002 | Token expired | 401 |
| AUTH003 | Insufficient permissions | 403 |
| CREDIT001 | Insufficient credits | 402 |
| CREDIT002 | Credit check failed | 500 |
| AUDIO001 | Invalid audio format | 422 |
| AUDIO002 | Audio too long | 413 |
| AUDIO003 | Transcription failed | 500 |
| SPACE001 | Space not found | 404 |
| SPACE002 | Not space member | 403 |

### C. API Rate Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| /auth/* | 10 req | 1 min |
| /memoro/process-uploaded-audio | 5 req | 1 min |
| /memoro/question-memo | 10 req | 1 min |
| /memoro/spaces/* | 30 req | 1 min |
| Default | 100 req | 1 min |