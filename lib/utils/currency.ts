// lib/utils/currency.ts
//
// Currency handling for invoices.
//
// Why this exists: the previous implementation stored a bare glyph ("$", "₹", "¥")
// and formatted with `toFixed(2)`. That produced three real bugs:
//   1. "¥" is ambiguous between JPY and CNY.
//   2. JPY has no minor unit, so `toFixed(2)` printed "¥ 1000.00", which is wrong.
//   3. No locale grouping, so Indian users saw "₹ 100000.00" instead of "₹1,00,000.00".
//
// Banks, accounts-payable systems and cross-border clients need the ISO 4217 code,
// not a glyph. We store the code and derive presentation from it.

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'INR'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'SGD'
  | 'AED'
  | 'CHF'
  | 'SEK'
  | 'NZD'
  | 'ZAR';

export interface CurrencyMeta {
  code: CurrencyCode;
  /** Human label shown in the picker. */
  label: string;
  /** Number of minor units (2 for cents, 0 for yen). */
  decimals: number;
  /** BCP-47 locale used for grouping and separator conventions. */
  locale: string;
}

/**
 * Supported currencies. `decimals` follows ISO 4217 minor-unit definitions.
 * Add entries here rather than hardcoding glyphs anywhere else.
 */
export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: 'USD', label: 'US Dollar', decimals: 2, locale: 'en-US' },
  EUR: { code: 'EUR', label: 'Euro', decimals: 2, locale: 'de-DE' },
  GBP: { code: 'GBP', label: 'Pound Sterling', decimals: 2, locale: 'en-GB' },
  INR: { code: 'INR', label: 'Indian Rupee', decimals: 2, locale: 'en-IN' },
  JPY: { code: 'JPY', label: 'Japanese Yen', decimals: 0, locale: 'ja-JP' },
  CAD: { code: 'CAD', label: 'Canadian Dollar', decimals: 2, locale: 'en-CA' },
  AUD: { code: 'AUD', label: 'Australian Dollar', decimals: 2, locale: 'en-AU' },
  SGD: { code: 'SGD', label: 'Singapore Dollar', decimals: 2, locale: 'en-SG' },
  AED: { code: 'AED', label: 'UAE Dirham', decimals: 2, locale: 'en-AE' },
  CHF: { code: 'CHF', label: 'Swiss Franc', decimals: 2, locale: 'de-CH' },
  SEK: { code: 'SEK', label: 'Swedish Krona', decimals: 2, locale: 'sv-SE' },
  NZD: { code: 'NZD', label: 'New Zealand Dollar', decimals: 2, locale: 'en-NZ' },
  ZAR: { code: 'ZAR', label: 'South African Rand', decimals: 2, locale: 'en-ZA' },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

/** Narrows an arbitrary string to a supported currency code, falling back to USD. */
export function resolveCurrency(code: string | undefined | null): CurrencyMeta {
  if (code && Object.prototype.hasOwnProperty.call(CURRENCIES, code)) {
    return CURRENCIES[code as CurrencyCode];
  }
  return CURRENCIES[DEFAULT_CURRENCY];
}

/** How many minor units make up one major unit (100 for cents, 1 for yen). */
export function minorUnitFactor(code: string): number {
  return Math.pow(10, resolveCurrency(code).decimals);
}

/**
 * Formats a major-unit amount for display, with the currency symbol.
 * Falls back to "CODE amount" if the runtime lacks the currency in ICU data.
 */
export function formatMoney(amount: number, code: string): string {
  const meta = resolveCurrency(code);
  const safe = Number.isFinite(amount) ? amount : 0;

  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(safe);
  } catch {
    return `${meta.code} ${safe.toFixed(meta.decimals)}`;
  }
}

/**
 * Formats an amount without the symbol — for table columns where the currency
 * is already stated in the header, which avoids repeating the glyph on every row.
 */
export function formatAmount(amount: number, code: string): string {
  const meta = resolveCurrency(code);
  const safe = Number.isFinite(amount) ? amount : 0;

  try {
    return new Intl.NumberFormat(meta.locale, {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(safe);
  } catch {
    return safe.toFixed(meta.decimals);
  }
}

/**
 * Returns the currency's symbol for the given locale, or the ISO code if the
 * runtime cannot resolve one. Used only for compact input adornments.
 */
export function currencySymbol(code: string): string {
  const meta = resolveCurrency(code);
  try {
    const parts = new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? meta.code;
  } catch {
    return meta.code;
  }
}
