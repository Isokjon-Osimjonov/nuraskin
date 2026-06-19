export function mapAuthErrorToMessage(err: any): string {
  const status = err?.status || err?.response?.status;

  if (status === 401) {
    return "Login yoki parol noto'g'ri";
  }

  if (status === 429) {
    return "Juda ko'p urinish. Iltimos, 15 daqiqadan keyin qayta urinib ko'ring";
  }

  // Network error / no response
  if (!status || err?.message === 'Failed to fetch' || err?.message === 'Network Error') {
    return "Server bilan bog'lanib bo'lmadi. Internet aloqangizni tekshiring";
  }

  // Fallback for 500 or other codes
  return "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring";
}
