export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface TwoFactorRequest {
  email: string;
  code: string; // 6 dígitos
}

export interface AuthResponse {
  userId: string;
  email: string;
  token?: string;
}
