import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENV } from '../../core/config/env';
import { SessionService } from '../../core/services/session.service';

export type LoginPayload = { email: string; password: string; recaptchaToken: string };
export type VerifyCodePayload = { email: string; code: string; recaptchaToken: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  pending = signal(false);
  lastMessage = signal<string | null>(null);

  async login(payload: LoginPayload): Promise<void> {
    this.pending.set(true);
    this.lastMessage.set(null);
    try {
      // Paso 1: valida credenciales y envía código
      const res = await this.http.post(`${ENV.apiBaseUrl}/auth/login`, payload).toPromise();
      if (res) this.lastMessage.set('Se envió el código 2FA a tu correo.');
    } finally {
      this.pending.set(false);
    }
  }

  async verifyTwoFactorCode(payload: VerifyCodePayload): Promise<void> {
    // La API responde: { success, message, data: { token, user } }
    const res = await this.http
      .post<{ success: boolean; message?: string; data?: { token: string; user: any } }>(
        `${ENV.apiBaseUrl}/auth/verify-code`,
        payload
      )
      .toPromise();

    const token = res?.data?.token;
    const user = res?.data?.user;

    if (!token) {
      throw new Error('Token no recibido');
    }

    this.session.setToken(token);
    if (user) {
      this.session.setUser({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  }

  async resendTwoFactorCode(email: string): Promise<void> {
    await this.http.post(`${ENV.apiBaseUrl}/auth/resend-code`, { email }).toPromise();
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${ENV.apiBaseUrl}/auth/logout`, {});
  }
}
