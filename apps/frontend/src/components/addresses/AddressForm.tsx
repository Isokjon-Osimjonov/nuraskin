import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createAddressSchema,
  type CreateAddressInput,
  type AddressResponse,
} from '@nuraskin/shared-types';
import { Phone, User, Tag, Loader2, Search, AlertCircle } from 'lucide-react';
import { JusoSearchModal } from './JusoSearchModal';

const UZB_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand',
  'Buxoro',
  'Namangan',
  'Andijon',
  "Farg'ona",
  'Qashqadaryo',
  'Surxondaryo',
  'Xorazm',
  'Sirdaryo',
  'Jizzax',
  'Navoiy',
  "Qoraqalpog'iston Respublikasi",
];

interface AddressFormProps {
  regionCode: 'UZB' | 'KOR';
  initialData?: AddressResponse;
  onSubmit: (data: CreateAddressInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AddressForm({
  regionCode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: AddressFormProps) {
  const [jusoModalOpen, setJusoModalOpen] = useState(false);

  const form = useForm<CreateAddressInput>({
    resolver: zodResolver(createAddressSchema as any),
    defaultValues: initialData
      ? ({
          label: initialData.label,
          fullName: initialData.fullName,
          phone: initialData.phone,
          regionCode: initialData.regionCode as 'UZB' | 'KOR',
          uzbRegion: initialData.uzbRegion || '',
          uzbCity: initialData.uzbCity || '',
          uzbStreet: initialData.uzbStreet || '',
          korPostalCode: initialData.korPostalCode || '',
          korRoadAddress: initialData.korRoadAddress || '',
          korDetail: initialData.korDetail || '',
          korBuilding: initialData.korBuilding || '',
          isDefault: initialData.isDefault,
        } as any)
      : ({
          label: 'Uy',
          regionCode,
          isDefault: false,
          fullName: '',
          phone: '',
          uzbRegion: regionCode === 'UZB' ? UZB_REGIONS[0] : '',
          uzbCity: '',
          uzbStreet: '',
          korPostalCode: '',
          korRoadAddress: '',
          korDetail: '',
          korBuilding: '',
        } as any),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const phoneValue = watch('phone');

  // Phone prefix management
  useEffect(() => {
    if (!initialData && !phoneValue) {
      if (regionCode === 'UZB') setValue('phone', '+998');
      else setValue('phone', '+82');
    }
  }, [regionCode, initialData, setValue, phoneValue]);

  const handleJusoSelect = (result: any) => {
    setValue('korPostalCode', result.postal_code);
    setValue('korRoadAddress', result.road_address);
    setValue('korBuilding', result.building_name);
    setJusoModalOpen(false);
  };

  return (
    <div className="space-y-6 py-2">
      <form
        onSubmit={form.handleSubmit(
          (data) => {
            console.log('✅ FORM VALID, submitting data:', data);
            onSubmit(data as any);
          },
          (errors) => {
            console.log('❌ FORM INVALID, errors:', errors);
          },
        )}
        className="space-y-5"
      >
        {/* Region Specific Error */}
        {errors.root && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-[12px] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errors.root.message}
          </div>
        )}

        {/* Common: Label & Full Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-stone-500 ml-1">
              Manzil nomi (Masalan: Uy, Ish joyi)
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
              <input
                {...register('label')}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-all"
                placeholder="Uy"
              />
            </div>
            {errors.label && (
              <p className="text-[11px] text-red-500 ml-1">
                {errors.label.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-stone-500 ml-1">
              Qabul qiluvchi F.I.SH
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
              <input
                {...register('fullName')}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-all"
                placeholder="Ism va familiya"
              />
            </div>
            {errors.fullName && (
              <p className="text-[11px] text-red-500 ml-1">
                {errors.fullName.message}
              </p>
            )}
          </div>
        </div>

        {/* Common: Phone */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-stone-500 ml-1">
            Telefon raqam
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
            <input
              {...register('phone')}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-all"
              placeholder={
                regionCode === 'UZB' ? '+998 90 123 45 67' : '+82 10 1234 5678'
              }
            />
          </div>
          {errors.phone && (
            <p className="text-[11px] text-red-500 ml-1">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Region Specific Fields */}
        {regionCode === 'UZB' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-stone-500 ml-1">
                  Viloyat
                </label>
                <select
                  {...register('uzbRegion')}
                  className="w-full h-11 px-4 rounded-xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-all appearance-none"
                >
                  {UZB_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.uzbRegion && (
                  <p className="text-[11px] text-red-500 ml-1">
                    {errors.uzbRegion.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-stone-500 ml-1">
                  Shahar / Tuman
                </label>
                <input
                  {...register('uzbCity')}
                  className="w-full h-11 px-4 rounded-xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-all"
                  placeholder="Masalan: Yunusobod tumani"
                />
                {errors.uzbCity && (
                  <p className="text-[11px] text-red-500 ml-1">
                    {errors.uzbCity.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-stone-500 ml-1">
                Ko'cha va uy raqami
              </label>
              <input
                {...register('uzbStreet')}
                className="w-full h-11 px-4 rounded-xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-all"
                placeholder="Masalan: Navoiy ko'chasi, 15-uy"
              />
              {errors.uzbStreet && (
                <p className="text-[11px] text-red-500 ml-1">
                  {errors.uzbStreet.message}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-[12px] font-medium text-stone-500 ml-1">
                  Pochta indeksi
                </label>
                <input
                  {...register('korPostalCode')}
                  readOnly
                  className="w-full h-11 px-4 rounded-xl bg-stone-100 border border-stone-100 text-[14px] outline-none cursor-not-allowed"
                  placeholder="12345"
                />
              </div>
              <button
                type="button"
                onClick={() => setJusoModalOpen(true)}
                className="h-11 px-6 rounded-xl bg-[#4A1525] text-white text-[13px] font-medium hover:bg-[#6B2540] transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Manzilni qidirish
              </button>
            </div>
            {errors.korPostalCode && (
              <p className="text-[11px] text-red-500 ml-1">
                {errors.korPostalCode.message}
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-stone-500 ml-1">
                Asosiy manzil
              </label>
              <input
                {...register('korRoadAddress')}
                readOnly
                className="w-full h-11 px-4 rounded-xl bg-stone-100 border border-stone-100 text-[14px] outline-none cursor-not-allowed"
                placeholder="서울특별시 강남구..."
              />
              {errors.korRoadAddress && (
                <p className="text-[11px] text-red-500 ml-1">
                  {errors.korRoadAddress.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-stone-500 ml-1">
                  Bino nomi
                </label>
                <input
                  {...register('korBuilding')}
                  readOnly
                  className="w-full h-11 px-4 rounded-xl bg-stone-100 border border-stone-100 text-[14px] outline-none cursor-not-allowed"
                />
                {errors.korBuilding && (
                  <p className="text-[11px] text-red-500 ml-1">
                    {errors.korBuilding.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-stone-500 ml-1">
                  Batafsil manzil (Kvartira, uy)
                </label>
                <input
                  {...register('korDetail')}
                  className="w-full h-11 px-4 rounded-xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-all"
                  placeholder="Masalan: 101-dong, 502-ho"
                />
                {errors.korDetail && (
                  <p className="text-[11px] text-red-500 ml-1">
                    {errors.korDetail.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Default Checkbox */}
        <div className="flex items-center gap-3 p-1">
          <input
            type="checkbox"
            id="isDefault"
            {...register('isDefault')}
            className="w-4 h-4 rounded border-stone-300 text-[#4A1525] focus:ring-[#4A1525]"
          />
          <label
            htmlFor="isDefault"
            className="text-[13px] text-stone-600 cursor-pointer"
          >
            Asosiy manzil sifatida saqlash
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-stone-50">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border border-stone-200 text-stone-500 text-[14px] font-medium hover:bg-stone-50 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] h-12 rounded-xl bg-[#4A1525] text-white text-[14px] font-medium hover:bg-[#6B2540] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : initialData ? (
              'Yangilash'
            ) : (
              'Saqlash'
            )}
          </button>
        </div>
      </form>

      <JusoSearchModal
        open={jusoModalOpen}
        onOpenChange={setJusoModalOpen}
        onSelect={handleJusoSelect}
      />
    </div>
  );
}
