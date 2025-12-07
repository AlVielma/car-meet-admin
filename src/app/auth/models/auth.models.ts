export interface LoginRequest {
  email: string;
  password: string;
  recaptchaToken: string;
}

export interface TwoFactorRequest {
  email: string;
  code: string; // 6 dígitos
  recaptchaToken: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  token?: string;
}
