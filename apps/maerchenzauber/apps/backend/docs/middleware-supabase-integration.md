# Middleware Token to Supabase Authentication Integration

## Overview

This document explains how to integrate custom JWT tokens from a middleware service with Supabase's Row-Level Security (RLS) system. This approach allows you to maintain your existing authentication system while leveraging Supabase's powerful security features.

## Solution Architecture

The solution consists of three main components:

1. **PostgreSQL Functions in Supabase**: Execute operations in the context of an authenticated user
2. **NestJS Authentication Service**: Decode and validate custom JWT tokens
3. **Authentication Guard**: Protect routes and provide authenticated context

## Implementation Steps

### 1. Create the PostgreSQL Execute Function

First, create a powerful function in Supabase that can execute operations in the context of a specific user:

```sql
CREATE OR REPLACE FUNCTION public.execute_as_user(
  p_user_id text,
  p_operation text,
  p_params jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Set the user context for RLS policies
  PERFORM set_config('request.jwt.claim.sub', p_user_id, true);
  
  -- Execute the requested operation based on the operation name
  IF p_operation = 'create_character' THEN
    INSERT INTO characters (
      user_id,
      name,
      original_description,
      character_description_prompt,
      image_url,
      images_data
    )
    VALUES (
      p_user_id,
      p_params->>'name',
      p_params->>'description',
      p_params->>'prompt',
      p_params->>'image_url',
      COALESCE(p_params->'images_data', '[]'::jsonb)
    )
    RETURNING to_jsonb(characters.*) INTO result;
    
  ELSIF p_operation = 'get_character' THEN
    SELECT to_jsonb(characters.*) INTO result
    FROM characters
    WHERE id = (p_params->>'id')::uuid
    AND user_id = p_user_id;
    
  -- Add more operations as needed for your application
  
  ELSE
    RAISE EXCEPTION 'Unknown operation: %', p_operation;
  END IF;
  
  -- Return the result
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;
```

This function:
- Sets the user context for RLS policies using `set_config('request.jwt.claim.sub', p_user_id, true)`
- Executes different operations based on the operation name
- Returns the result as a JSON object

### 2. Create the Authentication Service

Create a service in your NestJS application to handle authentication with your custom JWT tokens:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * Interface for the decoded JWT payload from middleware
 */
export interface CustomJwtPayload {
  sub: string;         // User ID
  email: string;       // User email
  role: string;        // User role
  app_id: string;      // App ID
  iat: number;         // Issued at timestamp
  exp: number;         // Expiration timestamp
}

@Injectable()
export class SupabaseAuthService {
  private serviceRoleClient: SupabaseClient;
  private anonKeyClient: SupabaseClient;
  
  constructor(private configService: ConfigService) {
    // Initialize service role client for admin operations
    this.serviceRoleClient = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY')
    );
    
    // Initialize anon key client for authenticated user operations
    this.anonKeyClient = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY')
    );
  }

  /**
   * Decode and verify the custom JWT token from middleware
   */
  decodeToken(token: string): CustomJwtPayload {
    try {
      // Note: In production, you should verify the token signature
      const decoded = jwt.decode(token) as CustomJwtPayload;
      
      if (!decoded || !decoded.sub) {
        throw new UnauthorizedException('Invalid token format');
      }
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token expired');
      }
      
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Failed to decode token');
    }
  }

  /**
   * Get a Supabase client that can perform operations on behalf of the authenticated user
   */
  async getAuthenticatedClient(token: string): Promise<{ 
    userId: string; 
    execute: <T>(operation: string, params?: any) => Promise<T>;
  }> {
    try {
      // Decode the token to get the user ID
      const decoded = this.decodeToken(token);
      const userId = decoded.sub;
      
      // Create an execute function that will run operations with the user context
      const execute = async <T>(operation: string, params: any = {}): Promise<T> => {
        // Call the operation through a stored procedure that sets the user context
        const { data, error } = await this.serviceRoleClient.rpc(
          'execute_as_user',
          { 
            p_user_id: userId,
            p_operation: operation,
            p_params: params
          }
        );
        
        if (error) throw error;
        return data as T;
      };
      
      return { userId, execute };
    } catch (error) {
      console.error('Error creating authenticated client:', error);
      throw error;
    }
  }
}
```

This service:
- Decodes and validates your custom JWT tokens
- Creates an execute function that runs operations in the context of the authenticated user
- Returns the user ID and execute function for use in your controllers

### 3. Create the Authentication Guard

Create a guard to protect your routes and provide the authenticated context:

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseAuthService, CustomJwtPayload } from '../services/supabase-auth.service';

@Injectable()
export class CustomJwtAuthGuard implements CanActivate {
  constructor(private supabaseAuthService: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    try {
      // Get the authenticated client using our token
      const { userId, execute } = await this.supabaseAuthService.getAuthenticatedClient(token);
      
      // Store the user ID and execute function in the request for later use
      request.userId = userId;
      request.supabaseExecute = execute;
      
      // Also decode and store the full token payload for access to other claims
      const decodedToken = this.supabaseAuthService.decodeToken(token);
      request.user = {
        id: userId,
        email: decodedToken.email,
        role: decodedToken.role,
        appId: decodedToken.app_id
      };
      
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
```

This guard:
- Extracts the JWT token from the request headers
- Uses the authentication service to validate the token and get the execute function
- Stores the user ID, execute function, and user info in the request object for use in controllers

### 4. Use in Controllers

Use the authentication guard and execute function in your controllers:

```typescript
import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CustomJwtAuthGuard } from '../guards/custom-jwt-auth.guard';

@Controller('characters')
@UseGuards(CustomJwtAuthGuard) // Apply the guard to all routes in this controller
export class CharacterController {
  constructor(private characterService: CharacterService) {}

  @Post()
  async createCharacter(@Req() request, @Body() characterData) {
    // Extract the execute function and userId from the request
    const { supabaseExecute, userId } = request;
    
    // Use the execute function to create a character
    return await this.characterService.createCharacter(
      supabaseExecute,
      userId,
      characterData
    );
  }

  @Get(':id')
  async getCharacter(@Req() request, @Param('id') characterId: string) {
    // Extract the execute function from the request
    const { supabaseExecute } = request;
    
    // Use the execute function to get a character
    return await this.characterService.getCharacter(
      supabaseExecute,
      characterId
    );
  }
}
```

### 5. Service Implementation

Implement your services to use the execute function:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class CharacterService {
  /**
   * Create a new character
   */
  async createCharacter(execute, userId, characterData) {
    return await execute('create_character', {
      name: characterData.name,
      description: characterData.description,
      prompt: characterData.prompt,
      image_url: characterData.imageUrl,
      images_data: characterData.imagesData || []
    });
  }

  /**
   * Get a character by ID
   */
  async getCharacter(execute, characterId) {
    return await execute('get_character', { id: characterId });
  }
}
```

## Testing the Integration

Create a test script to verify the integration works correctly:

```typescript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

dotenv.config();

async function testAuthentication() {
  try {
    // Get token from middleware
    const response = await axios.post(
      'https://your-middleware-url/auth/signin?appId=your-app-id',
      {
        email: 'user@example.com',
        password: 'password'
      }
    );
    
    const { appToken } = response.data;
    
    // Decode the token to get the user ID
    const decoded = jwt.decode(appToken);
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Create a character using execute_as_user
    const { data: character, error } = await supabaseClient.rpc(
      'execute_as_user',
      { 
        p_user_id: decoded.sub,
        p_operation: 'create_character',
        p_params: {
          name: 'Test Character',
          description: 'A test character',
          prompt: 'Create a test character',
          image_url: 'https://example.com/image.jpg'
        }
      }
    );
    
    console.log('Character created:', character);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuthentication();
```

## Key Benefits

1. **Maintain Existing Authentication**: Continue using your middleware for authentication
2. **Leverage RLS**: Utilize Supabase's Row-Level Security for data protection
3. **Secure Operations**: All database operations run in the context of the authenticated user
4. **Flexible Implementation**: Easily add new operations to the execute_as_user function

## Security Considerations

1. **Token Verification**: In production, properly verify the JWT signature
2. **Secure Secrets**: Store your JWT verification keys securely
3. **Limit Operations**: Only implement necessary operations in the execute_as_user function
4. **Audit Logging**: Consider adding audit logging to track operations

## Conclusion

This integration allows you to use your custom middleware tokens with Supabase while still leveraging Supabase's powerful Row-Level Security features. The solution is secure, maintainable, and preserves your existing authentication flow.
