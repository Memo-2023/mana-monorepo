// Compatibility layer: Paraglide-style API using svelte-i18n
// This allows existing code using m.key() to work with svelte-i18n
import { _, locale } from 'svelte-i18n';
import { get } from 'svelte/store';
import '$lib/i18n'; // Initialize i18n

// Create a Proxy that returns translation functions for any key
const messageProxy = new Proxy(
	{},
	{
		get(_target, prop: string) {
			// Return a function that gets the translation
			return () => {
				const translate = get(_);
				return translate(prop);
			};
		}
	}
) as Record<string, () => string>;

// Export everything from the proxy
export const {
	// Navigation
	nav_login,
	nav_register,
	nav_dashboard,
	nav_folders,
	nav_profile,
	nav_logout,
	nav_pricing,

	// Home
	home_title,
	home_subtitle,
	home_url_label_qr,
	home_url_label,
	home_title_label,
	home_title_placeholder,
	home_description_label,
	home_description_placeholder,
	home_expires_label,
	home_expires_placeholder,
	home_max_clicks_label,
	home_max_clicks_placeholder,
	home_password_label,
	home_password_placeholder,
	home_guest_info,
	home_guest_signin_hint,
	home_processing,
	home_submit_button_qr,
	home_submit_button,

	// Auth
	auth_modal_signin,
	auth_sign_in,
	auth_login_button,
	auth_login_button_loading,
	auth_register_button,
	auth_register_button_loading,
	auth_email_label,
	auth_email_placeholder,
	auth_email_address_label,
	auth_password_label,
	auth_password_confirm_label,
	auth_forgot_password,
	auth_no_account,
	auth_have_account,
	auth_create_account,
	auth_create_account_title,
	auth_create_account_subtitle,
	auth_welcome_back,
	auth_welcome_back_subtitle,
	auth_back_to_login,
	auth_go_to_login,
	auth_remember_password,
	auth_username_auto,
	auth_registration_tip,
	auth_registration_success,
	auth_registration_success_message,
	auth_reset_password_title,
	auth_reset_password_subtitle,
	auth_reset_password_button,
	auth_reset_password_button_loading,
	auth_send_reset_button,
	auth_send_reset_button_loading,
	auth_reset_email_sent_title,
	auth_reset_email_sent_message,
	auth_request_new_reset_link,
	auth_set_new_password_title,
	auth_set_new_password_subtitle,
	auth_new_password_label,
	auth_new_password_placeholder,
	auth_confirm_new_password_label,
	auth_confirm_new_password_placeholder,
	auth_password_reset_success,
	auth_password_reset_success_message,
	auth_invalid_reset_link,
	auth_invalid_reset_link_message,
	auth_invalid_verification_link,
	auth_invalid_verification_link_message,
	auth_verification_link_expired,
	auth_verification_link_expired_message,
	auth_email_verified,
	auth_email_verified_message,
	auth_email_already_verified,
	auth_email_already_verified_message,
	auth_email_already_verified_notify,
	auth_email_already_verified_notify_desc,
	auth_token_expired_notify,
	auth_token_expired_notify_desc,
	auth_add_account,
	auth_add_account_info,
	auth_add_account_subtitle,
	auth_add_account_switch_info,

	// Account
	account_my_account,
	account_add_account,
	account_team_accounts,
	account_no_team_accounts,
	account_team_invite_info,
	account_team_member,

	// Workspace
	workspace_switch,
	workspace_personal,
	workspace_create,

	// Hero
	hero_control_headline,
	hero_control_subheadline,
	hero_control_cta,
	hero_free_text,
	hero_trust_badge_,
	hero_a,
	hero_b,
	hero_c,

	// Toast
	toast_login_success,
	toast_login_error,
	toast_logout_success,
	toast_register_success,
	toast_link_created,
	toast_link_updated,
	toast_link_deleted,
	toast_link_copied,
	toast_profile_updated,
	toast_avatar_uploaded,
	toast_password_changed,
	toast_password_reset_sent,
	toast_email_verified,
	toast_session_expired,
	toast_session_expired_desc,
	toast_network_error,
	toast_network_error_desc,
	toast_permission_denied,
	toast_payment_failed,
	toast_payment_failed_desc,
	toast_subscription_upgraded,
	toast_subscription_cancelled,
	toast_unsupported_format,

	// Errors
	error_link_creation,
	error_link_creation_single,
	error_password_change,
	error_save
} = messageProxy;

// Re-export locale utilities
export { locale };

// Default export for `import * as m from`
export default messageProxy;
