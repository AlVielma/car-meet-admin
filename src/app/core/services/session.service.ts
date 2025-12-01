import { inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly TOKEN_KEY = 'cm_token';
  private readonly USER_KEY = 'cm_user';

  user = signal<{ id: number; firstName: string; lastName: string; email: string } | null>(null);
  private emailSig = signal<string | null>(null);
  email = () => this.emailSig();

  constructor() {
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      this.user.set(JSON.parse(storedUser));
    }
  }

  setToken(token: string | null): void {
    if (token === null) {
      localStorage.removeItem(this.TOKEN_KEY);
    } else {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  setUser(user: { id: number; firstName: string; lastName: string; email: string } | null): void {
    this.user.set(user);
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
    }
  }

  setSession(token: string, email: string) {
    localStorage.setItem('token', token);
    this.emailSig.set(email);
  }

  clear(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.user.set(null);
    this.emailSig.set(null);
  }
}
