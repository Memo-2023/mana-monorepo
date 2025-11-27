import { DynamicModule, Module, Global, Provider } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import {
  ManaCoreModuleOptions,
  ManaCoreModuleAsyncOptions,
  ManaCoreOptionsFactory,
} from './interfaces/mana-core-options.interface';
import { AuthGuard } from './guards/auth.guard';
import { CreditClientService } from './services/credit-client.service';

export const MANA_CORE_OPTIONS = 'MANA_CORE_OPTIONS';

@Global()
@Module({})
export class ManaCoreModule {
  static forRoot(options: ManaCoreModuleOptions): DynamicModule {
    return {
      module: ManaCoreModule,
      imports: [HttpModule],
      providers: [
        {
          provide: MANA_CORE_OPTIONS,
          useValue: options,
        },
        AuthGuard,
        CreditClientService,
      ],
      exports: [MANA_CORE_OPTIONS, AuthGuard, CreditClientService],
    };
  }

  static forRootAsync(options: ManaCoreModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: ManaCoreModule,
      imports: [...(options.imports || []), HttpModule],
      providers: [...asyncProviders, AuthGuard, CreditClientService],
      exports: [MANA_CORE_OPTIONS, AuthGuard, CreditClientService],
    };
  }

  private static createAsyncProviders(
    options: ManaCoreModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: MANA_CORE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    const useClass = options.useClass;
    const useExisting = options.useExisting;

    if (useClass) {
      return [
        {
          provide: MANA_CORE_OPTIONS,
          useFactory: async (optionsFactory: ManaCoreOptionsFactory) =>
            await optionsFactory.createManaCoreOptions(),
          inject: [useClass],
        },
        {
          provide: useClass,
          useClass,
        },
      ];
    }

    if (useExisting) {
      return [
        {
          provide: MANA_CORE_OPTIONS,
          useFactory: async (optionsFactory: ManaCoreOptionsFactory) =>
            await optionsFactory.createManaCoreOptions(),
          inject: [useExisting],
        },
      ];
    }

    return [];
  }
}
