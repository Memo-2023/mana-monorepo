import { Test, TestingModule } from '@nestjs/testing';
import { CharacterController } from '../character.controller';
import { ImageSupabaseService } from '../../core/services/image-supabase.service';
import { PromptingService } from '../../core/services/prompting.service';
import { SupabaseJsonbAuthService } from '../../core/services/supabase-jsonb-auth.service';
import { AuthGuard, CreditClientService } from '@mana-core/nestjs-integration';

describe('CharacterController', () => {
	let controller: CharacterController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CharacterController],
			providers: [
				{
					provide: ImageSupabaseService,
					useValue: {
						generateImage: jest.fn(),
						saveUploadedImage: jest.fn(),
						analyzeImage: jest.fn(),
					},
				},
				{
					provide: PromptingService,
					useValue: {
						createCharacterDescriptionPrompt: jest.fn(),
						createAnimalCharacterDescriptionPrompt: jest.fn(),
						detectAnimalType: jest.fn(),
					},
				},
				{
					provide: SupabaseJsonbAuthService,
					useValue: {
						createCharacter: jest.fn(),
						getUserCharacters: jest.fn(),
						getCharacterById: jest.fn(),
						updateCharacter: jest.fn(),
						deleteCharacter: jest.fn(),
					},
				},
				{
					provide: CreditClientService,
					useValue: {
						validateCredits: jest
							.fn()
							.mockResolvedValue({ hasCredits: true, availableCredits: 100 }),
						consumeCredits: jest.fn().mockResolvedValue({}),
					},
				},
			],
		})
			.overrideGuard(AuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<CharacterController>(CharacterController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
