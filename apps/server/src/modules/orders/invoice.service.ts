import { formatPrice } from '@nuraskin/shared-types';
import { format } from 'date-fns';
import { STORE_INFO } from '@nuraskin/shared-utils';

interface InvoiceData {
  orderId: string;
  orderNumber: string;
  createdAt: Date;
  deliveryAddress: string;
  subtotal: string | bigint | number;
  cargoFee: string | bigint | number;
  deliveryFeeCharged: string | bigint | number;
  boxFeeUzs?: string | bigint | number;
  totalAmount: string | bigint | number;
  couponCode?: string | null;
  couponDiscount?: string | bigint | number;
  wholesaleDiscount?: string | bigint | number;
  regionCode: 'UZB' | 'KOR';
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    brandName: string;
    barcode: string;
    quantity: number;
    unitPrice: string | bigint | number;
    subtotal: string | bigint | number;
    retailPrice?: string | bigint | number;
    wholesalePrice?: string | bigint | number;
    priceType?: 'ulgurji' | 'birlik' | 'kelishilgan';
  }>;
  savings?: number;
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const region = data.regionCode;
  const dateStr = format(data.createdAt, 'dd MMM yyyy, HH:mm');

  const itemsHtml = data.items
    .map(
      item => `
    <tr style="border-bottom: 0.5px solid #eee;">
      <td style="padding: 8px; text-align: left;">
        <div style="font-size: 12px; font-weight: 500; color: #000;">${item.name}</div>
        <div style="font-size: 10px; color: #888;">${item.brandName} • ${item.barcode}</div>
      </td>
      <td style="padding: 8px; text-align: center; font-size: 12px;">${item.quantity}</td>
      <td style="padding: 8px; text-align: right; font-size: 12px;">
        ${
          item.retailPrice && BigInt(item.retailPrice) > BigInt(item.unitPrice)
            ? `<div style="font-size: 10px; color: #888; text-decoration: line-through;">${formatPrice(item.retailPrice, region)}</div>`
            : ''
        }
        <div>${formatPrice(item.unitPrice, region)}</div>
        ${item.priceType === 'ulgurji' ? `<div style="font-size: 9px; color: #16a34a; font-weight: 500;">(ulgurji)</div>` : ''}
      </td>
      <td style="padding: 8px; text-align: right; font-size: 12px; font-weight: 500;">${formatPrice(item.subtotal, region)}</td>
    </tr>
  `
    )
    .join('');

  const totalDelivery = Number(data.cargoFee) + Number(data.deliveryFeeCharged);

  const retailSum = data.items.reduce((acc, item) => {
    const retail = item.retailPrice ? BigInt(item.retailPrice) : BigInt(item.unitPrice);
    return acc + retail * BigInt(item.quantity);
  }, 0n);

  const wholesaleSavings = retailSum - BigInt(data.subtotal);
  const totalTejadingiz = wholesaleSavings + BigInt(data.couponDiscount || 0);

  return `
<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${data.orderNumber}</title>
    <style>
        * { box-sizing: border-box; }
        
        body {
          margin: 0;
          padding: 0;
          background: #f0f0f0;
          font-family: system-ui, -apple-system, sans-serif;
          color: #333;
          line-height: 1.4;
        }

        .invoice-page {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          background: white;
          padding: 15mm 20mm;
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        @media print {
            @page {
              size: A4 portrait;
              margin: 15mm 20mm;
            }
            body { 
              background: #fff; 
              padding: 0; 
            }
            .invoice-page { 
              box-shadow: none; 
              margin: 0;
              width: 100%;
              min-height: auto;
              padding: 0;
            }
            .no-print { 
              display: none !important; 
            }
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
            }
        }

        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
        .header-left div:first-child { font-size: 12px; font-weight: 500; }
        .header-left div:last-child { font-size: 10px; color: #888; }
        .header-right { text-align: right; }
        .header-right div:first-child { font-size: 12px; font-weight: 500; }
        .header-right div:nth-child(2), .header-right div:last-child { font-size: 10px; color: #888; }

        .customer-delivery { display: flex; justify-content: space-between; padding: 10px 0; margin-bottom: 20px; }
        .section-label { font-size: 9px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
        .customer-name { font-size: 12px; font-weight: 500; margin-bottom: 2px; }
        .customer-detail { font-size: 10px; color: #888; }
        .delivery-address { font-size: 10px; color: #888; max-width: 200px; text-align: right; }

        .products-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .products-table thead { background: #f8f8f8; }
        .products-table th { font-size: 9px; color: #888; text-transform: uppercase; padding: 6px 8px; font-weight: 500; border-top: 0.5px solid #e0e0e0; border-bottom: 0.5px solid #e0e0e0; }
        
        .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; margin-top: 10px; padding-right: 8px; }
        .total-row { display: flex; justify-content: space-between; width: 220px; font-size: 11px; }
        .total-row.main { font-size: 12px; font-weight: 500; padding-top: 8px; border-top: 0.5px solid #e0e0e0; margin-top: 4px; }
        .savings { color: #16a34a; }

        .footer { margin-top: auto; border-top: 0.5px solid #e0e0e0; padding-top: 15px; display: flex; justify-content: space-between; }
        .footer-col div:first-child { font-size: 11px; font-weight: 500; margin-bottom: 4px; }
        .footer-detail { font-size: 10px; color: #888; margin-bottom: 2px; }
        .footer-thanks { font-size: 10px; color: #888; font-style: italic; text-align: center; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="no-print" style="text-align:center; padding: 16px 0 20px; display:flex; gap:8px; justify-content:center;">
      <button 
        id="print-btn"
        style="padding:8px 20px; font-size:12px; font-weight:500; cursor:pointer; border:1px solid #333; background:#333; color:#fff; border-radius:4px;">
        Chop etish (Print)
      </button>
      <button 
        id="download-btn"
        style="padding:8px 20px; font-size:12px; font-weight:500; cursor:pointer; border:1px solid #555; background:#fff; color:#333; border-radius:4px;">
        Yuklab olish (PDF)
      </button>
    </div>

    <div class="invoice-page">
        <div class="header">
            <div class="header-left">
                <div>NuraSkin</div>
                <div>nuraskin.uz</div>
            </div>
            <div class="header-right">
                <div>Hisob-faktura</div>
                <div>№ ${data.orderNumber}</div>
                <div>${dateStr}</div>
            </div>
        </div>

        <div style="border-bottom: 0.5px solid #e0e0e0;"></div>

        <div class="customer-delivery">
            <div>
                <div class="section-label">MIJOZ</div>
                <div class="customer-name">${data.customerName}</div>
                <div class="customer-detail">${data.customerPhone}</div>
                <div class="customer-detail">${region === 'KOR' ? 'Koreya' : "O'zbekiston"}</div>
            </div>
            <div style="text-align: right;">
                <div class="section-label">YETKAZIB BERISH</div>
                <div class="delivery-address">${data.deliveryAddress}</div>
            </div>
        </div>

        <div style="border-bottom: 0.5px solid #e0e0e0; margin-bottom: 20px;"></div>

        <table class="products-table">
            <thead>
                <tr>
                    <th style="text-align: left;">MAHSULOT</th>
                    <th style="text-align: center; width: 60px;">MIQDOR</th>
                    <th style="text-align: right; width: 100px;">NARX</th>
                    <th style="text-align: right; width: 100px;">JAMI</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <span>Chakana jami</span>
                <span>${formatPrice(retailSum, region)}</span>
            </div>
            
            ${
              wholesaleSavings > 0n
                ? `
            <div class="total-row savings">
                <span>Ulgurji chegirma</span>
                <span>-${formatPrice(wholesaleSavings, region)}</span>
            </div>`
                : ''
            }

            <div class="total-row">
                <span>Mahsulotlar jami</span>
                <span>${formatPrice(data.subtotal, region)}</span>
            </div>
            
            ${
              data.couponCode && Number(data.couponDiscount) > 0
                ? `
            <div class="total-row savings">
                <span>Kupon (${data.couponCode})</span>
                <span>-${formatPrice(data.couponDiscount!, region)}</span>
            </div>`
                : ''
            }

            ${
              region === 'KOR'
                ? `
            <div class="total-row">
                <span>Yetkazib berish</span>
                <span>${formatPrice(data.cargoFee, region)}</span>
            </div>`
                : ''
            }

            ${
              region === 'UZB' && data.boxFeeUzs && BigInt(data.boxFeeUzs) > 0n
                ? `
            <div class="total-row">
                <span>Quticha narxi</span>
                <span>${formatPrice(data.boxFeeUzs, region)}</span>
            </div>`
                : ''
            }

            ${
              Number(data.deliveryFeeCharged) > 0
                ? `
            <div class="total-row">
                <span>Yetkazib berish (ichki)</span>
                <span>${formatPrice(data.deliveryFeeCharged, region)}</span>
            </div>`
                : ''
            }

            <div class="total-row main">
                <span>JAMI</span>
                <span>${formatPrice(data.totalAmount, region)}</span>
            </div>

            ${
              totalTejadingiz > 0n
                ? `
            <div class="total-row savings" style="font-weight: 500; border-top: 0.5px dashed #16a34a; padding-top: 4px; margin-top: 4px;">
                <span>Tejadingiz:</span>
                <span>${formatPrice(totalTejadingiz, region)}</span>
            </div>`
                : ''
            }
        </div>

        <div class="footer">
            <div class="footer-col">
                <div class="footer-detail">${STORE_INFO.NAME}</div>
                <div class="footer-detail">${STORE_INFO.ADDRESS.UZ}</div>
                <div class="footer-detail">${STORE_INFO.PHONES.map(p => p.label).join(' / ')}</div>
            </div>
            <div class="footer-col" style="text-align: right;">
                <div class="footer-detail">${STORE_INFO.SOCIAL.TELEGRAM.label}</div>
                <div class="footer-detail">${STORE_INFO.SOCIAL.INSTAGRAM.label}</div>
            </div>
        </div>
        <div class="footer-thanks">Xaridingiz uchun rahmat!</div>
    </div>

    <script>
      document.getElementById('print-btn').addEventListener('click', function() {
        window.print();
      });
      document.getElementById('download-btn').addEventListener('click', function() {
        window.print();
      });
    </script>
</body>
</html>
  `;
}
