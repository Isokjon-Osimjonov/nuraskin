import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Star, ChevronRight, Plus, Minus, ShoppingBag, ShieldCheck, Truck, Heart, Bell, BellOff } from 'lucide-react';
import { useProductBySlug } from '@/hooks/useProducts';
import { useAppStore } from '@/stores/app.store';
import { useMyWaitlistIds, useToggleWaitlist } from '@/hooks/useWaitlist';

export const Route = createFileRoute('/products/$slug')({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { cart, addToCart, favorites, toggleFavorite, isAuthenticated } = useAppStore();
  const { data, isLoading } = useProductBySlug(slug);
  const { data: waitlistIds } = useMyWaitlistIds();
  const { add: addWaitlist, remove: removeWaitlist } = useToggleWaitlist();
  const navigate = useNavigate();

  const product = data?.data;
  const [activeImage, setActiveImage] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<'ingredients' | 'how-to-use' | null>('ingredients');
  const [showShare, setShowShare] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen py-10">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-12 lg:gap-20 animate-pulse">
            <div className="w-full md:w-1/2">
              <div className="aspect-square rounded-2xl bg-stone-200" />
            </div>
            <div className="w-full md:w-1/2 space-y-4 pt-8">
              <div className="h-4 bg-stone-200 rounded w-1/4" />
              <div className="h-8 bg-stone-200 rounded w-3/4" />
              <div className="h-6 bg-stone-200 rounded w-1/3" />
              <div className="h-20 bg-stone-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-24 px-6">
        <h1 className="text-2xl font-medium text-[#4A1525] mb-4">Mahsulot topilmadi</h1>
        <Link
          to="/products"
          className="border border-stone-300 text-stone-700 text-[13px] font-light px-6 py-2.5 rounded-full hover:border-[#4A1525] hover:text-[#4A1525] transition-colors"
        >
          Katalogga qaytish
        </Link>
      </div>
    );
  }

  const displayImage = activeImage || product.images[0] || '';

  const toggleSection = (section: 'ingredients' | 'how-to-use') => {
    setOpenSection(openSection === section ? null : section);
  };

  const isFav = favorites.some((p) => p.id === product._id);
  const isOnWaitlist = waitlistIds?.data.includes(product._id) ?? false;
  const productForStore = { id: product._id, name: product.name, price: product.currentPriceUZS, image: product.images[0] || '', slug: product.slug, stock: product.totalStock };
  const isInCart = cart.some((i) => i.product.id === product._id);

  function handleWaitlistToggle() {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
      return;
    }
    if (!product) return;
    if (isOnWaitlist) {
      removeWaitlist.mutate(product._id);
    } else {
      addWaitlist.mutate(product._id);
    }
  }

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-[1280px] mx-auto px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center text-[13px] font-light text-stone-400 mb-8 flex-wrap gap-y-1">
          <Link to="/" className="hover:text-[#4A1525] transition-colors">Bosh sahifa</Link>
          <ChevronRight className="w-3 h-3 mx-1 shrink-0" />
          <Link to="/products" className="hover:text-[#4A1525] transition-colors">Mahsulotlar</Link>
          <ChevronRight className="w-3 h-3 mx-1 shrink-0" />

          {/* Category breadcrumb — hierarchical */}
          {(() => {
            const cat = typeof product.category === 'object' ? product.category : null;
            if (cat) {
              return (
                <>
                  <Link to="/products" className="hover:text-[#4A1525] transition-colors">
                    {cat.name}
                  </Link>
                  <ChevronRight className="w-3 h-3 mx-1 shrink-0" />
                </>
              );
            }
            return null;
          })()}

          <span className="text-stone-700 font-medium truncate">{product.name}</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">

          {/* Image Gallery */}
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#f8f7f5]">
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex flex-wrap gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      (activeImage || product.images[0]) === img ? 'border-[#4A1525]' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="w-full md:w-1/2 flex flex-col pt-2 md:pt-8">
            {/* Product Type Badge */}
            {product.productType && (
              <span className="inline-flex items-center self-start px-3 py-1 bg-[#4A1525]/10 text-[#4A1525] rounded-full text-[11px] font-medium tracking-wide mb-2">
                {product.productType}
              </span>
            )}

            {product.brand && (
              <span className="text-[12px] font-light text-stone-400 tracking-wide mb-2">
                {product.brand}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-light text-[#4A1525] mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Reviews placeholder */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 text-stone-200" />
              </div>
            </div>

            <div className="text-2xl font-light text-[#4A1525] mb-6">
              {formatPrice(product.currentPriceUZS)}
            </div>

            <p className="text-[14px] font-light text-stone-500 mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* Skin Types */}
            {product.skinTypes?.length > 0 && (
              <div className="mb-6">
                <span className="text-[12px] font-light text-stone-500 block mb-3">Mos keluvchi teri turlari:</span>
                <div className="flex flex-wrap gap-2">
                  {product.skinTypes.map((type) => (
                    <span key={type} className="px-3 py-1 bg-[#4A1525]/5 text-[#4A1525] rounded-full text-[11px] font-light border border-[#4A1525]/10">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {product.benefits?.length > 0 && (
              <div className="mb-6">
                <span className="text-[12px] font-light text-stone-500 block mb-3">Asosiy foydalari:</span>
                <div className="flex flex-wrap gap-2">
                  {product.benefits.map((benefit) => (
                    <span key={benefit} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium border border-emerald-200/50">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stock indicator */}
            {product.totalStock > 0 && product.totalStock <= 5 && (
              <p className="text-[12px] text-orange-600 mb-4">Faqat {product.totalStock} ta qoldi!</p>
            )}
            {!product.inStock && (
              <div className="mb-6">
                <p className="text-[13px] text-red-600 font-medium mb-3">Hozircha mavjud emas</p>
                <button
                  onClick={handleWaitlistToggle}
                  disabled={addWaitlist.isPending || removeWaitlist.isPending}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-light transition-all duration-200 disabled:opacity-50 ${
                    isOnWaitlist
                      ? 'bg-[#4A1525] text-white hover:bg-[#6B2540]'
                      : 'bg-stone-200 text-stone-600 hover:bg-[#4A1525] hover:text-white'
                  }`}
                >
                  {isOnWaitlist ? (
                    <>
                      <BellOff className="w-4 h-4" />
                      Xabarnomani bekor qilish
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      Mavjud bo'lganda xabardor qiling
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Add to Cart Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 pb-8 border-b border-stone-100">
              <div className="flex items-center justify-between w-full sm:w-28 h-12 border border-stone-200 rounded-full px-4 bg-[#f8f7f5]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-stone-400 hover:text-[#4A1525] transition-colors disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-medium text-lg w-8 text-center">{quantity}</span>
                <button
                  onClick={() => {
                    const maxStock = product.totalStock || 0;
                    if (maxStock > 0 && quantity >= maxStock) return;
                    setQuantity(quantity + 1);
                  }}
                  className="text-stone-400 hover:text-[#4A1525] transition-colors disabled:opacity-50"
                  disabled={quantity >= product.totalStock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                className={`w-full h-12 font-light text-[14px] tracking-wide rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                  isInCart
                    ? 'bg-[#4A1525] text-white hover:bg-[#6B2540]'
                    : 'bg-white border border-stone-200 text-[#4A1525] hover:border-[#4A1525]'
                }`}
                disabled={!product.inStock}
                onClick={() => {
                  const maxStock = product.totalStock || 0;
                  if (maxStock > 0 && quantity > maxStock) return;
                  addToCart(productForStore, quantity);
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                {isInCart ? 'Savatchada bor' : 'Savatchaga qo\'shish'}
              </button>

              {/* Wishlist / Favorite button */}
              <button
                onClick={() => toggleFavorite(productForStore)}
                aria-label="Sevimliga qo'shish"
                className={`shrink-0 w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${
                  isFav
                    ? 'border-[#4A1525] text-[#4A1525] bg-[#4A1525]/5'
                    : 'border-stone-200 text-stone-400 hover:border-[#4A1525] hover:text-[#4A1525]'
                }`}
              >
                <Heart
                  className="w-5 h-5"
                  strokeWidth={1.5}
                  fill={isFav ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            {/* Share */}
            <div className="relative mb-8">
              <button
                onClick={() => setShowShare(!showShare)}
                className="flex items-center gap-2 text-[13px] font-light text-stone-500 hover:text-[#4A1525] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Ulashish
              </button>

              {showShare && (
                <div className="absolute left-0 top-8 z-20 bg-white border border-stone-100 rounded-2xl shadow-xl p-3 flex flex-col gap-1 min-w-[200px]">
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.name + ' — NuraSkin')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8f7f5] text-[13px] font-light text-stone-700 transition-colors"
                    onClick={() => setShowShare(false)}
                  >
                    <svg className="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setShowShare(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8f7f5] text-[13px] font-light text-stone-700 transition-colors w-full text-left"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="url(#ig)" strokeWidth="1.8">
                      <defs>
                        <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0">
                          <stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/>
                        </linearGradient>
                      </defs>
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="url(#ig)" stroke="none"/>
                    </svg>
                    Instagram (havolani nusxalash)
                  </button>
                  <a
                    href={`sms:?body=${encodeURIComponent(product.name + ' — NuraSkin: ' + window.location.href)}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8f7f5] text-[13px] font-light text-stone-700 transition-colors"
                    onClick={() => setShowShare(false)}
                  >
                    <svg className="w-5 h-5 text-[#34C759]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Xabar orqali
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 text-[13px] font-light text-stone-500">
                <Truck className="w-5 h-5 text-[#4A1525]" />
                <span>Tezkor yetkazib berish</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] font-light text-stone-500">
                <ShieldCheck className="w-5 h-5 text-[#4A1525]" />
                <span>100% original kafolati</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="space-y-3">
              {product.ingredients?.length > 0 && (
                <div className="border border-stone-200 rounded-xl overflow-hidden bg-[#f8f7f5]">
                  <button
                    className="w-full flex items-center justify-between p-4 focus:outline-none"
                    onClick={() => toggleSection('ingredients')}
                  >
                    <span className="text-[14px] font-light text-[#4A1525]">Tarkibi</span>
                    {openSection === 'ingredients' ? <Minus className="w-4 h-4 text-[#4A1525]" /> : <Plus className="w-4 h-4 text-stone-400" />}
                  </button>
                  {openSection === 'ingredients' && (
                    <div className="px-4 pb-4 text-[13px] font-light text-stone-500 border-t border-stone-200 pt-3">
                      {product.ingredients.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {product.usage && (
                <div className="border border-stone-200 rounded-xl overflow-hidden bg-[#f8f7f5]">
                  <button
                    className="w-full flex items-center justify-between p-4 focus:outline-none"
                    onClick={() => toggleSection('how-to-use')}
                  >
                    <span className="text-[14px] font-light text-[#4A1525]">Qanday ishlatish kerak</span>
                    {openSection === 'how-to-use' ? <Minus className="w-4 h-4 text-[#4A1525]" /> : <Plus className="w-4 h-4 text-stone-400" />}
                  </button>
                  {openSection === 'how-to-use' && (
                    <div className="px-4 pb-4 text-[13px] font-light text-stone-500 border-t border-stone-200 pt-3">
                      {product.usage}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}