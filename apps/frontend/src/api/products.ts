export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  currentPriceUZS: number;
  images: string[];
  totalStock: number;
  inStock: boolean;
  brand?: string;
  skinTypes: string[];
  benefits: string[];
  productType?: string;
  ingredients: string[];
  usage?: string;
  category?: { name: string; slug: string } | string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    _id: 'p-1',
    name: 'NuraSkin Hydrating Serum',
    slug: 'nuraskin-hydrating-serum',
    description: 'Terini chuqur namlantiruvchi va oziqlantiruvchi zardob',
    currentPriceUZS: 120000,
    images: ['/nsb.png'],
    totalStock: 50,
    inStock: true,
    brand: 'NuraSkin',
    skinTypes: ['Quruq', 'Aralash'],
    benefits: ['Namlantiruvchi', 'Oziqlantiruvchi'],
    productType: 'Zardob',
    ingredients: ['Water', 'Glycerin', 'Hyaluronic Acid'],
    usage: 'Toza yuzga kuniga 2 marta surting.',
    category: { name: 'Yuz parvarishi', slug: 'yuz-parvarishi' }
  },
  {
    _id: 'p-2',
    name: 'NuraSkin Sunscreen SPF 50',
    slug: 'nuraskin-sunscreen-spf-50',
    description: 'Quyoshdan ishonchli himoya qiluvchi engil krem',
    currentPriceUZS: 150000,
    images: ['/nsb.png'],
    totalStock: 20,
    inStock: true,
    brand: 'NuraSkin',
    skinTypes: ['Barcha turlar', 'Ta\'sirchan'],
    benefits: ['Himoya', 'Yengil'],
    productType: 'Quyoshdan himoya',
    ingredients: ['Water', 'Zinc Oxide', 'Titanium Dioxide'],
    usage: 'Quyoshga chiqishdan 15 daqiqa oldin surting.',
    category: { name: 'Quyoshdan himoya', slug: 'quyoshdan-himoya' }
  }
];

export async function getProducts(_params?: Record<string, unknown>) {
  return {
    data: MOCK_PRODUCTS
  };
}

export async function getProductBySlug(slug: string) {
  const product = MOCK_PRODUCTS.find(p => p.slug === slug);
  return {
    data: product || null
  };
}