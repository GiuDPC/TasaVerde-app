// Utilidades de moneda VES/USD — unificadas aquí (antes había dos archivos).

export function parseCurrencyInput(text: string): number {
  if (!text || text.trim() === '') return 0;

  let cleaned = text.trim();
  const dots = (cleaned.match(/\./g) || []).length;
  const commas = (cleaned.match(/,/g) || []).length;

  if (dots === 1 && commas === 0) {
    const parts = cleaned.split('.');
    if (parts[1] && parts[1].length === 3 && parts[0].length <= 3) {
      return parseFloat(cleaned.replace('.', '')) || 0;
    }
    return parseFloat(cleaned) || 0;
  }

  if (commas === 1 && dots === 0) {
    const parts = cleaned.split(',');
    if (parts[1] && parts[1].length === 3 && parts[0].length <= 3) {
      return parseFloat(cleaned.replace(',', '')) || 0;
    }
    return parseFloat(cleaned.replace(',', '.')) || 0;
  }

  if (dots > 1 || (dots >= 1 && commas >= 1)) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');

    if (lastComma > lastDot) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    } else {
      return parseFloat(cleaned.replace(/,/g, '')) || 0;
    }
  }

  if (commas > 1) {
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }

  return parseFloat(cleaned.replace(/[^\d]/g, '')) || 0;
}

export function formatCurrencyDisplay(value: number, currency: 'VES' | 'USD'): string {
  if (isNaN(value) || value === 0) return '';
  const locale = currency === 'VES' ? 'es-VE' : 'en-US';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatForCopy(value: number): string {
  if (isNaN(value)) return '0.00';
  return value.toFixed(2);
}

// Formato es-VE sin depender del locale (determinista, testeable en Node):
// 1.234.567,89 — punto para miles, coma para decimales.
export function formatBsAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const negative = rounded < 0;
  const abs = Math.abs(rounded);
  const intPart = Math.floor(abs).toString();
  const cents = String(Math.round((abs - Math.floor(abs)) * 100)).padStart(2, '0');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${grouped},${cents}`;
}

export function formatUsdAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toFixed(2);
}

// Máscara bancaria de derecha a izquierda (estilo apps de banca venezolana).
// Escribís dígitos y representan céntimos: '1' → '0,01', '3500' → '35,00'.
export const MAX_BS_DIGITS = 11; // 999.999.999,99 Bs

export function parseBsMask(raw: string): { display: string; value: number } {
  const digits = raw.replace(/\D/g, '').slice(0, MAX_BS_DIGITS).replace(/^0+(?=\d)/, '');
  if (digits === '') return { display: '', value: 0 };

  const intPart = digits.slice(0, -2) || '0';
  const centsPart = digits.slice(-2).padStart(2, '0');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const value = parseInt(digits.slice(0, -2) || '0', 10) + parseInt(digits.slice(-2), 10) / 100;
  return { display: `${grouped},${centsPart}`, value };
}

// Máscara USD simple: dígitos + un punto decimal, máx 2 decimales.
export function parseUsdMask(raw: string): { display: string; value: number } {
  const withDots = raw.replace(/,/g, '.');
  const cleaned = withDots.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  
  let sanitized = cleaned;
  if (firstDot !== -1) {
    sanitized = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  
  const [intPart, decPart] = sanitized.split('.');
  const intLimited = intPart.slice(0, 12);
  
  if (intLimited === '' && decPart === undefined) return { display: '', value: 0 };
  
  let display = intLimited || '0';
  
  if (decPart !== undefined) {
    const decLimited = decPart.slice(0, 2);
    display += '.' + decLimited;
  }
  
  const value = parseFloat(display) || 0;
  return { display, value };
}

// Máscara de TASA (Bs/$): número libre con hasta 2 decimales, sin forzar
// céntimos. '800' → '800' (no '8,00'), '7485' → '7.485', '748,5' → '748,5'.
// El último separador (coma o punto) es el decimal; los anteriores son miles.
export function parseRateMask(raw: string): { display: string; value: number } {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (cleaned === '') return { display: '', value: 0 };

  let intPart = cleaned;
  let decPart = '';
  const lastSep = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','));
  if (lastSep !== -1) {
    intPart = cleaned.slice(0, lastSep);
    decPart = cleaned.slice(lastSep + 1).slice(0, 2);
  }
  const intDigits = intPart.replace(/\D/g, '').slice(0, 7); // tasas < 10M
  if (intDigits === '' && decPart === '') return { display: '', value: 0 };

  const grouped = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const value = parseFloat(intDigits || '0') + (decPart ? parseFloat(`0.${decPart}`) : 0);
  return { display: decPart ? `${grouped},${decPart}` : grouped, value };
}

export function convertUsdToBs(usd: number, rate: number): number {
  return usd * rate;
}

export function convertBsToUsd(bs: number, rate: number): number {
  if (rate === 0) return 0;
  return bs / rate;
}

export function calcularDiferenciaPorcentual(tasa1: number, tasa2: number): number {
  if (tasa1 === 0) return 0;
  return ((tasa2 - tasa1) / tasa1) * 100;
}
