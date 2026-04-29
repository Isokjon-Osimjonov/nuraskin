import { buildCaption } from './apps/server/src/modules/telegram-posts/caption-builder.util';

const mockPost = {
  captionText: 'Test caption',
  showKrwPrice: false,
  showUzsPrice: true,
  promoPriceUzs: null,
  ctaType: 'BUY_NOW',
  telegramUrl: null,
  instagramUrl: null,
  websiteUrl: null,
};

const mockProduct = {
  configs: [
    {
      regionCode: 'UZB',
      retailPrice: 23100000000n, // 231,000 so'm in tiyin
    }
  ]
};

console.log('--- STARTING TEST ---');
const result = buildCaption(mockPost as any, mockProduct as any, null);
console.log('--- RESULT ---');
console.log(result);
