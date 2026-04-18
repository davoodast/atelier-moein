const ones = [
  '', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه',
  'ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده',
];
const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];

function convert(n: number): string {
  if (n === 0) return '';
  const parts: string[] = [];
  if (n >= 1_000_000_000) { parts.push(convert(Math.floor(n / 1_000_000_000)) + ' میلیارد'); n %= 1_000_000_000; }
  if (n >= 1_000_000) { parts.push(convert(Math.floor(n / 1_000_000)) + ' میلیون'); n %= 1_000_000; }
  if (n >= 1_000) { parts.push(convert(Math.floor(n / 1_000)) + ' هزار'); n %= 1_000; }
  if (n >= 100) { parts.push(hundreds[Math.floor(n / 100)]); n %= 100; }
  if (n >= 20) { parts.push(tens[Math.floor(n / 10)]); n %= 10; }
  if (n > 0) { parts.push(ones[n]); }
  return parts.filter(Boolean).join(' و ');
}

export function numberToWordsFa(n: number): string {
  if (!n || n === 0) return 'صفر تومان';
  return convert(n) + ' تومان';
}

export function formatAmountFa(n: number): string {
  if (!n) return '۰';
  return n.toLocaleString('fa-IR');
}
