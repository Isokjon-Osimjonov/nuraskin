import { db, expenses, users, orderExpenses, orders, orderItems, customers, products, inventoryBatches } from '@nuraskin/database';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import type { NewExpense } from '@nuraskin/database';

export async function create(data: NewExpense) {
  const [row] = await db.insert(expenses).values(data).returning();
  return row;
}

export async function update(id: string, data: Partial<NewExpense>) {
  const [row] = await db
    .update(expenses)
    .set(data)
    .where(eq(expenses.id, id))
    .returning();
  return row;
}

export async function findById(id: string) {
  const [row] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return row;
}

export async function deleteById(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
}

export async function findAll(month: string, category?: string) {
  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = new Date(Number(year), Number(monthNum), 0).toISOString().split('T')[0];

  const whereClauses: any[] = [
    gte(expenses.expenseDate, startDate),
    lte(expenses.expenseDate, endDate)
  ];

  if (category) {
    whereClauses.push(eq(expenses.category, category));
  }

  const rows = await db
    .select({
      expense: expenses,
      createdByName: users.fullName,
    })
    .from(expenses)
    .leftJoin(users, eq(expenses.createdBy, users.id))
    .where(and(...whereClauses))
    .orderBy(desc(expenses.expenseDate));

  return rows.map((r) => ({
    ...r.expense,
    amountKrw: r.expense.amountKrw.toString(),
    createdByName: r.createdByName,
  }));
}

export async function getStandaloneSummary(startDate: string, endDate: string) {
  const rows = await db
    .select({
      category: expenses.category,
      total: sql<number>`coalesce(sum(${expenses.amountKrw})::bigint, 0)`,
    })
    .from(expenses)
    .where(and(
      gte(expenses.expenseDate, startDate),
      lte(expenses.expenseDate, endDate)
    ))
    .groupBy(expenses.category);
  return rows;
}

export async function getOrderExpensesSummary(startDate: string, endDate: string) {
  const rows = await db
    .select({
      type: orderExpenses.type,
      total: sql<number>`coalesce(sum(${orderExpenses.amountKrw})::bigint, 0)`,
    })
    .from(orderExpenses)
    .where(and(
      gte(orderExpenses.createdAt, new Date(startDate)),
      lte(orderExpenses.createdAt, new Date(`${endDate}T23:59:59.999Z`))
    ))
    .groupBy(orderExpenses.type);
  return rows;
}

export async function getAccountingOrders(startDate: string, endDate: string) {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      regionCode: orders.regionCode,
      totalAmount: orders.totalAmount,
      cargoCostKrw: orders.cargoCostKrw,
      status: orders.status,
      createdAt: orders.createdAt,
      deliveredAt: orders.deliveredAt,
      customerName: customers.fullName,
      cogs: sql<bigint>`coalesce(sum(${orderItems.costAtSaleKrw} * ${orderItems.quantity}), 0)::bigint`,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(and(
      eq(orders.status, 'DELIVERED'),
      sql`${orders.deliveredAt} >= ${startDate}::date`,
      sql`${orders.deliveredAt} < (${endDate}::date + INTERVAL '1 day')`
    ))
    .groupBy(orders.id, customers.fullName);

  return rows;
}

export async function getInventoryValuation() {
  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      unitsOnHand: sql<number>`sum(${inventoryBatches.currentQty})::int`,
      costPerUnitKrw: inventoryBatches.costPrice,
      totalValueKrw: sql<bigint>`sum(${inventoryBatches.currentQty} * ${inventoryBatches.costPrice})::bigint`,
    })
    .from(inventoryBatches)
    .innerJoin(products, eq(inventoryBatches.productId, products.id))
    .where(sql`${inventoryBatches.currentQty} > 0`)
    .groupBy(products.id, products.name, inventoryBatches.costPrice);

  return rows;
}

export async function getOutstandingDebt() {
  const [row] = await db
    .select({
      totalKrw: sql<bigint>`coalesce(sum(${orders.totalAmount}), 0)::bigint`,
      customerCount: sql<number>`count(distinct ${orders.customerId})::int`,
    })
    .from(orders)
    .where(sql`${orders.status} IN ('PENDING_PAYMENT', 'PAYMENT_SUBMITTED')`);

  return row || { totalKrw: 0n, customerCount: 0 };
}

export async function getAllExpensesForMonth(startDate: string, endDate: string) {
  const rows = await db
    .select({
      id: expenses.id,
      expenseDate: expenses.expenseDate,
      category: expenses.category,
      description: expenses.description,
      amountKrw: expenses.amountKrw,
      createdBy: users.fullName,
    })
    .from(expenses)
    .leftJoin(users, eq(expenses.createdBy, users.id))
    .where(and(
      gte(expenses.expenseDate, startDate),
      lte(expenses.expenseDate, endDate)
    ))
    .orderBy(desc(expenses.expenseDate));
  
  return rows;
}

export async function getOrderExpensesForMonth(startDate: string, endDate: string) {
  const rows = await db
    .select({
      id: orderExpenses.id,
      createdAt: orderExpenses.createdAt,
      type: orderExpenses.type,
      note: orderExpenses.note,
      amountKrw: orderExpenses.amountKrw,
      createdBy: users.fullName,
      orderNumber: orders.orderNumber,
    })
    .from(orderExpenses)
    .leftJoin(users, eq(orderExpenses.createdBy, users.id))
    .leftJoin(orders, eq(orderExpenses.orderId, orders.id))
    .where(and(
      gte(orderExpenses.createdAt, new Date(startDate)),
      lte(orderExpenses.createdAt, new Date(`${endDate}T23:59:59.999Z`))
    ))
    .orderBy(desc(orderExpenses.createdAt));
  
  return rows;
}
