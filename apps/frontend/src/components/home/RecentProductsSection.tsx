import { useState } from 'react';
import { Heart, ShoppingBag, Bell } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useAppStore } from '@/stores/app.store';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  brand: string;
  productType: string;
  price: number;
  currentPriceUZS: number;
  inStock: boolean;
  image: string;
}

const PLACEHOLDER_PRODUCTS: Product[] = [
  {
    id: '1',
    slug: 'seoul-1988-serum',
    name: 'Seoul 1988 Serum: Retinal Liposome 2% + Black Ginseng',
    description: "Bu serum terini yoshartirish va mustahkamlash uchun mo'ljallangan.",
    brand: 'K-Secret',
    productType: 'Serum',
    price: 0,
    currentPriceUZS: 0,
    inStock: false,
    image: '/nsb.png',
  },
  {
    id: '2',
    slug: 'celimax-pore-dark-spot-cream',
    name: "Teshiklar va qora dog'lar uchun yorqinlashtiruvchi krem",
    description: "Bu krem teridagi teshiklarni kamaytirish va qora dog'larni yoritishga yordam beradi.",
    brand: 'Celimax',
    productType: 'Krem',
    price: 14000,
    currentPriceUZS: 14000,
    inStock: true,
    image: '/nsb.png',
  },
  {
    id: '3',
    slug: 'heartleaf-toner-pad',
    name: 'Heartleaf 77 Clear Toner Pad',
    description: 'Terini yumshatish va namlantirishga yordam beradi.',
    brand: 'Anua',
    productType: 'Tonik',
    price: 22000,
    currentPriceUZS: 22000,
    inStock: true,
    image: '/nsb.png',
  },
  {
    id: '4',
    slug: 'ceramide-moisture-gel',
    name: 'Ceramide Intensive Moisture Gel',
    description: "Teriga chuqur namlik beruvchi gel.",
    brand: 'Dr.Jart+',
    productType: 'Gel',
    price: 31000,
    currentPriceUZS: 31000,
    inStock: true,
    image: '/nsb.png',
  },
];

function formatPrice(price: number): string {
  if (price === 0) return "0 so'm";
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
}

export function RecentProductsSection() {
  const { cart, addToCart } = useAppStore();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="bg-white py-14 min-h-[70vh] flex flex-col justify-center">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">

        {/* Section Header */}
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-[22px] md:text-[26px] font-light tracking-wide text-[#4A1525]">
            So&apos;nggi mahsulotlar
          </h2>
          <Link
            to="/products"
            className="text-[12px] font-light text-stone-500 hover:text-[#4A1525] transition-colors tracking-wide"
          >
            Barchasini ko&apos;rish
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {PLACEHOLDER_PRODUCTS.map((product) => {
            const isFav = favorites.has(product.id);

            return (
              <div
                key={product.id}
                className="group flex flex-col bg-[#f8f7f5] rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >

                {/* Image */}
                <Link
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  className="block relative aspect-[4/3] overflow-hidden"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {product.brand && (
                    <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] text-[#4A1525] font-light">
                      {product.brand}
                    </div>
                  )}
                  {product.productType && (
                    <div className="absolute bottom-3 left-3 bg-[#4A1525]/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] text-white font-light">
                      {product.productType}
                    </div>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="bg-white/90 text-red-600 text-[11px] font-medium px-3 py-1 rounded-full">Mavjud emas</span>
                    </div>
                  )}
                  {/* Wishlist button */}
                  <button
                    aria-label="Sevimli"
                    onClick={(e) => toggleFav(product.id, e)}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-colors ${
                      isFav ? 'text-[#4A1525]' : 'text-stone-400 hover:text-[#4A1525]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} strokeWidth={1.5} />
                  </button>
                </Link>

                {/* Info */}
                <div className="flex flex-col flex-1 p-3 pt-2">
                  <Link to="/products/$slug" params={{ slug: product.slug }}>
                    <h3 className="text-[12px] font-light text-[#4A1525] leading-snug mb-1 group-hover:opacity-80 transition-opacity line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-[10px] font-light text-stone-400 leading-relaxed line-clamp-2 mb-2 flex-1">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[12px] font-light text-[#4A1525]">
                      {formatPrice(product.currentPriceUZS)}
                    </span>
                    {!product.inStock ? (
                      <button
                        aria-label="Xabardor qiling"
                        className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 hover:bg-[#4A1525] hover:text-white flex items-center justify-center transition-all duration-200"
                      >
                        <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    ) : (
                      <button
                        aria-label="Savatga qo'shish"
                        onClick={() => addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.currentPriceUZS,
                          image: product.image,
                          slug: product.slug,
                          stock: 100, // placeholder
                        })}
                        className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center border ${
                          cart.some((i) => i.product.id === product.id)
                            ? 'bg-[#4A1525] border-[#4A1525] text-white hover:bg-[#6B2540]'
                            : 'bg-white border-stone-200 text-[#4A1525] hover:border-[#4A1525]'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}