const SI = ["B", "kB", "MB", "GB", "TB", "PB", "EB"];
const IEC = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"];

const decimalFormat = (locale, decimals) => new Intl.NumberFormat(locale, { maximumFractionDigits: decimals, minimumFractionDigits: 0 });

/**
 * `bytes(1536)` is `"1.5 kB"`; `{ binary: true }` counts in 1024s and says `"1.5 KiB"`. Default is the decimal (SI) way, like macOS and
 * hard disk makers. `decimals` (default 1) and `locale` ("nl-NL" gives `"1,5 kB"`) are options. Negative sizes keep their sign.
 */
export function bytes(value, { binary = false, decimals = 1, locale = "en" } = {}) {
  if (!Number.isFinite(value)) throw new TypeError("human-format: bytes needs a finite number");
  const base = binary ? 1024 : 1000;
  const units = binary ? IEC : SI;
  let size = Math.abs(value);
  let unit = 0;
  while (size >= base - 0.5 * 10 ** -decimals && unit < units.length - 1) {
    size /= base;
    unit++;
  }
  return `${value < 0 ? "-" : ""}${decimalFormat(locale, unit === 0 ? 0 : decimals).format(size)} ${units[unit]}`;
}

/** Reads `"1.5 GB"`, `"1,5 GiB"`, `"512k"`, `"2 megabytes"` into a number of bytes. `kB`/`MB` count in 1000s, `KiB`/`MiB` in 1024s; a plain `K` or `M` counts in 1000s. Throws on anything unknown. */
export function parseBytes(text) {
  const m = /^\s*(-?\d+(?:[.,]\d+)?)\s*([a-zA-Z]*)\s*$/.exec(String(text));
  if (!m) throw new TypeError(`human-format: cannot read "${text}" as a size`);
  const amount = Number(m[1].replace(",", "."));
  const unit = m[2].toLowerCase().replace(/bytes?$/, "b").replace(/(?<=\w)bytes?$/, "b");
  const table = { "": 1, b: 1, k: 1e3, kb: 1e3, m: 1e6, mb: 1e6, g: 1e9, gb: 1e9, t: 1e12, tb: 1e12, p: 1e15, pb: 1e15, kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4, pib: 1024 ** 5 };
  const aliases = { kilobyte: "kb", kilobytes: "kb", megabyte: "mb", megabytes: "mb", gigabyte: "gb", gigabytes: "gb", terabyte: "tb", terabytes: "tb", kibibyte: "kib", mebibyte: "mib", gibibyte: "gib", tebibyte: "tib" };
  const factor = table[aliases[m[2].toLowerCase()] ?? unit];
  if (factor === undefined) throw new TypeError(`human-format: unknown unit "${m[2]}"`);
  return Math.round(amount * factor);
}

/** A number the way people read it: `number(1234567.891)` is `"1,234,567.89"`; `locale: "nl-NL"` gives `"1.234.567,89"`. */
export function number(value, { locale = "en", decimals = 2 } = {}) {
  if (!Number.isFinite(value)) throw new TypeError("human-format: number needs a finite number");
  return new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(value);
}

/** Short form: `compact(1234)` is `"1.2K"`, `compact(2_500_000)` is `"2.5M"`. */
export function compact(value, { locale = "en", decimals = 1 } = {}) {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: decimals }).format(value);
}

/** `percent(0.256)` is `"26%"`; `percent(0.2564, { decimals: 1 })` is `"25.6%"`. Give a fraction (0.5 = 50%). */
export function percent(fraction, { locale = "en", decimals = 0 } = {}) {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(fraction);
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/**
 * "3 minutes ago", "tomorrow", "in 2 weeks": the difference between a date and now in the largest sensible unit, in your language.
 * `ago(date, { locale: "nl-NL" })` gives `"3 minuten geleden"`, `"gisteren"`, `"over 2 weken"`. `now` is for tests. Accepts Dates,
 * timestamps and date strings. Under 45 seconds is `"now"` ("nu").
 */
export function ago(date, { locale = "en", now = Date.now(), numeric = "auto" } = {}) {
  const time = date instanceof Date ? date.getTime() : typeof date === "number" ? date : Date.parse(date);
  if (!Number.isFinite(time)) throw new TypeError("human-format: ago needs a valid date");
  const diff = time - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric });
  const sign = diff < 0 ? -1 : 1;
  if (abs < 45_000) return rtf.format(0, "second");
  if (abs < 45 * MINUTE) return rtf.format(sign * Math.max(1, Math.round(abs / MINUTE)), "minute");
  if (abs < 22 * HOUR) return rtf.format(sign * Math.max(1, Math.round(abs / HOUR)), "hour");
  if (abs < 6.5 * DAY) return rtf.format(sign * Math.max(1, Math.round(abs / DAY)), "day");
  if (abs < 25 * DAY) return rtf.format(sign * Math.round(abs / (7 * DAY)), "week");
  if (abs < 320 * DAY) return rtf.format(sign * Math.max(1, Math.round(abs / (30.4375 * DAY))), "month");
  return rtf.format(sign * Math.max(1, Math.round(abs / (365.25 * DAY))), "year");
}

/**
 * The right form for a count: `plural(1, { one: "task", other: "tasks" })` is `"task"`; add `zero` for a special word at 0.
 * Languages with more forms (few, many...) work through `locale`. `count` includes the number: `count(2, { one: "taak", other: "taken" }, "nl")` is `"2 taken"`.
 */
export function plural(n, forms, locale = "en") {
  if (!Number.isFinite(n)) throw new TypeError("human-format: plural needs a number");
  if (n === 0 && forms.zero !== undefined) return forms.zero;
  const category = new Intl.PluralRules(locale).select(n);
  const form = forms[category] ?? forms.other;
  if (form === undefined) throw new RangeError(`human-format: no "${category}" or "other" form given`);
  return form;
}

export function count(n, forms, locale = "en") {
  const word = plural(n, forms, locale);
  return n === 0 && forms.zero !== undefined ? word : `${new Intl.NumberFormat(locale).format(n)} ${word}`;
}

/** `list(["a", "b", "c"])` is `"a, b, and c"`; `list(["a", "b", "c"], { locale: "nl" })` is `"a, b en c"`. `type: "or"` for choices. */
export function list(items, { locale = "en", type = "and", style = "long" } = {}) {
  return new Intl.ListFormat(locale, { type: type === "or" ? "disjunction" : "conjunction", style }).format(items.map(String));
}

/** Position words: `ordinal(1)` is `"1st"`, `ordinal(22)` `"22nd"`, `ordinal(13)` `"13th"`; Dutch `ordinal(3, "nl")` is `"3e"`. */
export function ordinal(n, locale = "en") {
  if (!Number.isInteger(n)) throw new TypeError("human-format: ordinal needs a whole number");
  if (locale.startsWith("nl")) return `${n}e`;
  const category = new Intl.PluralRules(locale, { type: "ordinal" }).select(n);
  const suffix = { one: "st", two: "nd", few: "rd", other: "th" }[category];
  return locale.startsWith("en") ? `${n}${suffix}` : `${n}.`;
}

/** Shortens text to at most `max` characters with an ellipsis, without cutting an emoji or an accented letter in half (it counts what people see). `atWord: true` cuts at a space. */
export function truncate(text, max, { ellipsis = "…", atWord = false } = {}) {
  if (!Number.isInteger(max) || max < 1) throw new RangeError("human-format: max must be a whole number of at least 1");
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const chars = [...segmenter.segment(text)].map((s) => s.segment);
  if (chars.length <= max) return text;
  const room = Math.max(0, max - [...segmenter.segment(ellipsis)].length);
  let cut = chars.slice(0, room).join("");
  if (atWord) {
    const space = cut.lastIndexOf(" ");
    if (space > room * 0.4) cut = cut.slice(0, space);
  }
  return cut.trimEnd() + ellipsis;
}

/** `initials("Kaj van Schalkwijk")` is `"KS"` (first and last name; `all: true` gives every word: `"KVS"`). Particles in lower case are skipped by default. */
export function initials(name, { all = false, max = 2 } = {}) {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const first = (w) => [...segmenter.segment(w)][0].segment.toUpperCase();
  const significant = words.filter((w, i) => i === 0 || i === words.length - 1 || w[0] !== w[0].toLowerCase());
  const picked = all ? words : significant.length > 2 ? [significant[0], significant[significant.length - 1]] : significant;
  return picked.slice(0, all ? undefined : max).map(first).join("");
}
