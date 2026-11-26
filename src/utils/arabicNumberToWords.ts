const ONES = [
  '',
  'واحد',
  'اثنان',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
];

const TEENS = [
  'عشرة',
  'أحد عشر',
  'اثنا عشر',
  'ثلاثة عشر',
  'أربعة عشر',
  'خمسة عشر',
  'ستة عشر',
  'سبعة عشر',
  'ثمانية عشر',
  'تسعة عشر',
];

const TENS = [
  '',
  '',
  'عشرون',
  'ثلاثون',
  'أربعون',
  'خمسون',
  'ستون',
  'سبعون',
  'ثمانون',
  'تسعون',
];

const HUNDREDS = [
  '',
  'مائة',
  'مائتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة',
];

function joinArabic(parts: string[]): string {
  return parts.filter(Boolean).join(' و');
}

function groupToWords(value: number): string {
  const n = Math.floor(value);
  if (n <= 0) return '';

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  const parts: string[] = [];
  if (hundreds > 0) parts.push(HUNDREDS[hundreds]);

  if (remainder > 0) {
    if (remainder < 10) {
      parts.push(ONES[remainder]);
    } else if (remainder < 20) {
      parts.push(TEENS[remainder - 10]);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(joinArabic([ONES[ones], TENS[tens]]));
    }
  }

  return joinArabic(parts);
}

function scaleWords(count: number, singular: string, dual: string, plural: string, accusative: string): string {
  if (count === 0) return '';
  if (count === 1) return singular;
  if (count === 2) return dual;
  if (count >= 3 && count <= 10) return `${groupToWords(count)} ${plural}`;
  if (count >= 100 && count % 100 === 0) return `${groupToWords(count)} ${singular}`;
  return `${groupToWords(count)} ${accusative}`;
}

/** يحوّل العدد الصحيح إلى كلمات عربية (يدعم حتى الملايين). */
export function numberToArabicWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'صفر';
  if (n > 999999999) return n.toLocaleString('en-US');

  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const rest = n % 1000;

  const parts: string[] = [];
  if (millions > 0) {
    parts.push(scaleWords(millions, 'مليون', 'مليونان', 'ملايين', 'مليوناً'));
  }
  if (thousands > 0) {
    parts.push(scaleWords(thousands, 'ألف', 'ألفان', 'آلاف', 'ألفاً'));
  }
  if (rest > 0) {
    parts.push(groupToWords(rest));
  }

  return joinArabic(parts);
}

/** صياغة المبلغ رقماً وكتابة بالعملة، كما في نماذج الطباعة. */
export function amountToArabicWords(amount: number, currencyName: string): string {
  const safe = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const integerPart = Math.floor(safe);
  const fraction = Math.round((safe - integerPart) * 100);

  const main = numberToArabicWords(integerPart);
  const fractionText =
    fraction > 0 ? ` و${numberToArabicWords(fraction)} فلساً` : '';

  return `فقط ${main} ${currencyName}${fractionText} لا غير`;
}
