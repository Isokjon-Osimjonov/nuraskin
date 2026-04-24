import { useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAppStore } from '@/stores/app.store';
import { ArrowLeft, MapPin, Plus, Star, Trash2, Phone, User, X } from 'lucide-react';

export const Route = createFileRoute('/_protected/addresses')({
  component: Addresses,
});

function Addresses() {
  const { isAuthenticated, addresses, addAddress, removeAddress, setDefaultAddress } = useAppStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [label, setLabel] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addAddress({ label, fullName, phone, street, city, isDefault });
    setShowForm(false);
    setLabel(''); setFullName(''); setPhone(''); setStreet(''); setCity(''); setIsDefault(false);
  };

  const inputClass = 'w-full h-12 rounded-xl border border-stone-200 bg-white px-4 text-[14px] font-light outline-none focus:border-[#4A1525] transition-colors placeholder:text-stone-400';

  return (
    <div className="min-h-[80vh] py-12 px-6 bg-white">
      <div className="max-w-[640px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/profile" className="text-stone-400 hover:text-stone-700 transition-colors">
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </Link>
            <h1 className="text-xl font-normal text-[#4A1525]">Manzillarim</h1>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="h-9 px-4 rounded-full bg-[#4A1525] text-white text-[12px] font-light hover:bg-[#6B2540] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              Yangi manzil
            </button>
          )}
        </div>

        {/* New Address Form */}
        {showForm && (
          <div className="bg-[#f8f7f5] rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-normal text-stone-800">Yangi manzil qo'shish</h2>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-light text-stone-600 mb-2">Yorliq</label>
                  <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} placeholder="Uy, Ish joyi..." required />
                </div>
                <div>
                  <label className="block text-[13px] font-light text-stone-600 mb-2">To'liq ism</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Ism Familiya" required />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-light text-stone-600 mb-2">Telefon</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+998 90 123 45 67" required />
              </div>
              <div>
                <label className="block text-[13px] font-light text-stone-600 mb-2">Manzil</label>
                <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} placeholder="Ko'cha, uy raqami" required />
              </div>
              <div>
                <label className="block text-[13px] font-light text-stone-600 mb-2">Shahar</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Toshkent" required />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="accent-[#4A1525] w-4 h-4" />
                <span className="text-[13px] font-light text-stone-600">Asosiy manzil sifatida belgilash</span>
              </label>
              <button type="submit" className="h-12 px-8 bg-[#4A1525] text-white font-light text-[14px] tracking-wide rounded-full hover:bg-[#6B2540] transition-colors">
                Saqlash
              </button>
            </form>
          </div>
        )}

        {/* Address List */}
        {addresses.length === 0 ? (
          <div className="bg-[#f8f7f5] rounded-2xl p-12 text-center">
            <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" strokeWidth={1.2} />
            <p className="text-[14px] font-light text-stone-500">Hali manzillar qo'shilmagan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-[#f8f7f5] rounded-2xl p-5 border-2 transition-colors ${
                  addr.isDefault ? 'border-[#4A1525]/20' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-normal text-stone-800">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4A1525]/10 text-[10px] font-normal text-[#4A1525]">
                        <Star className="w-3 h-3" strokeWidth={1.5} />
                        Asosiy
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!addr.isDefault && (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="h-8 px-3 rounded-lg text-[11px] font-light text-stone-500 hover:text-[#4A1525] hover:bg-stone-100 transition-colors"
                      >
                        Asosiy qilish
                      </button>
                    )}
                    <button
                      onClick={() => removeAddress(addr.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[13px] font-light text-stone-600 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-stone-400" strokeWidth={1.5} />
                    {addr.fullName}
                  </p>
                  <p className="text-[13px] font-light text-stone-600 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400" strokeWidth={1.5} />
                    {addr.phone}
                  </p>
                  <p className="text-[13px] font-light text-stone-600 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" strokeWidth={1.5} />
                    {addr.street}, {addr.city}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}