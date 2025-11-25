import { authApi } from '$lib/services/api';

class AuthStore {
  user = $state<App.Locals['user']>(null);
  session = $state<App.Locals['session']>(null);
  loading = $state(false);
  error = $state<string | null>(null);

  get isAuthenticated() {
    return !!this.session && !!this.user;
  }

  async login(email: string, password: string) {
    this.loading = true;
    this.error = null;

    const { data, error } = await authApi.login(email, password);

    if (error) {
      this.error = error;
      this.loading = false;
      return false;
    }

    if (data) {
      this.session = { token: data.token, userId: data.user?.id ?? '', expiresAt: '' };
      this.user = data.user;
      // Store token in cookie/localStorage
      if (typeof window !== 'undefined') {
        document.cookie = `news_session=${data.token}; path=/; max-age=604800`; // 7 days
      }
    }

    this.loading = false;
    return true;
  }

  async signup(email: string, password: string, name?: string) {
    this.loading = true;
    this.error = null;

    const { data, error } = await authApi.signup(email, password, name);

    if (error) {
      this.error = error;
      this.loading = false;
      return false;
    }

    if (data) {
      this.session = { token: data.token, userId: data.user?.id ?? '', expiresAt: '' };
      this.user = data.user;
      if (typeof window !== 'undefined') {
        document.cookie = `news_session=${data.token}; path=/; max-age=604800`;
      }
    }

    this.loading = false;
    return true;
  }

  async logout() {
    if (this.session?.token) {
      await authApi.logout(this.session.token);
    }

    this.session = null;
    this.user = null;

    if (typeof window !== 'undefined') {
      document.cookie = 'news_session=; path=/; max-age=0';
    }
  }

  setSession(session: App.Locals['session'], user: App.Locals['user']) {
    this.session = session;
    this.user = user;
  }
}

export const authStore = new AuthStore();
