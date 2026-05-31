import { api } from '@/lib/api';
import type {
  AddressResponse,
  CreateAddressInput,
  UpdateAddressInput,
} from '@nuraskin/shared-types';

export const getAddresses = () => api.auth.get<AddressResponse[]>('/storefront/addresses');

export const createAddress = (data: CreateAddressInput) =>
  api.auth.post<any>('/storefront/addresses', data);

export const updateAddress = (id: string, data: UpdateAddressInput) =>
  api.auth.patch<any>(`/storefront/addresses/${id}`, data);

export const deleteAddress = (id: string) => api.auth.delete<any>(`/storefront/addresses/${id}`);

export const setDefaultAddress = (id: string) =>
  api.auth.patch<any>(`/storefront/addresses/${id}/set-default`, {});
