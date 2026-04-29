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

export async function updateExpense(id: string, input: UpdateExpenseInput, adminId: string, isAdminSuper: boolean) {
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
  let totalCogs = 0n;
  let totalCargo = 0n;

  for (const row of ordersRows) {
    if (row.regionCode === 'KOR') korRevenue += BigInt(row.totalAmount);
    else uzbRevenue += BigInt(row.totalAmount);
    
    totalCogs += BigInt(row.cogs);
    totalCargo += BigInt(row.cargoCostKrw);
  }

  const totalRevenue = korRevenue + uzbRevenue;
  const grossProfit = totalRevenue - totalCogs - totalCargo;
  const grossMarginPercent = totalRevenue > 0n ? Number(grossProfit * 10000n / totalRevenue) / 100 : 0;

  const grandTotalExpenses = BigInt(expensesSummary.grandTotalKrw);
  const netProfit = grossProfit - grandTotalExpenses;
  const netMarginPercent = totalRevenue > 0n ? Number(netProfit * 10000n / totalRevenue) / 100 : 0;

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
      total_krw: totalRevenue.toString(),
    },
    cogs: {
      total_krw: totalCogs.toString(),
    },
    cargo: {
      total_krw: totalCargo.toString(),
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

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: P&L
  const plSheet = workbook.addWorksheet('P&L Hisoboti');
  plSheet.columns = [
    { header: 'Ko\'rsatkich', key: 'label', width: 30 },
    { header: 'Summa ₩', key: 'value', width: 20 },
    { header: 'Marja %', key: 'margin', width: 15 },
  ];

  plSheet.addRow({ label: 'DAROMAD', value: '' });
  plSheet.addRow({ label: '  Koreya savdosi', value: Number(summary.revenue.kor_krw) });
  plSheet.addRow({ label: '  O\'zbekiston savdosi', value: Number(summary.revenue.uzb_krw) });
  plSheet.addRow({ label: 'JAMI DAROMAD', value: Number(summary.revenue.total_krw) });
  plSheet.addRow({ label: 'Sotilgan tovar narxi (FIFO)', value: -Number(summary.cogs.total_krw) });
  plSheet.addRow({ label: 'Yetkazib berish xarajati', value: -Number(summary.cargo.total_krw) });
  plSheet.addRow({ label: 'YALPI FOYDA', value: Number(summary.gross_profit.total_krw), margin: summary.gross_profit.margin_percent + '%' });
  plSheet.addRow({});
  plSheet.addRow({ label: 'OPERATSION XARAJATLAR', value: '' });
  plSheet.addRow({ label: '  Qadoqlash', value: -Number(summary.expenses.by_category.PACKAGING) });
  plSheet.addRow({ label: '  Platforma to\'lovlari', value: -Number(summary.expenses.by_category.PLATFORM_FEE) });
  plSheet.addRow({ label: '  Materiallar', value: -Number(summary.expenses.by_category.SUPPLIES) });
  plSheet.addRow({ label: '  Ish haqi', value: -Number(summary.expenses.by_category.WAGES) });
  plSheet.addRow({ label: '  Boshqa (overhead)', value: -Number(summary.expenses.by_category.OTHER) });
  plSheet.addRow({ label: 'BUYURTMA XARAJATLARI', value: '' });
  plSheet.addRow({ label: '  Bepul yetkazish subsidiyasi', value: -Number(summary.expenses.order_linked.FREE_SHIPPING_SUBSIDY) });
  plSheet.addRow({ label: '  Yuk oshiqchasi', value: -Number(summary.expenses.order_linked.CARGO_OVERAGE) });
  plSheet.addRow({ label: '  Boshqa (order-linked)', value: -Number(summary.expenses.order_linked.OTHER) });
  plSheet.addRow({ label: 'JAMI XARAJATLAR', value: -Number(summary.expenses.grand_total_krw) });
  plSheet.addRow({});
  const netRow = plSheet.addRow({ label: 'SOF FOYDA', value: Number(summary.net_profit.total_krw), margin: summary.net_profit.margin_percent + '%' });

  // Formatting
  [4, 7, 10, 20, 23].forEach(idx => {
    plSheet.getRow(idx).font = { bold: true };
  });

  // Sheet 2: Tranzaksiyalar
  const transSheet = workbook.addWorksheet('Tranzaksiyalar');
  transSheet.columns = [
    { header: 'Order ID', key: 'orderNumber', width: 20 },
    { header: 'Sana', key: 'createdAt', width: 20 },
    { header: 'Mijoz', key: 'customerName', width: 30 },
    { header: 'Mintaqa', key: 'regionCode', width: 10 },
    { header: 'Summa ₩', key: 'totalAmount', width: 15 },
    { header: 'Tan narx ₩', key: 'cogs', width: 15 },
    { header: 'Yuk ₩', key: 'cargo', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  orders.forEach(o => {
    transSheet.addRow({
      orderNumber: o.orderNumber,
      createdAt: o.createdAt.toISOString(),
      customerName: o.customerName,
      regionCode: o.regionCode,
      totalAmount: Number(o.totalAmount),
      cogs: Number(o.cogs),
      cargo: Number(o.cargoCostKrw),
      status: o.status,
    });
  });

  // Sheet 3: Xarajatlar
  const expSheet = workbook.addWorksheet('Xarajatlar');
  expSheet.columns = [
    { header: 'Sana', key: 'date', width: 15 },
    { header: 'Kategoriya', key: 'category', width: 20 },
    { header: 'Tavsif', key: 'description', width: 40 },
    { header: 'Summa ₩', key: 'amount', width: 15 },
    { header: 'Qo\'shgan admin', key: 'createdBy', width: 25 },
    { header: 'Tur', key: 'type', width: 15 },
  ];

  standaloneExpenses.forEach(e => {
    expSheet.addRow({
      date: e.expenseDate,
      category: e.category,
      description: e.description,
      amount: Number(e.amountKrw),
      createdBy: e.createdBy,
      type: 'Standalone',
    });
  });

  orderExpenses.forEach(e => {
    expSheet.addRow({
      date: e.createdAt.toISOString().split('T')[0],
      category: e.type,
      description: e.note || (e.orderNumber ? `Order ${e.orderNumber}` : ''),
      amount: Number(e.amountKrw),
      createdBy: e.createdBy,
      type: 'Order-linked',
    });
  });

  return await workbook.xlsx.writeBuffer();
}
