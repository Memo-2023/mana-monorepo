import {
  Controller,
  Put,
  Body,
  Param,
  Logger,
  Headers,
  Post,
} from '@nestjs/common';
import { SupabaseProvider } from '../supabase/supabase.provider';
import { RequestContextService } from '../common/services/request-context.service';

@Controller('test')
export class TestController {
  private readonly logger = new Logger(TestController.name);

  constructor(
    private readonly supabaseProvider: SupabaseProvider,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Put('character/:id')
  async testUpdate(
    @Param('id') id: string,
    @Body() updateData: any,
    @Headers('authorization') authHeader?: string,
  ) {
    this.logger.log('=== TEST UPDATE START ===');
    this.logger.log(`Character ID: ${id}`);
    this.logger.log(
      `Update data received: ${JSON.stringify(updateData, null, 2)}`,
    );
    this.logger.log(`Auth header present: ${!!authHeader}`);

    // Extract and set token if present
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      this.requestContextService.setToken(token);
      this.logger.log(`Token set in context: ${token.substring(0, 20)}...`);
    }

    try {
      const supabase = this.supabaseProvider.getClient();

      // Test 1: Can we read the character?
      const { data: readData, error: readError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single();

      if (readError) {
        this.logger.error('Read error:', readError);
        return { step: 'read', error: readError };
      }

      this.logger.log('Read successful:', readData);

      // Test 2: Try to update with minimal data
      const { data: updateResult, error: updateError } = await supabase
        .from('characters')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        this.logger.error(
          'Update error - Full object:',
          JSON.stringify(updateError, null, 2),
        );
        this.logger.error('Error type:', typeof updateError);
        this.logger.error('Error keys:', Object.keys(updateError));
        this.logger.error('Error message:', updateError.message);
        this.logger.error('Error code:', updateError.code);
        this.logger.error(
          'Error details:',
          JSON.stringify(updateError.details),
        );
        this.logger.error('Error hint:', updateError.hint);

        // Return full error details
        return {
          step: 'update',
          error: {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
            fullError: JSON.stringify(updateError),
          },
        };
      }

      this.logger.log('Update successful:', updateResult);
      return { success: true, data: updateResult };
    } catch (error: any) {
      this.logger.error('Caught exception:', error);
      this.logger.error('Exception type:', typeof error);
      this.logger.error('Exception constructor:', error?.constructor?.name);
      this.logger.error('Exception stack:', error?.stack);
      return { step: 'exception', error: String(error), stack: error?.stack };
    }
  }

  @Post('character/:id/full-update')
  async testFullUpdate(
    @Param('id') id: string,
    @Body() updateData: any,
    @Headers('authorization') authHeader?: string,
  ) {
    this.logger.log('=== FULL UPDATE TEST START ===');
    this.logger.log(`Character ID: ${id}`);
    this.logger.log(`Full update data: ${JSON.stringify(updateData, null, 2)}`);

    // Set token if present
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      this.requestContextService.setToken(token);
      this.logger.log(`Token set for full update`);
    }

    try {
      const supabase = this.supabaseProvider.getClient();

      // Map the fields properly
      const mappedData: any = {
        updated_at: new Date().toISOString(),
      };

      // Map all possible fields from frontend
      if (updateData.imageUrl) mappedData.image_url = updateData.imageUrl;
      if (updateData.image_url) mappedData.image_url = updateData.image_url;
      if (updateData.imagesData) mappedData.images_data = updateData.imagesData;
      if (updateData.images_data)
        mappedData.images_data = updateData.images_data;

      this.logger.log(
        `Mapped data for update: ${JSON.stringify(mappedData, null, 2)}`,
      );

      // Try the actual update
      const { data, error } = await supabase
        .from('characters')
        .update(mappedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error('Full update error - Complete details:');
        this.logger.error(JSON.stringify(error, null, 2));

        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            statusCode: (error as any).statusCode || (error as any).status_code,
            fullError: error,
          },
        };
      }

      this.logger.log('Full update successful');
      return { success: true, data };
    } catch (error: any) {
      this.logger.error('Full update exception:', error);
      this.logger.error('Exception details:', JSON.stringify(error, null, 2));

      return {
        success: false,
        exception: {
          message: error?.message || String(error),
          stack: error?.stack,
          name: error?.name,
          fullError: error,
        },
      };
    }
  }
}
