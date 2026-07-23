import api from './api'
import type { MessageResponse } from '../types/common.types'
import type {
    AuthenticationResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegistrationRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
} from '../types/auth.types'

export type {
    AuthenticationResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegistrationRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
} from '../types/auth.types'
export type { MessageResponse } from '../types/common.types'

export const login = async (
    payload: LoginRequest,
): Promise<AuthenticationResponse> => {
    const {data} = await api.post<AuthenticationResponse>(
        '/auth/signin',
        payload,
    )
    return data
}

export const register = async (
    payload: RegistrationRequest,
): Promise<MessageResponse> => {
    const {data} = await api.post<MessageResponse>('/auth/signup', payload)
    return data
}

export const verifyEmail = async (
    payload: VerifyEmailRequest,
): Promise<MessageResponse> => {
    const {data} = await api.get<MessageResponse>('/account-action/verify-email', {
        params: payload,
    })
    return data
}

export const resendVerification = async (
    payload: ResendVerificationRequest,
): Promise<MessageResponse> => {
    const {data} = await api.get<MessageResponse>(
        '/account-action/resend-verification',
        {
            params: payload,
        },
    )
    return data
}

export const forgotPassword = async (
    payload: ForgotPasswordRequest,
): Promise<MessageResponse> => {
    const {data} = await api.get<MessageResponse>('/account-action/forgot-password', {
        params: payload,
    })
    return data
}

export const resetPassword = async (
    payload: ResetPasswordRequest,
): Promise<MessageResponse> => {
    const {data} = await api.post<MessageResponse>(
        '/account-action/reset-password',
        payload,
    )
    return data
}

export const logout = async (): Promise<MessageResponse> => {
    const {data} = await api.post<MessageResponse>('/auth/logout')
    return data
}
