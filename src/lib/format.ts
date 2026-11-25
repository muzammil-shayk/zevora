export function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

export function normalizePakistanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('03') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  if (digits.startsWith('92')) {
    return digits;
  }
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizePakistanPhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
