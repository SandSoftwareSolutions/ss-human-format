# @sandsoftwaresolutions/human-format

[![CI](https://github.com/SandSoftwareSolutions/ss-human-format/actions/workflows/ci.yml/badge.svg)](https://github.com/SandSoftwareSolutions/ss-human-format/actions/workflows/ci.yml)

Numbers and dates the way a person says them: `1.5 MB`, `3 minutes ago` / `3 minuten geleden`, `2 taken`, `a, b en c`. Everything is built on the languages and rules that Node already knows (`Intl`), so there is no dictionary to maintain. No dependencies.

## Install

```bash
npm install @sandsoftwaresolutions/human-format
```

## Usage

```js
import { bytes, parseBytes, number, compact, percent, ago, plural, count, list, ordinal, truncate, initials } from "@sandsoftwaresolutions/human-format";

bytes(1536);                              // "1.5 kB"      (binary: true gives "1.5 KiB")
bytes(1536, { locale: "nl-NL" });         // "1,5 kB"
parseBytes("1,5 GiB");                    // 1610612736

number(1234567.891, { locale: "nl-NL" }); // "1.234.567,89"
compact(2_500_000);                       // "2.5M"
percent(0.256);                           // "26%"

ago(fiveMinutesAgo);                      // "5 minutes ago"
ago(tomorrow, { locale: "nl-NL" });       // "morgen"
ago(lastWeek, { locale: "nl" });          // "vorige week"

count(2, { one: "taak", other: "taken" }, "nl");   // "2 taken"
plural(1, { one: "task", other: "tasks" });        // "task"
plural(0, { zero: "no tasks", one: "task", other: "tasks" });   // "no tasks"

list(["koffie", "thee", "water"], { locale: "nl" });  // "koffie, thee en water"
ordinal(22);                              // "22nd"      ordinal(3, "nl") -> "3e"

truncate("The quick brown fox", 10);      // "The quick…"
initials("Kaj van Schalkwijk");           // "KS"
```

## Details

- **`bytes`** rounds up to the next unit instead of showing `1000 kB`, counts in 1000s by default (like macOS and disk makers) or 1024s with `binary: true`, and `parseBytes` reads it back (`kB` and `KiB` are different, as they should be).
- **`ago`** chooses the unit for you (seconds, minutes, hours, days, weeks, months, years), says `yesterday` / `gisteren` instead of "1 day ago" (`numeric: "always"` turns that off), and calls anything under 45 seconds `now`. Pass `now` in tests.
- **`plural`** follows each language's real rules, not just "one or many": Polish has `one`, `few`, `many` and `other`. Give the forms you need and `other` as the fallback; `zero` is a special word for exactly 0.
- **`truncate`** counts what people see, so it never cuts an emoji family or a letter with an accent in half; `atWord: true` cuts at a space.
- **`initials`** takes the first and last name and skips lower-case particles (`van`, `de`) unless `all: true`.
- Dutch (`nl`) and English (`en`) are tested; the `Intl`-based functions work with any language your Node has data for (full ICU is included in standard Node builds).
