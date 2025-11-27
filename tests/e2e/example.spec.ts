import { test, expect } from '@playwright/test';

/**
 * Example E2E test suite
 * Copy this file for each web application and customize the tests
 */

test.describe('Homepage', () => {
	test('should load successfully', async ({ page }) => {
		await page.goto('/');

		// Wait for page to be fully loaded
		await page.waitForLoadState('networkidle');

		// Check that the page has a title
		await expect(page).toHaveTitle(/.+/);
	});

	test('should have working navigation', async ({ page }) => {
		await page.goto('/');

		// Example: check if navigation links exist
		const navLinks = page.locator('nav a');
		await expect(navLinks.first()).toBeVisible();
	});
});

test.describe('Authentication', () => {
	test.skip('should allow user to sign in', async ({ page }) => {
		await page.goto('/login');

		// Fill in login form
		await page.fill('input[type="email"]', 'test@example.com');
		await page.fill('input[type="password"]', 'testpassword123');

		// Submit form
		await page.click('button[type="submit"]');

		// Wait for navigation
		await page.waitForURL('**/dashboard');

		// Verify successful login
		await expect(page).toHaveURL(/.*dashboard/);
	});

	test.skip('should show error for invalid credentials', async ({ page }) => {
		await page.goto('/login');

		await page.fill('input[type="email"]', 'invalid@example.com');
		await page.fill('input[type="password"]', 'wrongpassword');
		await page.click('button[type="submit"]');

		// Check for error message
		const errorMessage = page.locator('.error-message');
		await expect(errorMessage).toBeVisible();
	});
});

test.describe('Responsive Design', () => {
	test('should be mobile-friendly', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		await page.goto('/');

		// Check mobile menu or responsive elements
		const mobileMenu = page.locator('[aria-label="mobile menu"]');
		// This is just an example - customize based on your app
		await expect(page.locator('body')).toBeVisible();
	});
});
