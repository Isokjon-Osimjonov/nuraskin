import { z } from 'zod';

export const addressSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  regionCode: z.enum(['UZB', 'KOR']),
  label: z.string().max(30),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  
  // UZB fields
  uzbRegion: z.string().nullable().optional(),
  uzbCity: z.string().nullable().optional(),
  uzbStreet: z.string().nullable().optional(),
  
  // KOR fields
  korPostalCode: z.string().nullable().optional(),
  korRoadAddress: z.string().nullable().optional(),
  korDetail: z.string().nullable().optional(),
  korBuilding: z.string().nullable().optional(),
  
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AddressResponse = z.infer<typeof addressSchema>;

export const createAddressSchema = z.object({
  label: z.string().max(30).default('Manzil'),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  regionCode: z.enum(['UZB', 'KOR']),
  
  // UZB
  uzbRegion: z.string().optional(),
  uzbCity: z.string().optional(),
  uzbStreet: z.string().optional(),
  
  // KOR
  korPostalCode: z.string().optional().nullable(),
  korRoadAddress: z.string().optional().nullable(),
  korDetail: z.string().optional().nullable(),
  korBuilding: z.string().optional().nullable(),
  
  isDefault: z.boolean().optional().default(false),
}).refine(data => {
  if (data.regionCode === 'UZB') {
    return !!data.uzbRegion && !!data.uzbCity && !!data.uzbStreet;
  }
  return !!data.korPostalCode && !!data.korRoadAddress && !!data.korDetail;
}, {
  message: "Mintaqaga mos barcha manzillar kiritilishi shart",
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

export const updateAddressSchema = z.object({
  label: z.string().max(30).optional(),
  fullName: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  regionCode: z.enum(['UZB', 'KOR']).optional(),
  uzbRegion: z.string().optional(),
  uzbCity: z.string().optional(),
  uzbStreet: z.string().optional(),
  korPostalCode: z.string().length(5).optional(),
  korRoadAddress: z.string().optional(),
  korDetail: z.string().optional(),
  korBuilding: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

