// Module
export { ManaCoreModule, MANA_CORE_OPTIONS } from './mana-core.module';

// Interfaces
export {
	ManaCoreModuleOptions,
	ManaCoreModuleAsyncOptions,
	ManaCoreOptionsFactory,
} from './interfaces/mana-core-options.interface';

// Guards
export { AuthGuard } from './guards/auth.guard';
export { OptionalAuthGuard } from './guards/optional-auth.guard';

// Decorators
export { CurrentUser, JwtPayload } from './decorators/current-user.decorator';
export { Public, IS_PUBLIC_KEY } from './decorators/public.decorator';

// Services
export {
	CreditClientService,
	CreditValidationResult,
	CreditBalance,
} from './services/credit-client.service';

// Exceptions
export {
	InsufficientCreditsException,
	InsufficientCreditsDetails,
} from './exceptions/insufficient-credits.exception';
