import type { TelegramPost } from '@nuraskin/database';
import { calculateUzbPrice } from '../../common/utils/pricing';

export function buildCaption(
  post: TelegramPost,
  product: any,
  rate: any, // Exchange rate snapshot
): string {
  let caption = post.captionText;

  caption += '\n\n━━━━━━━━━━━━━━━━━━━\n\n';

  let hasPrice = false;
  const krwBlock: string[] = [];
  const uzsBlock: string[] = [];

  if (product && product.configs) {
    const korConfig = product.configs.find((c: any) => c.regionCode === 'KOR');

    if (korConfig) {
      if (post.showKrwRetail) {
        const formattedKrwRetail = new Intl.NumberFormat('en-US').format(
          Number(BigInt(korConfig.retailPrice)),
        );
        krwBlock.push(`🇰🇷 Narx: ₩${formattedKrwRetail} / dona`);
      }

      if (post.showKrwWholesale) {
        const formattedKrwWholesale = new Intl.NumberFormat('en-US').format(
          Number(BigInt(korConfig.wholesalePrice)),
        );
        krwBlock.push(
          `🇰🇷 Narx: ₩${formattedKrwWholesale} dan — ${korConfig.minWholesaleQty || 5} tadan`,
        );
      }
    }

    const uzbConfig = product.configs.find((c: any) => c.regionCode === 'UZB');
    if (uzbConfig && rate) {
      const weightGrams = product.weightGrams || 0;

      // Retail UZS
      if (post.showUzsRetail) {
        const retailKrw = BigInt(uzbConfig.retailPrice);
        const retailPrices = calculateUzbPrice(retailKrw, weightGrams, rate);
        const retailUzs = retailPrices.productPrice + retailPrices.cargoFee;
        const formattedUzsRetail = new Intl.NumberFormat('en-US').format(
          Number(retailUzs) / 100,
        );
        uzsBlock.push(`🇺🇿 Narx: ${formattedUzsRetail} so'm / dona`);
      }

      // Wholesale UZS
      if (post.showUzsWholesale) {
        const wholesaleKrw = BigInt(uzbConfig.wholesalePrice);
        const wholesalePrices = calculateUzbPrice(
          wholesaleKrw,
          weightGrams,
          rate,
        );
        const wholesaleUzs =
          wholesalePrices.productPrice + wholesalePrices.cargoFee;
        const formattedUzsWholesale = new Intl.NumberFormat('en-US').format(
          Number(wholesaleUzs) / 100,
        );
        uzsBlock.push(
          `🇺🇿 Narx: ${formattedUzsWholesale} so'm dan — ${uzbConfig.minWholesaleQty || 5} tadan`,
        );
      }
    }
  }

  const blocks: string[] = [];
  if (krwBlock.length > 0) blocks.push(krwBlock.join('\n'));
  if (uzsBlock.length > 0) blocks.push(uzsBlock.join('\n'));

  if (blocks.length > 0) {
    caption += blocks.join('\n\n') + '\n\n';
    hasPrice = true;
  }

  if (hasPrice) {
    caption += `🚚 O'zbekistonga yetkazib berish narxi ham ichida\n`;
  }

  caption += '\n━━━━━━━━━━━━━━━━━━━\n\n';

  // CTA
  if (post.showCta && post.ctaText && post.ctaUrl) {
    caption += `💬 <a href="${post.ctaUrl}">${post.ctaText}</a>\n\n`;
  }

  if (post.showAdminPhone && post.adminPhone) {
    caption += `📞 ${post.adminPhone}\n\n`;
  }

  // Links
  const links = [
    post.link1Show && post.link1Text && post.link1Url
      ? `<a href="${post.link1Url}">${post.link1Text}</a>`
      : null,
    post.link2Show && post.link2Text && post.link2Url
      ? `<a href="${post.link2Url}">${post.link2Text}</a>`
      : null,
    post.link3Show && post.link3Text && post.link3Url
      ? `<a href="${post.link3Url}">${post.link3Text}</a>`
      : null,
  ].filter(Boolean);

  if (links.length > 0) {
    caption += links.join('  |  ');
  }

  return caption.trim();
}
