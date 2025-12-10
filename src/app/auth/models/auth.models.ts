export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  recaptchaToken: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface TwoFactorPayload {
  email: string;
  code: string;
  recaptchaToken: string;
}

export interface ResendTwoFactorPayload {
  email: string;
}
