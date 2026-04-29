export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public data?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    data?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND', data?: any) {
    super(message, 404, code, data);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST', data?: any) {
    super(message, 400, code, data);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', code = 'VALIDATION_ERROR', data?: any) {
    super(message, 400, code, data);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', data?: any) {
    super(message, 401, code, data);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN', data?: any) {
    super(message, 403, code, data);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', data?: any) {
    super(message, 409, code, data);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR', data?: any) {
    super(message, 500, code, data);
  }
}

// Domain Specific Errors
export class DebtLimitSoftError extends BadRequestError {
  constructor(message = 'Debt limit soft warning') {
    super(message, 'DEBT_LIMIT_SOFT');
  }
}

export class DebtLimitHardError extends ForbiddenError {
  constructor(message = 'Debt limit hard blocked') {
    super(message, 'DEBT_LIMIT_HARD');
  }
}

export class InsufficientStockError extends BadRequestError {
  constructor(message = 'Insufficient stock') {
    super(message, 'INSUFFICIENT_STOCK');
  }
}

export class CannotCancelShippedOrderError extends BadRequestError {
  constructor() {
    super('Yuborilgan buyurtmani bekor qilib bo\'lmaydi', 'CANNOT_CANCEL_SHIPPED');
  }
}

// Coupon Specific Errors
export class CouponNotFoundError extends BadRequestError {
  constructor() {
    super('Kupon topilmadi', 'COUPON_NOT_FOUND');
  }
}

export class CouponExpiredError extends BadRequestError {
  constructor() {
    super('Kupon muddati tugagan', 'COUPON_EXPIRED');
  }
}

export class CouponDepletedError extends BadRequestError {
  constructor() {
    super('Kupon limiti tugagan', 'COUPON_DEPLETED');
  }
}

export class CouponNotApplicableError extends BadRequestError {
  constructor(message = 'Bu kupon buyurtmangizga mos emas') {
    super(message, 'COUPON_NOT_APPLICABLE');
  }
}

export class CouponMinAmountError extends BadRequestError {
  constructor(amountNeeded: bigint) {
    super(
      `Minimal buyurtma miqdori: ${Number(amountNeeded) / 100} so'm`,
      'COUPON_MIN_AMOUNT',
      { amountNeeded: amountNeeded.toString() }
    );
  }
}
