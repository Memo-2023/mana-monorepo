/**
 * Auth DTOs Index
 *
 * Re-exports all authentication-related DTOs
 */

// Core auth DTOs
export { RegisterDto } from './register.dto';
export { LoginDto } from './login.dto';
export { RefreshTokenDto } from './refresh-token.dto';

// B2B organization DTOs
export { RegisterB2BDto } from './register-b2b.dto';
export { InviteEmployeeDto } from './invite-employee.dto';
export { AcceptInvitationDto } from './accept-invitation.dto';
export { SetActiveOrganizationDto } from './set-active-organization.dto';
export { UpdateOrganizationDto } from './update-organization.dto';
export { UpdateMemberRoleDto } from './update-member-role.dto';

// Password management DTOs
export { ForgotPasswordDto } from './forgot-password.dto';
export { ResetPasswordDto } from './reset-password.dto';
export { ResendVerificationDto } from './resend-verification.dto';

// Profile management DTOs
export { UpdateProfileDto } from './update-profile.dto';
export { ChangePasswordDto } from './change-password.dto';
export { DeleteAccountDto } from './delete-account.dto';
