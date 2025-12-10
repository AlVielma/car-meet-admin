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
    console.log('Login response:', response);
    return response;
  }

  async adminLogin(payload: LoginPayload): Promise<LoginResponse> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${ENV.apiBaseUrl}/auth/admin-login`, payload)
    );
    console.log('Admin login response:', response);
    return response;
  }

  async verifyTwoFactorCode(payload: TwoFactorPayload): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${ENV.apiBaseUrl}/auth/verify-code`, payload)
    );

    console.log('Verify 2FA response:', response);

    // Manejar diferentes formatos de respuesta
    const token = response.data?.token || response.token;
    const user = response.data?.user || response.user;

    if (!token || !user) {
      console.error('Token o usuario no encontrado en la respuesta:', response);
      throw new Error('Respuesta inválida del servidor');
    }

    this.session.setToken(token);
    this.session.setUser(user);
    this.isAuthenticated.set(true);
    this.currentUser.set(user);
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