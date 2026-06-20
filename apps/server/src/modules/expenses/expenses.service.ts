import * as repository from './expenses.repository';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/AppError';
import type { CreateExpenseInput, UpdateExpenseInput } from '@nuraskin/shared-types';
import ExcelJS from 'exceljs';

export async function createExpense(input: CreateExpenseInput, adminId: string) {
  return await repository.create({
    category: input.category,
    amountKrw: BigInt(input.amountKrw),
    description: input.description,
    expenseDate: input.expenseDate,
    receiptUrl: input.receiptUrl || null,
    createdBy: adminId,
  });
}

export async function updateExpense(
  id: string,
  input: UpdateExpenseInput,
  adminId: string,
  isAdminSuper: boolean
) {
  const expense = await repository.findById(id);
  if (!expense) throw new NotFoundError('Expense not found');

  if (expense.createdBy !== adminId && !isAdminSuper) {
    throw new ForbiddenError('Only the creator or SUPER_ADMIN can edit this expense');
  }

  const updateData: any = {};
  if (input.category) updateData.category = input.category;
  if (input.amountKrw !== undefined) updateData.amountKrw = BigInt(input.amountKrw);
  if (input.description) updateData.description = input.description;
  if (input.expenseDate) updateData.expenseDate = input.expenseDate;
  if (input.receiptUrl !== undefined) updateData.receiptUrl = input.receiptUrl || null;

  return await repository.update(id, updateData);
}

export async function deleteExpense(id: string, adminId: string, isAdminSuper: boolean) {
  const expense = await repository.findById(id);
  if (!expense) throw new NotFoundError('Expense not found');

  if (expense.createdBy !== adminId && !isAdminSuper) {
    throw new ForbiddenError('Only the creator or SUPER_ADMIN can delete this expense');
  }

  await repository.deleteById(id);
  return { success: true };
}

export async function listExpenses(month: string, category?: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new BadRequestError('Month must be in YYYY-MM format');
  }
  return await repository.findAll(month, category);
}

export async function getMonthlyExpenseSummary(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new BadRequestError('Month must be in YYYY-MM format');
  }

  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = new Date(Number(year), Number(monthNum), 0).toISOString().split('T')[0];

  const standaloneRows = await repository.getStandaloneSummary(startDate, endDate);
  const orderRows = await repository.getOrderExpensesSummary(startDate, endDate);

  const byCategory = {
    PACKAGING: 0n,
    PLATFORM_FEE: 0n,
    SUPPLIES: 0n,
    WAGES: 0n,
    OTHER: 0n,
  };

  let totalStandaloneKrw = 0n;
  for (const row of standaloneRows) {
    const amount = BigInt(row.total);
    if (row.category in byCategory) {
      byCategory[row.category as keyof typeof byCategory] = amount;
    }
    totalStandaloneKrw += amount;
  }

  const orderExpensesByType = {
    SHIPPING: 0n,
    FREE_SHIPPING_SUBSIDY: 0n,
    CARGO_OVERAGE: 0n,
    OTHER: 0n,
  };

  let totalOrderKrw = 0n;
  for (const row of orderRows) {
    const amount = BigInt(row.total);
    if (row.type in orderExpensesByType) {
      orderExpensesByType[row.type as keyof typeof orderExpensesByType] = amount;
    }
    totalOrderKrw += amount;
  }

  return {
    byCategory: {
      PACKAGING: byCategory.PACKAGING.toString(),
      PLATFORM_FEE: byCategory.PLATFORM_FEE.toString(),
      SUPPLIES: byCategory.SUPPLIES.toString(),
      WAGES: byCategory.WAGES.toString(),
      OTHER: byCategory.OTHER.toString(),
    },
    orderExpensesByType: {
      SHIPPING: orderExpensesByType.SHIPPING.toString(),
      FREE_SHIPPING_SUBSIDY: orderExpensesByType.FREE_SHIPPING_SUBSIDY.toString(),
      CARGO_OVERAGE: orderExpensesByType.CARGO_OVERAGE.toString(),
      OTHER: orderExpensesByType.OTHER.toString(),
    },
    totalStandaloneKrw: totalStandaloneKrw.toString(),
    totalOrderLinkedKrw: totalOrderKrw.toString(),
    grandTotalKrw: (totalStandaloneKrw + totalOrderKrw).toString(),
  };
}

export async function getAccountingSummary(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new BadRequestError('Month must be in YYYY-MM format');
  }

  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = new Date(Number(year), Number(monthNum), 0).toISOString().split('T')[0];

  const ordersRows = await repository.getAccountingOrders(startDate, endDate);
  const expensesSummary = await getMonthlyExpenseSummary(month);
  const inventoryRows = await repository.getInventoryValuation();
  const debtRow = await repository.getOutstandingDebt();

  let korRevenue = 0n;
  let uzbRevenue = 0n;
  let korDiscounts = 0n;
  let uzbDiscounts = 0n;
  let totalCogs = 0n;
  let totalCargo = 0n;

  for (const row of ordersRows) {
    if (row.regionCode === 'KOR') {
      korRevenue += BigInt(row.totalAmount);
      korDiscounts += BigInt(row.discountAmountKrw || 0n);
    } else {
      uzbRevenue += BigInt(row.totalAmount);
      uzbDiscounts += BigInt(row.discountAmountKrw || 0n);
    }

    totalCogs += BigInt(row.cogs);
    totalCargo += BigInt(row.cargoCostKrw);
  }

  const netRevenue = korRevenue + uzbRevenue;
  const totalDiscounts = korDiscounts + uzbDiscounts;
  const grossRevenue = netRevenue + totalDiscounts;

  const shippingExpense = BigInt(expensesSummary.orderExpensesByType.SHIPPING);
  const grossProfit = netRevenue - totalCogs - shippingExpense;
  const grossMarginPercent =
    netRevenue > 0n ? Number((grossProfit * 10000n) / netRevenue) / 100 : 0;

  // Standalone expenses + other order-linked expenses (excluding SHIPPING which is already in grossProfit)
  const otherExpenses = BigInt(expensesSummary.grandTotalKrw) - shippingExpense;
  const netProfit = grossProfit - otherExpenses;
  const netMarginPercent = netRevenue > 0n ? Number((netProfit * 10000n) / netRevenue) / 100 : 0;

  let inventoryTotalValue = 0n;
  const inventoryItems = inventoryRows.map(row => {
    inventoryTotalValue += BigInt(row.totalValueKrw);
    return {
      product_id: row.productId,
      product_name: row.productName,
      units_on_hand: row.unitsOnHand,
      cost_per_unit_krw: row.costPerUnitKrw.toString(),
      total_value_krw: row.totalValueKrw.toString(),
    };
  });

  return {
    period: month,
    revenue: {
      kor_krw: korRevenue.toString(),
      uzb_krw: uzbRevenue.toString(),
      total_krw: netRevenue.toString(),
    },
    gross_revenue: {
      kor_krw: (korRevenue + korDiscounts).toString(),
      uzb_krw: (uzbRevenue + uzbDiscounts).toString(),
      total_krw: grossRevenue.toString(),
    },
    coupon_discounts: {
      kor_krw: korDiscounts.toString(),
      uzb_krw: uzbDiscounts.toString(),
      total_krw: totalDiscounts.toString(),
    },
    cogs: {
      total_krw: totalCogs.toString(),
    },
    cargo: {
      collected_krw: totalCargo.toString(),
      paid_krw: shippingExpense.toString(),
    },
    gross_profit: {
      total_krw: grossProfit.toString(),
      margin_percent: grossMarginPercent,
    },
    expenses: {
      by_category: expensesSummary.byCategory,
      order_linked: expensesSummary.orderExpensesByType,
      total_standalone_krw: expensesSummary.totalStandaloneKrw,
      total_order_linked_krw: expensesSummary.totalOrderLinkedKrw,
      grand_total_krw: expensesSummary.grandTotalKrw,
    },
    net_profit: {
      total_krw: netProfit.toString(),
      margin_percent: netMarginPercent,
    },
    inventory: {
      items: inventoryItems,
      grand_total_krw: inventoryTotalValue.toString(),
    },
    outstanding_debt: {
      total_krw: debtRow.totalKrw.toString(),
      customer_count: debtRow.customerCount,
    },
  };
}

export async function exportAccountingToExcel(month: string) {
  const summary = await getAccountingSummary(month);
  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = new Date(Number(year), Number(monthNum), 0).toISOString().split('T')[0];

  const orders = await repository.getAccountingOrders(startDate, endDate);
  const standaloneExpenses = await repository.getAllExpensesForMonth(startDate, endDate);
  const orderExpenses = await repository.getOrderExpensesForMonth(startDate, endDate);
  const couponSummary = await repository.getCouponSummary(startDate, endDate);

  const workbook = new ExcelJS.Workbook();

  // SHEET 1 - Buyurtmalar (Orders)
  const transSheet = workbook.addWorksheet('Buyurtmalar');
  transSheet.columns = [
    { header: 'Order#', key: 'orderNumber', width: 20 },
    { header: 'Sana', key: 'createdAt', width: 20 },
    { header: 'Mijoz', key: 'customerName', width: 30 },
    { header: 'Holat', key: 'status', width: 15 },
    { header: 'Region', key: 'regionCode', width: 10 },
    { header: 'Mahsulot', key: 'products', width: 30 },
    { header: 'Miqdor', key: 'quantity', width: 10 },
    { header: 'Jami', key: 'totalAmount', width: 15 },
    { header: 'COGS', key: 'cogs', width: 15 },
    { header: 'Yetkazish narxi', key: 'cargo', width: 15 },
    { header: 'Kupon chegirma', key: 'couponDiscount', width: 15 },
  ];

  orders.forEach(o => {
    transSheet.addRow({
      orderNumber: o.orderNumber,
      createdAt: o.createdAt.toISOString(),
      customerName: o.customerName,
      status: o.status,
      regionCode: o.regionCode,
      products: "Batafsil ma'lumot order items da", // Placeholder unless order items are fetched
      quantity: 1, // Placeholder
      totalAmount: Number(o.totalAmount),
      cogs: Number(o.cogs),
      cargo: Number(o.cargoCostKrw),
      couponDiscount: Number(o.discountAmountKrw),
    });
  });

  // SHEET 2 - Daromad xulosasi (Revenue summary)
  const plSheet = workbook.addWorksheet('Daromad xulosasi');
  plSheet.columns = [
    { header: "Ko'rsatkich", key: 'label', width: 30 },
    { header: 'Summa ₩', key: 'value', width: 20 },
    { header: 'Marja %', key: 'margin', width: 15 },
  ];

  plSheet.addRow({
    label: 'Koreya savdosi (brutto)',
    value: Number(summary.gross_revenue.kor_krw),
  });
  plSheet.addRow({
    label: "O'zbekiston savdosi (brutto)",
    value: Number(summary.gross_revenue.uzb_krw),
  });
  plSheet.addRow({
    label: 'Kupon chegirmalari',
    value: -Number(summary.coupon_discounts.total_krw),
  });
  plSheet.addRow({ label: 'Jami netto daromad', value: Number(summary.revenue.total_krw) });
  plSheet.addRow({ label: 'COGS', value: -Number(summary.cogs.total_krw) });
  plSheet.addRow({ label: 'Yetkazib berish', value: -Number(summary.cargo.collected_krw) });
  plSheet.addRow({
    label: 'Yalpi foyda',
    value: Number(summary.gross_profit.total_krw),
    margin: summary.gross_profit.margin_percent + '%',
  });
  plSheet.addRow({ label: 'Marja %', value: summary.gross_profit.margin_percent + '%' });

  // Formatting
  [4, 7].forEach(idx => {
    plSheet.getRow(idx).font = { bold: true };
  });

  // SHEET 3 - Xarajatlar (Expenses)
  const expSheet = workbook.addWorksheet('Xarajatlar');
  expSheet.columns = [
    { header: 'Sana', key: 'date', width: 15 },
    { header: 'Tur', key: 'category', width: 20 },
    { header: 'Tavsif', key: 'description', width: 40 },
    { header: 'Summa (₩)', key: 'amount', width: 15 },
  ];

  standaloneExpenses.forEach(e => {
    expSheet.addRow({
      date: e.expenseDate,
      category: e.category,
      description: e.description,
      amount: Number(e.amountKrw),
    });
  });

  // SHEET 4 - Kupon hisoboti (Coupon report)
  const couponSheet = workbook.addWorksheet('Kupon hisoboti');
  couponSheet.columns = [
    { header: 'Kod', key: 'code', width: 15 },
    { header: 'Nomi', key: 'name', width: 30 },
    { header: 'Ishlatilgan', key: 'usageCount', width: 15 },
    { header: 'Jami chegirma (₩)', key: 'totalDiscountKrw', width: 20 },
  ];

  couponSummary.forEach(c => {
    couponSheet.addRow({
      code: c.code,
      name: c.name,
      usageCount: c.usageCount,
      totalDiscountKrw: Number(c.totalDiscountKrw),
    });
  });

  return await workbook.xlsx.writeBuffer();
}

export async function getCouponSummary(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    throw new BadRequestError('startDate and endDate are required');
  }
  return await repository.getCouponSummary(startDate, endDate);
}
