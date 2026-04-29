import { format } from 'date-fns';
import * as ordersRepository from './orders.repository';
import { db, exchangeRateSnapshots } from '@nuraskin/database';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../../common/errors/AppError';

export async function generateOrderReceipt(orderId: string): Promise<string> {
  const order = await ordersRepository.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');

  let rateSnapshot = null;
  if (order.rateSnapshotId) {
    [rateSnapshot] = await db
      .select()
      .from(exchangeRateSnapshots)
      .where(eq(exchangeRateSnapshots.id, order.rateSnapshotId))
      .limit(1);
  }

  const subtotal = Number(BigInt(order.subtotal)) / 100;
  const cargoFee = Number(BigInt(order.cargoFee)) / 100;
  const totalAmount = Number(BigInt(order.totalAmount)) / 100;

  const itemsHtml = order.items
    .map((item, index) => {
      const itemPrice = Number(BigInt(item.unitPriceSnapshot)) / 100;
      const itemSubtotal = Number(BigInt(item.subtotalSnapshot)) / 100;
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${item.productName}</td>
        <td>${item.barcode}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${itemPrice.toLocaleString()}</td>
        <td style="text-align: right;">${itemSubtotal.toLocaleString()}</td>
      </tr>
    `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="uz">
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${order.orderNumber}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #444; }
        .title { font-size: 24px; font-weight: bold; text-align: right; }
        .info-section { display: flex; justify-content: space-between; margin-top: 30px; }
        .customer-info h3 { margin: 0 0 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 40px; }
        th { background: #f8f9fa; text-align: left; padding: 12px; border-bottom: 2px solid #eee; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 30px; display: flex; flex-direction: column; align-items: flex-end; }
        .total-row { display: flex; justify-content: space-between; width: 300px; padding: 5px 0; }
        .grand-total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 20px; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="left">
          <div class="logo">NuraSkin</div>
          <div>Korean Cosmetics in Uzbekistan</div>
        </div>
        <div class="right">
          <div class="title">CHEK / RECEIPT</div>
          <div>Order #: ${order.orderNumber}</div>
        </div>
      </div>

      <div class="info-section">
        <div class="customer-info">
          <p style="margin-bottom: 5px; color: #777;">Mijoz / Customer:</p>
          <h3>${order.customerName}</h3>
          <div>Region: ${order.regionCode}</div>
        </div>
        <div class="order-info" style="text-align: right;">
          <p style="margin-bottom: 5px; color: #777;">Sana / Date:</p>
          <div>${format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Mahsulot nomi / Product</th>
            <th>Barkod</th>
            <th style="text-align: center;">Miqdor</th>
            <th style="text-align: right;">Narx</th>
            <th style="text-align: right;">Jami</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div style="margin-right: auto; color: #777; font-size: 14px;">
          Umumiy og'irlik / Total weight: ${(order.totalWeightGrams / 1000).toFixed(2)} kg
        </div>
        <div class="total-row">
          <span>Jami mahsulotlar:</span>
          <span>${subtotal.toLocaleString()} ${order.currency}</span>
        </div>
        <div class="total-row">
          <span>Yetkazib berish (Cargo):</span>
          <span>${cargoFee.toLocaleString()} ${order.currency}</span>
        </div>
        <div class="total-row grand-total">
          <span>UMUMIY SUMMA:</span>
          <span>${totalAmount.toLocaleString()} ${order.currency}</span>
        </div>
      </div>

      <div class="footer">
        <div style="display: flex; justify-content: space-between;">
          <div>
            ${rateSnapshot ? `<div>Kurs / Rate: 1 KRW = ${Number(rateSnapshot.krwToUzs).toLocaleString()} UZS</div>` : ''}
            <div>Yaratildi / Generated: ${format(new Date(), 'dd.MM.yyyy HH:mm:ss')}</div>
          </div>
          <div style="text-align: right;">
            nuraskin.com
          </div>
        </div>
      </div>

      <div class="no-print" style="margin-top: 40px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Chop etish (Print)</button>
      </div>
    </body>
    </html>
  `;
}
