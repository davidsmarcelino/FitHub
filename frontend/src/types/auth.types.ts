export interface LoginRequest {
  email: string
  password: string
}

export interface RegistrationRequest {
  email: string
  password: string
  confirmPassword: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface AuthenticationResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface ForgotPasswordRequest {
  email: string
}
