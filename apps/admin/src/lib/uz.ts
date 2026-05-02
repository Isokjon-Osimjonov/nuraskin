export const UZ = {

  // --- COMMON ---
  common: {
    save: "Saqlash",
    cancel: "Bekor qilish",
    delete: "O'chirish",
    edit: "Tahrirlash",
    add: "Qo'shish",
    close: "Yopish",
    back: "Orqaga",
    search: "Qidirish",
    filter: "Filter",
    loading: "Yuklanmoqda...",
    error: "Xatolik yuz berdi",
    success: "Muvaffaqiyatli",
    confirm: "Tasdiqlash",
    yes: "Ha",
    no: "Yo'q",
    view: "Ko'rish",
    download: "Yuklab olish",
    upload: "Yuklash",
    refresh: "Yangilash",
    total: "Jami",
    status: "Holat",
    date: "Sana",
    actions: "Amallar",
    name: "Nomi",
    description: "Tavsif",
    price: "Narx",
    quantity: "Miqdor",
    currency: "Valyuta",
    region: "Mintaqa",
    all: "Hammasi",
    none: "Yo'q",
    required: "Majburiy maydon",
    optional: "Ixtiyoriy",
    unknown: "Noma'lum",
    aiAnalyzing: "AI tahlil qilmoqda...",
    aiFailed: "AI tahlil qila olmadi. Qo'lda to'ldiring.",
    aiSuccess: "AI ma'lumotlarni to'ldirdi",
    placeholderSearch: "Qidirish...",
    placeholderSelect: "Tanlang...",
    placeholderName: "Ism familiya",
    placeholderPhone: "Telefon raqami",
    placeholderEmail: "Elektron pochta",
    confirmDeleteTitle: "Haqiqatan ham o'chirmoqchimisiz?",
    confirmDeleteDesc: "Bu amalni ortga qaytarib bo'lmaydi. Bu ma'lumot butunlay o'chiriladi.",
  },

  // --- NAV ---
  nav: {
    dashboard: "Bosh sahifa",
    orders: "Buyurtmalar",
    products: "Mahsulotlar",
    inventory: "Ombor",
    customers: "Mijozlar",
    settings: "Sozlamalar",
    sales: "Savdo",
    accounting: "Hisobot",
    categories: "Kategoriyalar",
    logout: "Chiqish",
  },

  // --- AUTH ---
  auth: {
    login: "Kirish",
    logout: "Chiqish",
    email: "Elektron pochta",
    password: "Parol",
    loginButton: "Tizimga kirish",
    loginError: "Email yoki parol noto'g'ri",
    unauthorized: "Ruxsat yo'q",
    sessionExpired: "Sessiya tugadi, qayta kiring",
  },

  // --- ORDERS ---
  orders: {
    title: "Buyurtmalar",
    newOrder: "Yangi buyurtma",
    orderNumber: "Buyurtma raqami",
    customer: "Mijoz",
    items: "Mahsulotlar",
    subtotal: "Oraliq summa",
    cargo: "Yetkazib berish",
    total: "Jami",
    receipt: "Kvitansiya",
    downloadReceipt: "Chekni yuklab olish",
    noReceipt: "Chek yuklanmagan",
    paymentProof: "To'lov cheki",
    viewReceipt: "Chekni ochish",
    cancelOrder: "Bekor qilish",
    confirmCancel: "Buyurtmani bekor qilasizmi?",
    cancelReason: "Bekor qilish sababi",
    
    status: {
      PENDING_PAYMENT: "To'lov kutilmoqda",
      PAID: "To'landi",
      PROCESSING: "Jarayonda",
      PACKED: "Qadoqlandi",
      SHIPPED: "Yuborildi",
      DELIVERED: "Yetkazildi",
      CANCELLED: "Bekor qilindi",
      REFUNDED: "Qaytarildi",
    },

    errors: {
      notFound: "Buyurtma topilmadi",
      cancelFailed: "Buyurtmani bekor qilishda xatolik",
      statusUpdateFailed: "Holat yangilashda xatolik",
      receiptNotFound: "Chek topilmadi",
    },

    success: {
      cancelled: "Buyurtma bekor qilindi",
      statusUpdated: "Holat yangilandi",
      paymentConfirmed: "To'lov tasdiqlandi",
      paymentRejected: "To'lov rad etildi",
    },
  },

  // --- PRODUCTS ---
  products: {
    title: "Mahsulotlar",
    addProduct: "Mahsulot qo'shish",
    editProduct: "Mahsulotni tahrirlash",
    deleteProduct: "Mahsulotni o'chirish",
 productName: "Mahsulot nomi",
    barcode: "Barkod",
    sku: "SKU",
    brand: "Brend",
    category: "Kategoriya",
    weight: "Og'irlik (g)",
    images: "Rasmlar",
    stockCount: "Ombordagi miqdor",
    lowStockAlert: "Kam qolgan ogohlantirish",
    isActive: "Faol",

    errors: {
      notFound: "Mahsulot topilmadi",
      deleteFailed: "Mahsulotni o'chirishda xatolik",
      saveFailed: "Mahsulotni saqlashda xatolik",
      barcodeExists: "Bu barkod allaqachon mavjud",
      skuExists: "Bu SKU allaqachon mavjud",
    },

    success: {
      created: "Mahsulot qo'shildi",
      updated: "Mahsulot yangilandi",
      deleted: "Mahsulot o'chirildi",
    },
  },

  // --- INVENTORY ---
  inventory: {
    title: "Ombor",
    batches: "Partiyalar",
    addBatch: "Partiya qo'shish",
    editBatch: "Partiyani tahrirlash",
    deleteBatch: "Partiyani o'chirish",
    batchRef: "Partiya raqami",
    initialQty: "Dastlabki miqdor",
    currentQty: "Joriy miqdor",
    costPrice: "Tan narxi",
    expiryDate: "Yaroqlilik muddati",
    receivedAt: "Qabul sanasi",
    adjustQty: "Miqdorni tuzatish",
    adjustmentReason: "Tuzatish sababi",
    adjustmentHistory: "O'zgarishlar tarixi",
    lowStock: "Kam qolgan",
    outOfStock: "Tugagan",
    overview: "Ombor holati",

    errors: {
      notFound: "Partiya topilmadi",
      deleteFailed: "Partiyani o'chirishda xatolik",
      cannotDeleteSold:
        "Foydalanilgan partiyani o'chirib bo'lmaydi",
      cannotDeleteReserved:
        "Faol bronlar mavjud, o'chirib bo'lmaydi",
      cannotEditInitialQty:
        "Sotilgan partiya miqdorini o'zgartirib bo'lmaydi",
      negativeQty: "Miqdor manfiy bo'la olmaydi",
      exceedsInitial:
        "Miqdor dastlabki miqdordan oshib ketdi",
    },

    success: {
      batchCreated: "Partiya qo'shildi",
      batchUpdated: "Partiya yangilandi",
      batchDeleted: "Partiya o'chirildi",
      qtyAdjusted: "Miqdor yangilandi",
    },
  },

  // --- CUSTOMERS ---
  customers: {
    title: "Mijozlar",
    customerName: "Mijoz ismi",
    phone: "Telefon",
    email: "Elektron pochta",
    region: "Mintaqa",
    totalOrders: "Jami buyurtmalar",
    totalSpent: "Jami sarflagan",
    loyaltyTier: "Sodiqlik darajasi",
    registeredAt: "Ro'yxatdan o'tgan",
    lastOrder: "Oxirgi buyurtma",
    noOrders: "Buyurtmalar yo'q",

    errors: {
      notFound: "Mijoz topilmadi",
    },
  },

  // --- EXPENSES ---
  expenses: {
    title: "Xarajatlar",
    addExpense: "Xarajat qo'shish",
    editExpense: "Xarajatni tahrirlash",
    deleteExpense: "Xarajatni o'chirish",
    category: "Kategoriya",
    amount: "Summa",
    expenseDate: "Sana",
    receiptPhoto: "Chek rasmi",
    note: "Izoh",

    categories: {
      PACKAGING: "Qadoqlash",
      PLATFORM_FEE: "Platforma to'lovi",
      SUPPLIES: "Materiallar",
      WAGES: "Ish haqi",
      OTHER: "Boshqa",
    },

    orderLinked: {
      FREE_SHIPPING_SUBSIDY: "Bepul yetkazish subsidiyasi",
      CARGO_OVERAGE: "Yuk oshiqchasi",
      OTHER: "Boshqa (buyurtma)",
    },

    errors: {
      notFound: "Xarajat topilmadi",
      deleteFailed: "Xarajatni o'chirishda xatolik",
      saveFailed: "Xarajatni saqlashda xatolik",
      unauthorized:
        "Faqat yaratgan admin o'zgartira oladi",
    },

    success: {
      created: "Xarajat qo'shildi",
      updated: "Xarajat yangilandi",
      deleted: "Xarajat o'chirildi",
    },
  },

  // --- ACCOUNTING ---
  accounting: {
    title: "Hisobot",
    period: "Davr",
    plReport: "Daromad va zarar hisoboti",
    revenue: "Daromad",
    korRevenue: "Koreya savdosi",
    uzbRevenue: "O'zbekiston savdosi",
    totalRevenue: "Jami daromad",
    cogs: "Sotilgan tovar narxi (FIFO)",
    cargoExpense: "Yetkazib berish xarajati",
    grossProfit: "Yalpi foyda",
    operatingExpenses: "Operatsion xarajatlar",
    orderExpenses: "Buyurtma xarajatlari",
    totalExpenses: "Jami xarajatlar",
    netProfit: "Sof foyda",
    inventoryValue: "Ombor qiymati",
    outstandingDebt: "Muddati o'tgan qarzlar",
    noDebt: "Hech qanday qarz yo'q",
    exportExcel: "Excel yuklab olish",
    currentInventory: "Joriy holat bo'yicha",
  },

  // --- DASHBOARD ---
  dashboard: {
    title: "Bosh sahifa",
    todayRevenue: "Bugungi daromad",
    todayOrders: "Bugungi buyurtmalar",
    todayMargin: "Bugungi marja",
    inventoryValue: "Ombor qiymati",
    outstandingDebt: "Qarzdorlik",
    lastUpdated: "Oxirgi yangilash",
    actionRequired: "Bajarilishi kerak",
    weeklyRevenue: "Haftalik daromad",
    topProducts: "Top mahsulotlar",
    units: "dona",
    noData: "Ma'lumot yo'q",

    actions: {
      verifyPayment: "To'lov tasdiqlash",
      verifyPaymentDesc:
        "Mijoz chek yuborgan, tasdiqlash kutilmoqda",
      readyToPack: "Yig'ish uchun tayyor",
      readyToPackDesc:
        "To'lov tasdiqlangan, yig'ishni boshlang",
      expiringReservations: "Muddati tugayotgan bronlar",
      expiringDesc: "2 soat ichida muddati tugaydi",
      lowStock: "Kam qolgan tovarlar",
      lowStockDesc: "Zaxirani to'ldirish tavsiya etiladi",
    },
  },

  // --- SETTINGS ---
  settings: {
    title: "Sozlamalar",
    save: "Sozlamalarni saqlash",
    saved: "Sozlamalar saqlandi",
    freeShippingThreshold: "Bepul yetkazish chegarasi",
    standardShippingFee: "Standart yetkazish narxi",
    deliverySettings: "Yetkazib berish sozlamalari",
    exchangeRates: "Valyuta kurslari",
    usdToKrw: "1 USD = ? KRW",
    usdToUzs: "1 USD = ? UZS",
    profileUpdated: "Profil yangilandi",
    passwordChanged: "Parol muvaffaqiyatli o'zgartirildi",
    passwordsNotMatch: "Yangi parollar mos kelmadi",
    passwordTooShort: "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak",

    errors: {
      saveFailed: "Sozlamalarni saqlashda xatolik",
    },
  },

  // --- TELEGRAM ---
  telegram: {
    title: "Telegram",
    dashboard: "Telegram bosh sahifa",
    channels: "Kanallar",
    newPost: "Yangi post",
    postSaved: "Post saqlandi",
    postDeleted: "Post o'chirildi",
    postSent: "Post yuborish boshlandi",
    channelAdded: "Kanal muvaffaqiyatli qo'shildi",
    channelRemoved: "Kanal olib tashlandi",
    aiTextReady: "AI matn tayyor!",
    selectProduct: "Iltimos, mahsulotni tanlang",
    noPosts: "Hali postlar yo'q",
    noChannels: "Hali kanallar qo'shilmagan",
    confirmDeleteChannel: "Kanalni o'chirmoqchimisiz?",
  },

  // --- COUPONS ---
  coupons: {
    title: "Kuponlar",
    newCoupon: "Yangi kupon",
    editCoupon: "Kuponni tahrirlash",
    deleteCoupon: "Kuponni o'chirish",
    couponCreated: "Kupon yaratildi",
    couponUpdated: "Kupon yangilandi",
    couponDeleted: "Kupon o'chirildi",
    couponStatusUpdated: "Kupon holati yangilandi",
    noCoupons: "Kuponlar topilmadi",
    confirmDelete: "Haqiqatan ham o'chirasizmi?",
  },

  // --- ERRORS (user friendly, no tech jargon) ---
  errors: {
    generic: "Nimadir noto'g'ri ketdi. Qayta urinib ko'ring.",
    network: "Internet bilan bog'lanishda muammo. Sahifani yangilang.",
    notFound: "Ma'lumot topilmadi.",
    unauthorized: "Bu amalni bajarish uchun ruxsat yo'q.",
    serverError: "Server xatosi. Keyinroq urinib ko'ring.",
    validationError: "Kiritilgan ma'lumotlar noto'g'ri. Tekshirib ko'ring.",
    uploadFailed: "Fayl yuklashda xatolik. Qayta urinib ko'ring.",
    sessionExpired: "Sessiya tugadi. Qayta tizimga kiring.",
    timeout: "So'rov vaqti tugadi. Internet aloqangizni tekshiring.",
  },
} as const;

export function translateServerError(msg: string): string {
  if (!msg) return UZ.errors.generic;
  
  const map: Record<string, string> = {
    "Order not found": "Buyurtma topilmadi",
    "Product not found": "Mahsulot topilmadi",
    "Customer not found": "Mijoz topilmadi",
    "Batch not found": "Partiya topilmadi",
    "Expense not found": "Xarajat topilmadi",
    "Not found": "Ma'lumot topilmadi",
    "Unauthorized": "Ruxsat yo'q",
    "Insufficient stock": "Omborda yetarli mahsulot yo'q",
    "Cannot delete": "O'chirib bo'lmaydi",
    "Already exists": "Bu ma'lumot allaqachon mavjud",
    "Invalid": "Noto'g'ri ma'lumot",
    "Sotilgan partiyani": "Foydalanilgan partiyani o'chirib bo'lmaydi",
    "Faol bronlar": "Faol bronlar mavjud, o'chirib bo'lmaydi",
  };

  for (const [key, value] of Object.entries(map)) {
    if (msg.includes(key)) return value;
  }
  return UZ.errors.generic;
}

export type UzKeys = typeof UZ;
