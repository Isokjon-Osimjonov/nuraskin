export function buildCaptionPreview(
  form: any,
  product: any,
  rate: any, // Exchange rate snapshot
): string {
  let caption = form.captionText || '';

  caption += '\n\n━━━━━━━━━━━━━━━━━━━\n\n';

  let hasPrice = false;
  const krwBlock: string[] = [];
  const uzsBlock: string[] = [];

  if (product && product.regionalConfigs) {
    const korConfig = product.regionalConfigs.find(
      (c: any) => c.regionCode === 'KOR',
    );

    if (korConfig) {
      if (form.showKrwRetail) {
        const formattedKrwRetail = new Intl.NumberFormat('en-US').format(
          Number(BigInt(korConfig.retailPrice)),
        );
        krwBlock.push(`🇰🇷 Narx: ₩${formattedKrwRetail} / dona`);
      }

      if (form.showKrwWholesale) {
        const formattedKrwWholesale = new Intl.NumberFormat('en-US').format(
          Number(BigInt(korConfig.wholesalePrice)),
        );
        krwBlock.push(
          `🇰🇷 Narx: ₩${formattedKrwWholesale} dan — ${korConfig.minWholesaleQty || 5} tadan`,
        );
      }
    }

    const uzbConfig = product.regionalConfigs.find(
      (c: any) => c.regionCode === 'UZB',
    );
    if (uzbConfig && rate) {
      const weightGrams = product.weightGrams || 0;

      const krwToUzs = BigInt(rate.krwToUzs);
      const cargoRateKrw = BigInt(rate.cargoRateKrwPerKg);

      const round1000UZS = (val: bigint) =>
        (val / 100000n) * 100000n + (val % 100000n >= 50000n ? 100000n : 0n);

      // Retail UZS
      if (form.showUzsRetail) {
        const retailKrw = BigInt(uzbConfig.retailPrice);
        const retailProductUzsMinor = retailKrw * krwToUzs * 100n;
        const retailCargoUzsMinor =
          (BigInt(weightGrams) * cargoRateKrw * krwToUzs * 100n) / 1000n;
        const retailUzs =
          round1000UZS(retailProductUzsMinor) +
          round1000UZS(retailCargoUzsMinor);
        const formattedUzsRetail = new Intl.NumberFormat('en-US').format(
          Number(retailUzs) / 100,
        );
        uzsBlock.push(`🇺🇿 Narx: ${formattedUzsRetail} so'm / dona`);
      }

      // Wholesale UZS
      if (form.showUzsWholesale) {
        const wholesaleKrw = BigInt(uzbConfig.wholesalePrice);
        const wholesaleProductUzsMinor = wholesaleKrw * krwToUzs * 100n;
        const wholesaleCargoUzsMinor =
          (BigInt(weightGrams) * cargoRateKrw * krwToUzs * 100n) / 1000n;
        const wholesaleUzs =
          round1000UZS(wholesaleProductUzsMinor) +
          round1000UZS(wholesaleCargoUzsMinor);
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
  if (form.showCta && form.ctaText && form.ctaUrl) {
    caption += `💬 <a href="${form.ctaUrl}">${form.ctaText}</a>\n\n`;
  }

  if (form.showAdminPhone && form.adminPhone) {
    caption += `📞 ${form.adminPhone}\n\n`;
  }

  // Links
  const links = [
    form.link1Show && form.link1Text && form.link1Url
      ? `<a href="${form.link1Url}">${form.link1Text}</a>`
      : null,
    form.link2Show && form.link2Text && form.link2Url
      ? `<a href="${form.link2Url}">${form.link2Text}</a>`
      : null,
    form.link3Show && form.link3Text && form.link3Url
      ? `<a href="${form.link3Url}">${form.link3Text}</a>`
      : null,
  ].filter(Boolean);

  if (links.length > 0) {
    caption += links.join('  |  ');
  }

  return caption.trim();
}
