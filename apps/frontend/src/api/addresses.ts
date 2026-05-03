import { apiFetch } from '@/lib/apiFetch';
import type { AddressResponse, CreateAddressInput, UpdateAddressInput } from '@nuraskin/shared-types';

export const getAddresses = () => apiFetch<AddressResponse[]>('/storefront/addresses');

export const createAddress = (data: CreateAddressInput) =>
  apiFetch<AddressResponse>('/storefront/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateAddress = (id: string, data: UpdateAddressInput) =>
  apiFetch<AddressResponse>(`/storefront/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteAddress = (id: string) =>
  apiFetch<{ success: true }>(`/storefront/addresses/${id}`, {
    method: 'DELETE',
  });

export const setDefaultAddress = (id: string) =>
  apiFetch<AddressResponse>(`/storefront/addresses/${id}/set-default`, {
    method: 'PATCH',
  });
