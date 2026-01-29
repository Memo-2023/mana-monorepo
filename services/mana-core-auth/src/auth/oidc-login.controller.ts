/**
 * OIDC Login Controller
 *
 * Provides a simple login page for OIDC authorization flows.
 * When users access the authorization endpoint without being logged in,
 * Better Auth redirects them here. After successful login, users are
 * redirected back to continue the authorization flow.
 */

import { Controller, Get, Post, Req, Res, Body, Query } from '@nestjs/common';
import { Request, Response } from 'express';
import { BetterAuthService } from './services/better-auth.service';

@Controller()
export class OidcLoginController {
	constructor(private readonly betterAuthService: BetterAuthService) {}

	/**
	 * GET /login - Display login page
	 *
	 * Shows a simple login form. OIDC parameters are preserved in the URL
	 * so they can be passed back to the authorization endpoint after login.
	 */
	@Get('login')
	async getLoginPage(@Query() query: Record<string, string>, @Res() res: Response) {
		const queryString = new URLSearchParams(query).toString();
		const returnUrl = queryString ? `/api/auth/oauth2/authorize?${queryString}` : '/';

		// Get client name for display
		const clientId = query.client_id || 'Unknown';
		const clientName = this.getClientDisplayName(clientId);

		const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - Mana Core</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 40px;
            width: 100%;
            max-width: 400px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #fff;
            font-size: 28px;
            font-weight: 600;
        }
        .logo p {
            color: rgba(255, 255, 255, 0.6);
            margin-top: 8px;
            font-size: 14px;
        }
        .client-info {
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
            text-align: center;
        }
        .client-info p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 13px;
        }
        .client-info strong {
            color: #818cf8;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 8px;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        input:focus {
            outline: none;
            border-color: #6366f1;
        }
        input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }
        button {
            width: 100%;
            padding: 14px;
            background: #6366f1;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover {
            background: #4f46e5;
        }
        button:disabled {
            background: #4b5563;
            cursor: not-allowed;
        }
        .error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            display: none;
        }
        .error.show {
            display: block;
        }
        .footer {
            text-align: center;
            margin-top: 24px;
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>Mana Core</h1>
            <p>Sign in to continue</p>
        </div>

        <div class="client-info">
            <p>Signing in to <strong>${clientName}</strong></p>
        </div>

        <div class="error" id="error"></div>

        <form id="loginForm">
            <input type="hidden" name="returnUrl" value="${returnUrl}">

            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" placeholder="you@example.com" required>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" placeholder="Enter your password" required>
            </div>

            <button type="submit" id="submitBtn">Sign In</button>
        </form>

        <div class="footer">
            <p>Secured by Mana Core Auth</p>
        </div>
    </div>

    <script>
        const form = document.getElementById('loginForm');
        const errorDiv = document.getElementById('error');
        const submitBtn = document.getElementById('submitBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const returnUrl = form.querySelector('[name="returnUrl"]').value;

            errorDiv.classList.remove('show');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';

            try {
                const response = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include',
                });

                const data = await response.json();

                if (response.ok && data.accessToken) {
                    // Login successful - redirect to authorization endpoint
                    // The oidc_login_prompt cookie will be used to continue the flow
                    window.location.href = returnUrl;
                } else {
                    throw new Error(data.message || 'Invalid email or password');
                }
            } catch (error) {
                errorDiv.textContent = error.message || 'An error occurred. Please try again.';
                errorDiv.classList.add('show');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });
    </script>
</body>
</html>
`;

		res.setHeader('Content-Type', 'text/html');
		return res.send(html);
	}

	/**
	 * Get display name for OIDC client
	 */
	private getClientDisplayName(clientId: string): string {
		const clientNames: Record<string, string> = {
			'matrix-synapse': 'Matrix Chat',
		};
		return clientNames[clientId] || clientId;
	}
}
