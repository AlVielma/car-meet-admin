import { Injectable } from '@angular/core';
import type { User } from '../../auth/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) {
      return null;
    }
    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  }

  email(): string {
    const user = this.getUser();
    return user?.email ?? '';
  }

  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  clear(): void {
    this.removeToken();
    this.removeUser();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
