export interface ApiOrder {
  _id: string;
  orderNumber: string;
  shortId: string;
  orderStatus: string;
  payment?: { rejectionReason?: string };
  trackingNumber?: string;
  shippingAddress: { city: string; address: string };
  discountAmount: number;
  totalAmount: number;
  finalAmount: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export async function getMyOrders() {
  return {
    data: [
      {
        _id: 'ord-1',
        orderNumber: 'ORD-001',
        shortId: 'ORD-001',
        orderStatus: 'pending_payment',
        shippingAddress: { city: 'Toshkent', address: 'Amir Temur shoh ko\'chasi, 12' },
        discountAmount: 0,
        totalAmount: 150000,
        finalAmount: 150000,
        createdAt: new Date().toISOString(),
        items: [{ name: 'Cherry Care Yuz Kremi', quantity: 1, price: 150000 }]
      }
    ] as ApiOrder[]
  };
}

export interface CreateOrderPayload {
  items: Array<{ product: string; name: string; price: number; quantity: number }>;
  paymentMethod: string;
  shippingAddress: { fullName: string; phone: string; address: string; city: string; region: string };
  couponCode?: string;
}

export async function submitReceipt(_orderId: string, _file: File) {
  return { success: true };
}

export async function createOrder(payload: CreateOrderPayload) {
  return {
    success: true,
    data: {
      _id: 'new-ord-1',
      shortId: 'ORD-001',
      orderNumber: 'ORD-001',
      finalAmount: 150000,
      totalAmount: 150000,
    }
  };
}