import fs from 'fs';

// Read the markdown file
const content = fs.readFileSync('docs/mail/email-templates-bilingual.md', 'utf8');

// Extract templates
const templates = {};

// Find verification template
const verificationMatch = content.match(/## 1\. E-Mail-Verifizierung.*?```html\n([\s\S]*?)```/);
if (verificationMatch) {
	templates.verification = verificationMatch[1].trim();
}

// Find password reset template
const passwordMatch = content.match(/## 2\. Passwort-Reset.*?```html\n([\s\S]*?)```/);
if (passwordMatch) {
	templates.passwordReset = passwordMatch[1].trim();
}

// Find email change template
const emailChangeMatch = content.match(/## 3\. E-Mail-Änderung.*?```html\n([\s\S]*?)```/);
if (emailChangeMatch) {
	templates.emailChange = emailChangeMatch[1].trim();
}

// Find OTP template
const otpMatch = content.match(/## 4\. OTP.*?```html\n([\s\S]*?)```/);
if (otpMatch) {
	templates.otp = otpMatch[1].trim();
}

// Find login alert template
const loginAlertMatch = content.match(/## 5\. Login-Alert.*?```html\n([\s\S]*?)```/);
if (loginAlertMatch) {
	templates.loginAlert = loginAlertMatch[1].trim();
}

// Save to JSON file
fs.writeFileSync('email-templates.json', JSON.stringify(templates, null, 2));
console.log('Templates extracted to email-templates.json');
