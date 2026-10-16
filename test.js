import assert from "node:assert/strict";
import { test } from "node:test";

import { ago, bytes, compact, count, initials, list, number, ordinal, parseBytes, percent, plural, truncate } from "./src/index.js";

const nbsp = (s) => s.replace(/[  ]/g, " ");

test("bytes: decimal and binary, locale, edges", () => {
  assert.equal(bytes(0), "0 B");
  assert.equal(bytes(999), "999 B");
  assert.equal(bytes(1000), "1 kB");
  assert.equal(bytes(1536), "1.5 kB");
  assert.equal(bytes(1_500_000), "1.5 MB");
  assert.equal(bytes(1_000_000_000_000), "1 TB");
  assert.equal(bytes(1536, { binary: true }), "1.5 KiB");
  assert.equal(bytes(1024 ** 3, { binary: true }), "1 GiB");
  assert.equal(bytes(999_999), "1 MB"); // rounds to the next unit instead of "1000 kB"
  assert.equal(bytes(1536, { locale: "nl-NL" }), "1,5 kB");
  assert.equal(bytes(1234567, { decimals: 2 }), "1.23 MB");
  assert.equal(bytes(-2048, { binary: true }), "-2 KiB");
  assert.equal(bytes(1e30), "1,000,000,000,000 EB");
  assert.throws(() => bytes(NaN), TypeError);
});

test("parseBytes", () => {
  const cases = { "1.5 GB": 1.5e9, "1,5 GiB": 1.5 * 1024 ** 3, "512k": 512_000, "2 megabytes": 2_000_000, "100": 100, "100 B": 100, "1 KiB": 1024, "3TB": 3e12, "10 bytes": 10, "-5 kB": -5000 };
  for (const [text, expected] of Object.entries(cases)) assert.equal(parseBytes(text), expected, text);
  for (const bad of ["", "big", "10 parsec", "GB", "1.2.3 MB"]) assert.throws(() => parseBytes(bad), TypeError, bad);
  assert.equal(parseBytes(bytes(5_000_000)), 5_000_000);
});

test("numbers, compact and percent follow the locale", () => {
  assert.equal(number(1234567.891), "1,234,567.89");
  assert.equal(number(1234567.891, { locale: "nl-NL" }), "1.234.567,89");
  assert.equal(number(5, { decimals: 0 }), "5");
  assert.equal(compact(1234), "1.2K");
  assert.equal(compact(2_500_000), "2.5M");
  assert.equal(compact(999), "999");
  assert.equal(percent(0.256), "26%");
  assert.equal(percent(0.2564, { decimals: 1 }), "25.6%");
  assert.equal(nbsp(percent(0.5, { locale: "nl-NL" })), "50%");
  assert.throws(() => number(Infinity), TypeError);
});

test("ago: units, past and future, languages", () => {
  const now = Date.UTC(2026, 9, 17, 12, 0, 0);
  const at = (ms) => now + ms;
  const M = 60_000, H = 3_600_000, D = 86_400_000;
  assert.equal(ago(at(-10_000), { now }), "now");
  assert.equal(ago(at(-3 * M), { now }), "3 minutes ago");
  assert.equal(ago(at(-M), { now }), "1 minute ago");
  assert.equal(ago(at(-2 * H), { now }), "2 hours ago");
  assert.equal(ago(at(-D), { now }), "yesterday");
  assert.equal(ago(at(D), { now }), "tomorrow");
  assert.equal(ago(at(-3 * D), { now }), "3 days ago");
  assert.equal(ago(at(14 * D), { now }), "in 2 weeks");
  assert.equal(ago(at(-60 * D), { now }), "2 months ago");
  assert.equal(ago(at(-400 * D), { now }), "last year");
  assert.equal(ago(at(-3 * M), { now, locale: "nl-NL" }), "3 minuten geleden");
  assert.equal(ago(at(-D), { now, locale: "nl-NL" }), "gisteren");
  assert.equal(ago(at(2 * D), { now, locale: "nl-NL" }), "overmorgen");
  assert.equal(ago(at(-3 * D), { now, locale: "nl" }), "3 dagen geleden");
  assert.equal(ago(new Date(at(-2 * H)), { now }), "2 hours ago");
  assert.equal(ago(new Date(at(-2 * H)).toISOString(), { now }), "2 hours ago");
  assert.equal(ago(at(-2 * H), { now, numeric: "always" }), "2 hours ago");
  assert.equal(ago(at(-D), { now, numeric: "always" }), "1 day ago");
  assert.throws(() => ago("not a date"), TypeError);
});

test("plural and count pick the right form in several languages", () => {
  const task = { one: "task", other: "tasks" };
  assert.equal(plural(1, task), "task");
  assert.equal(plural(2, task), "tasks");
  assert.equal(plural(0, task), "tasks");
  assert.equal(plural(0, { zero: "no tasks", ...task }), "no tasks");
  assert.equal(plural(1.5, task), "tasks");
  assert.equal(count(1, task), "1 task");
  assert.equal(count(1234, task), "1,234 tasks");
  assert.equal(count(0, { zero: "nothing", ...task }), "nothing");
  assert.equal(count(2, { one: "taak", other: "taken" }, "nl"), "2 taken");
  const pl = { one: "plik", few: "pliki", many: "plików", other: "pliku" };
  assert.deepEqual([1, 2, 5, 22].map((n) => plural(n, pl, "pl")), ["plik", "pliki", "plików", "pliki"]);
  assert.throws(() => plural(1, {}), RangeError);
  assert.throws(() => plural("x", task), TypeError);
});

test("lists and ordinals", () => {
  assert.equal(list(["a"]), "a");
  assert.equal(list(["a", "b"]), "a and b");
  assert.equal(list(["a", "b", "c"]), "a, b, and c");
  assert.equal(list(["a", "b", "c"], { locale: "nl" }), "a, b en c");
  assert.equal(list(["a", "b", "c"], { type: "or" }), "a, b, or c");
  assert.equal(list([]), "");
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map((n) => ordinal(n)), ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th"]);
  assert.equal(ordinal(3, "nl"), "3e");
  assert.throws(() => ordinal(1.5), TypeError);
});

test("truncate counts what people see", () => {
  assert.equal(truncate("short", 10), "short");
  assert.equal(truncate("The quick brown fox", 10), "The quick…");
  assert.equal(truncate("The quick brown fox", 12, { atWord: true }), "The quick…");
  assert.equal(truncate("abcdef", 4, { ellipsis: "..." }), "a...");
  assert.equal(truncate("👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦", 2), "👨‍👩‍👧‍👦…");
  assert.equal(truncate("éééé", 3), "éé…");
  assert.equal(truncate("abc", 3), "abc");
  assert.throws(() => truncate("x", 0), RangeError);
});

test("initials", () => {
  assert.equal(initials("Kaj van Schalkwijk"), "KS");
  assert.equal(initials("Kaj van Schalkwijk", { all: true }), "KVS");
  assert.equal(initials("Anna"), "A");
  assert.equal(initials("  Piet   de  Vries "), "PV");
  assert.equal(initials("Jan Pieter Smit"), "JS");
  assert.equal(initials("élodie dupont"), "ÉD");
  assert.equal(initials(""), "");
});
