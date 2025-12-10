export interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'admin' | 'user';
  role_id?: number;
  isActive: boolean;
  profileImage?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  recaptchaToken: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
  token?: string;
  user?: User;
}

export interface TwoFactorPayload {
  email: string;
  code: string;
  recaptchaToken: string;
}

export interface ResendTwoFactorPayload {
  email: string;
}