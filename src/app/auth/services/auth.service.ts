import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../../core/services/session.service';
import { ENV } from '../../core/config/env';
import type {
  LoginPayload,
  LoginResponse,
  TwoFactorPayload,
  User
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private session = inject(SessionService);

  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);

  constructor() {
    const token = this.session.getToken();
    if (token) {
      this.isAuthenticated.set(true);
      const user = this.session.getUser();
      if (user) {
        this.currentUser.set(user);
      }
    }
  }

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${ENV.apiBaseUrl}/auth/login`, payload)
    );
    return response;
  }

  async adminLogin(payload: LoginPayload): Promise<LoginResponse> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${ENV.apiBaseUrl}/auth/admin-login`, payload)
    );
    return response;
  }

  async verifyTwoFactorCode(payload: TwoFactorPayload): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${ENV.apiBaseUrl}/auth/verify-code`, payload)
    );

    this.session.setToken(response.token);
    this.session.setUser(response.user);
    this.isAuthenticated.set(true);
    this.currentUser.set(response.user);
  }

  async resendTwoFactorCode(email: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${ENV.apiBaseUrl}/auth/resend-code`, { email })
    );
  }

  async logout(): Promise<void> {
    this.session.clear();
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    await this.router.navigate(['/auth/login']);
  }
}
