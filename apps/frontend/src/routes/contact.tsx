import { api } from '@/lib/api';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app.store';

export const Route = createFileRoute('/contact')({
  component: Contact,
});

// Dummy fetch since endpoint doesn't seem to exist yet
async function getPublicSettings() {
  try {
    const res = await fetch('/api/storefront/settings');
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

function Contact() {
  const regionCode = useAppStore((s) => s.regionCode);
  const phonePrefix = regionCode === 'KOR' ? '+82' : '+998';
  const phonePlaceholder = regionCode === 'KOR' ? '10 0000 0000' : '00 000 00 00';

  const { data: s } = useQuery({
    queryKey: ['public-settings'],
    queryFn: getPublicSettings,
    staleTime: 5 * 60 * 1000,
  });

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [errors, setErrors] = useState<{ name?: string; phone?: string; message?: string }>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    setPhoneNumber('');
  }, [regionCode]);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Ismingizni kiriting';
    if (phoneNumber.replace(/\D/g, '').length < 7) next.phone = "Telefon raqamingizni to'liq kiriting";
    if (!message.trim()) next.message = 'Xabar matnini kiriting';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      await api.post<any>('/storefront/contact', {
          name,
          phone: `${phonePrefix}${phoneNumber}`,
          subject,
          message,
          region: regionCode,
        });
      
      setStatus('success');
      setName(''); setPhoneNumber('');
      setSubject(''); setMessage('');
      setErrors({});
    } catch {
      setStatus('error');
    }
  };

  const inputClass = (hasError?: string) =>
    `w-full h-12 rounded-xl border bg-white px-4 text-[14px] font-light outline-none transition-colors placeholder:text-stone-400 ${
      hasError ? 'border-red-400 focus:border-red-400' : 'border-stone-200 focus:border-[#4A1525]'
    }`;

  return (
    <div className="bg-white min-h-screen py-16">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center mb-14">
          <h1 className="text-2xl md:text-3xl font-light text-[#4A1525] mb-4">Biz bilan aloqa</h1>
          <p className="text-[14px] font-light text-stone-500 max-w-2xl mx-auto leading-relaxed">
            Savollaringiz bormi yoki hamkorlik qilmoqchimisiz? Biz sizga yordam berishdan doim xursandmiz.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row bg-[#f8f7f5] rounded-2xl overflow-hidden">
          {/* Contact Info (Left) */}
          <div className="w-full lg:w-2/5 bg-[#4A1525] text-white p-8 md:p-10">
            <h2 className="text-lg font-light mb-8 text-white">Ma'lumotlarimiz</h2>

            <div className="space-y-7">
              {s?.contactAddress && (
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-white/70 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[14px] font-light text-white mb-1">Manzil</h3>
                    <p className="text-[13px] font-light text-white/60 leading-relaxed">
                      {s.contactAddress}
                    </p>
                  </div>
                </div>
              )}

              {s?.contactPhone && (
                <div className="flex items-start gap-4">
                  <Phone className="w-5 h-5 text-white/70 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[14px] font-normal text-white mb-1">Telefon</h3>
                    <a
                      href={`tel:${s.contactPhone}`}
                      className="block text-[13px] font-light text-white/60 hover:text-white transition-colors"
                    >
                      {s.contactPhone}
                    </a>
                  </div>
                </div>
              )}

              {s?.contactEmail && (
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-white/70 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[14px] font-normal text-white mb-1">Email</h3>
                    <a
                      href={`mailto:${s.contactEmail}`}
                      className="text-[13px] font-light text-white/60 hover:text-white transition-colors"
                    >
                      {s.contactEmail}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-white/70 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-[14px] font-normal text-white mb-1">Ish vaqti</h3>
                  <p className="text-[13px] font-light text-white/60">Dush - Shan: 09:00 - 18:00</p>
                  <p className="text-[13px] font-light text-white/60">Yakshanba: Dam olish kuni</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form (Right) */}
          <div className="w-full lg:w-3/5 p-8 md:p-10">
            <h2 className="text-lg font-light text-[#4A1525] mb-6">Xabar yuborish</h2>

            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                <div className="text-[#4A1525] text-3xl">✓</div>
                <p className="text-[15px] font-normal text-[#4A1525]">Xabaringiz yuborildi!</p>
                <p className="text-[13px] font-light text-stone-500">
                  Tez orada siz bilan bog'lanamiz.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-4 text-[13px] font-light text-[#4A1525] underline underline-offset-2"
                >
                  Yangi xabar yuborish
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-light text-stone-600 mb-2">
                      Ismingiz
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      className={inputClass(errors.name)}
                      placeholder="Ism Familiya"
                    />
                    {errors.name && (
                      <p className="mt-1 text-[12px] text-red-500 font-light">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-light text-stone-600 mb-2">
                      Telefon raqam
                    </label>
                    <div className="flex items-center border rounded-xl overflow-hidden focus-within:border-[#4A1525] transition-colors border-stone-200">
                      <span className="px-4 py-3 bg-stone-50 border-r border-stone-200 text-stone-600 text-sm whitespace-nowrap shrink-0 font-light">
                        {phonePrefix}
                      </span>
                      <input
                        type="tel"
                        placeholder={phonePlaceholder}
                        className="flex-1 px-4 py-3 outline-none text-[14px] font-light bg-white"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                        }}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-[12px] text-red-500 font-light">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-light text-stone-600 mb-2">
                    Xabar mavzusi
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={inputClass()}
                    placeholder="Kichik sarlavha ushbu xabar haqida"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-light text-stone-600 mb-2">
                    Xabar matni
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                    }}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-[14px] font-light outline-none transition-colors placeholder:text-stone-400 resize-none ${
                      errors.message
                        ? 'border-red-400 focus:border-red-400'
                        : 'border-stone-200 focus:border-[#4A1525]'
                    }`}
                    placeholder="Bizga nima haqida yozmoqchisiz..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-[12px] text-red-500 font-light">{errors.message}</p>
                  )}
                </div>

                {status === 'error' && (
                  <p className="text-[13px] text-red-500 font-light">
                    Xatolik yuz berdi. Iltimos qayta urinib ko'ring.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-[#4A1525] text-white text-[13px] font-light tracking-wide px-8 py-3 rounded-full hover:bg-[#6B2540] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'Yuborilmoqda...' : 'Xabarni yuborish'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

