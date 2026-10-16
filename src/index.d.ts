export function bytes(value: number, options?: { binary?: boolean; decimals?: number; locale?: string }): string;
export function parseBytes(text: string): number;
export function number(value: number, options?: { locale?: string; decimals?: number }): string;
export function compact(value: number, options?: { locale?: string; decimals?: number }): string;
export function percent(fraction: number, options?: { locale?: string; decimals?: number }): string;
export function ago(date: Date | number | string, options?: { locale?: string; now?: number; numeric?: "auto" | "always" }): string;

export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}
export function plural(n: number, forms: PluralForms, locale?: string): string;
export function count(n: number, forms: PluralForms, locale?: string): string;
export function list(items: readonly unknown[], options?: { locale?: string; type?: "and" | "or"; style?: "long" | "short" | "narrow" }): string;
export function ordinal(n: number, locale?: string): string;
export function truncate(text: string, max: number, options?: { ellipsis?: string; atWord?: boolean }): string;
export function initials(name: string, options?: { all?: boolean; max?: number }): string;
