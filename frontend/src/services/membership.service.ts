import api from './api'
import { handleNotFound } from './api-helpers'
import type { PageResponse } from '../types/common.types'
import type {
  CreateMembershipRequest,
  MembershipHistoryResponse,
  MembershipResponse,
  MembershipValidationResponse,
} from '../types/membership.types'

export type {
  MembershipHistoryResponse,
  MembershipResponse,
  MembershipStatus,
  MembershipType,
} from '../types/membership.types'

export const getMyActiveMembership =
  async (): Promise<MembershipResponse | null> =>
    handleNotFound(() =>
      api.get<MembershipResponse>('/memberships/me/active').then((r) => r.data),
    )

export const getMyMembershipHistory =
  async (): Promise<MembershipHistoryResponse> => {
    const { data } = await api.get<MembershipHistoryResponse>(
      '/memberships/me/history',
    )
    return data
  }

export const createMembership = async (
  payload: CreateMembershipRequest,
): Promise<MembershipResponse> => {
  const { data } = await api.post<MembershipResponse>('/memberships', payload)
  return data
}

export const activateMembership = async (
  membershipId: string,
): Promise<MembershipResponse> => {
  const { data } = await api.patch<MembershipResponse>(
    `/memberships/${membershipId}/activate`,
  )
  return data
}

export const freezeMembership = async (
  membershipId: string,
): Promise<MembershipResponse> => {
  const { data } = await api.patch<MembershipResponse>(
    `/memberships/${membershipId}/freeze`,
  )
  return data
}

export const unfreezeMembership = async (
  membershipId: string,
): Promise<MembershipResponse> => {
  const { data } = await api.patch<MembershipResponse>(
    `/memberships/${membershipId}/unfreeze`,
  )
  return data
}

export const cancelMembership = async (
  membershipId: string,
): Promise<MembershipResponse> => {
  const { data } = await api.patch<MembershipResponse>(
    `/memberships/${membershipId}/cancel`,
  )
  return data
}

export const getMembershipByClientId = async (
  clientId: string,
  page = 0,
  size = 10,
): Promise<PageResponse<MembershipResponse>> => {
  const { data } = await api.get<PageResponse<MembershipResponse>>(
    `/memberships/client/${clientId}`,
    { params: { page, size } },
  )
  return data
}

export const validateMembership = async (
  clientId: string,
): Promise<MembershipValidationResponse> => {
  const { data } = await api.get<MembershipValidationResponse>(
    `/memberships/client/${clientId}/validate`,
  )
  return data
}

export const extendMembership = async (
  membershipId: string,
  months: number,
): Promise<MembershipResponse> => {
  const { data } = await api.patch<MembershipResponse>(
    `/memberships/${membershipId}/extend`,
    { months },
  )
  return data
}
