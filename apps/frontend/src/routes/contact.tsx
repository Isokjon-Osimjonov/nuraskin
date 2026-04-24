import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/contact')({
  component: Contact,
});

const PREFIX = '+998 ';

// Format digits after +998 as: xx yyy yy yy
function formatDigits(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

interface FieldErrors {
  name?: string;
  phone?: string;
  message?: string;
}

// Dummy fetch since endpoint doesn't seem to exist yet
async function getPublicSettings() {
  try {
    const res = await fetch('http://localhost:4000/api/settings');
    if (res.ok) {
      return await res.json();
    }
    return { data: null };
  } catch {
    return { data: null };
  }
}

function Contact() {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: getPublicSettings,
    staleTime: 5 * 60 * 1000,
  });

  const s = data?.data;

  const [form, setForm] = useState({ name: '', phone: PREFIX, subject: '', message: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Phone digits after +998
  const phoneDigits = form.phone.slice(PREFIX.length).replace(/\D/g, '');
  const isPhoneComplete = phoneDigits.length === 9;

  const isAnyFilled = form.name.trim() || phoneDigits.length > 0 || form.message.trim();
  const isAllRequired = form.name.trim() && isPhoneComplete && form.message.trim();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Prevent deleting the prefix
    if (!raw.startsWith(PREFIX)) {
      setForm((f) => ({ ...f, phone: PREFIX }));
      return;
    }
    const after = raw.slice(PREFIX.length);
    const formatted = formatDigits(after);
    setForm((f) => ({ ...f, phone: PREFIX + formatted }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  // Keep cursor after prefix when user clicks into prefix area
  const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.target;
    setTimeout(() => {
      if (el.selectionStart !== null && el.selectionStart < PREFIX.length) {
        el.setSelectionRange(PREFIX.length, PREFIX.length);
      }
    }, 0);
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const pos = el.selectionStart ?? 0;
    // Block Backspace/Delete from eating into the prefix
    if ((e.key === 'Backspace' || e.key === 'Delete') && pos <= PREFIX.length) {
      e.preventDefault();
    }
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!form.name.trim()) next.name = 'Ismingizni kiriting';
    if (!isPhoneComplete) next.phone = "To'liq telefon raqam kiriting (9 ta raqam)";
    if (!form.message.trim()) next.message = 'Xabar matnini kiriting';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      const res = await fetch('http://localhost:4000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          contact: form.phone,
          subject: form.subject,
          message: form.message,
        }),
      });
      if (!res.ok) throw new Error('Failed to send contact');
      
      setStatus('success');
      setForm({ name: '', phone: PREFIX, subject: '', message: '' });
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
                    <h3 className="text-[14px] font-medium text-white mb-1">Telefon</h3>
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
                    <h3 className="text-[14px] font-medium text-white mb-1">Email</h3>
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
                  <h3 className="text-[14px] font-medium text-white mb-1">Ish vaqti</h3>
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
                <p className="text-[15px] font-medium text-[#4A1525]">Xabaringiz yuborildi!</p>
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
                      value={form.name}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, name: e.target.value }));
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
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handlePhoneChange}
                      onFocus={handlePhoneFocus}
                      onKeyDown={handlePhoneKeyDown}
                      className={inputClass(errors.phone)}
                      placeholder="+998 90 123 45 67"
                    />
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
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
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
                    value={form.message}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, message: e.target.value }));
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
                  disabled={!isAnyFilled || status === 'loading'}
                  title={!isAllRequired ? "Barcha majburiy maydonlarni to'ldiring" : ''}
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
